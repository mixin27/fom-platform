import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { validationError, type ErrorDetail } from '../common/http/app-http.exception';
import {
  orderSources,
  orderStatuses,
  type OrderSourceValue,
  type OrderStatusValue,
} from './dto/order.constants';
import type { ImportOrdersSpreadsheetDto } from './dto/import-orders-spreadsheet.dto';

const templateSheetName = 'Orders';
const instructionsSheetName = 'Instructions';
const maxImportFileBytes = 5 * 1024 * 1024;
const maxReportedErrors = 25;

type SpreadsheetImportItem = {
  productId: string | null;
  productName: string;
  qty: number;
  unitPrice: number;
};

export type SpreadsheetImportOrder = {
  groupingKey: string;
  rowNumbers: number[];
  customerName: string;
  customerPhone: string;
  customerTownship: string | null;
  customerAddress: string | null;
  status: OrderStatusValue;
  source: OrderSourceValue;
  currency: string;
  deliveryFee: number;
  note: string | null;
  orderedAt: Date | null;
  items: SpreadsheetImportItem[];
};

export type ParsedOrdersSpreadsheet = {
  filename: string;
  format: 'csv' | 'xlsx';
  sourceRowCount: number;
  orders: SpreadsheetImportOrder[];
};

@Injectable()
export class OrderSpreadsheetService {
  buildImportTemplate(shopName: string) {
    const workbook = XLSX.utils.book_new();
    const instructionsSheet = XLSX.utils.aoa_to_sheet([
      ['FOM order import template'],
      [''],
      ['How to use'],
      [
        '1. Fill the Orders sheet with one row per order item. Reuse order_ref when one order has multiple items.',
      ],
      [
        '2. order_ref is only used to group rows during import. FOM will generate fresh order numbers after import.',
      ],
      [
        '3. ordered_at is optional. Leave it blank to import the order with the current date and time.',
      ],
      [
        '4. Existing orders.csv exports are also accepted. The importer understands the compact items column format.',
      ],
      [''],
      ['Active shop'],
      [shopName.trim() || 'Shop'],
      [''],
      ['Accepted status values'],
      [orderStatuses.join(', ')],
      ['Accepted source values'],
      [orderSources.join(', ')],
    ]);
    const templateSheet = XLSX.utils.aoa_to_sheet([
      [
        'order_ref',
        'customer_name',
        'customer_phone',
        'customer_township',
        'customer_address',
        'status',
        'source',
        'currency',
        'delivery_fee',
        'note',
        'ordered_at',
        'product_name',
        'qty',
        'unit_price',
        'product_id',
      ],
      [
        'ORDER-001',
        'Daw Mya Mya',
        '09 4200 11223',
        'Hlaing',
        'No. 12, Main Road',
        'delivered',
        'manual',
        'MMK',
        '2000',
        'Paid in cash',
        '2026-04-01T09:30:00+06:30',
        'T-Shirt',
        '2',
        '12000',
        '',
      ],
      [
        'ORDER-001',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        'Canvas Bag',
        '1',
        '9000',
        '',
      ],
    ]);

    XLSX.utils.book_append_sheet(workbook, instructionsSheet, instructionsSheetName);
    XLSX.utils.book_append_sheet(workbook, templateSheet, templateSheetName);

    return {
      filename: this.buildTemplateFilename(shopName),
      content: XLSX.write(workbook, {
        type: 'buffer',
        bookType: 'xlsx',
      }) as Buffer,
    };
  }

  parseImportFile(input: ImportOrdersSpreadsheetDto): ParsedOrdersSpreadsheet {
    const filename = input.filename.trim();
    const bytes = this.decodeBase64Content(input.content_base64);
    const format = this.resolveFormat(filename);
    const workbook = XLSX.read(bytes, {
      type: 'buffer',
      raw: false,
      cellDates: false,
    });
    const targetSheetName = workbook.SheetNames.includes(templateSheetName)
      ? templateSheetName
      : workbook.SheetNames[0];

    if (!targetSheetName) {
      throw validationError(
        [
          {
            field: 'file',
            errors: ['The uploaded spreadsheet does not contain any sheets.'],
          },
        ],
        'Unable to import orders from spreadsheet',
      );
    }

    const worksheet = workbook.Sheets[targetSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      raw: false,
      defval: '',
      blankrows: false,
    });

    if (rawRows.length === 0) {
      throw validationError(
        [
          {
            field: 'file',
            errors: ['The uploaded spreadsheet does not contain any order rows.'],
          },
        ],
        'Unable to import orders from spreadsheet',
      );
    }

    const errors: ErrorDetail[] = [];
    const groupedOrders = new Map<string, SpreadsheetImportOrder>();

    rawRows.forEach((rawRow, index) => {
      const rowNumber = index + 2;
      const row = this.normalizeRow(rawRow);
      const parsedItems = this.parseItemsForRow(row, rowNumber, errors);
      const orderKey =
        this.readValue(row, ['order_ref', 'order_reference', 'order_no']) ||
        `row-${rowNumber}`;

      let order = groupedOrders.get(orderKey);
      if (!order) {
        order = {
          groupingKey: orderKey,
          rowNumbers: [],
          customerName: '',
          customerPhone: '',
          customerTownship: null,
          customerAddress: null,
          status: 'new',
          source: 'manual',
          currency: 'MMK',
          deliveryFee: 0,
          note: null,
          orderedAt: null,
          items: [],
        };
        groupedOrders.set(orderKey, order);
      }

      order.rowNumbers.push(rowNumber);
      this.mergeRequiredTextField(
        order,
        'customerName',
        this.readValue(row, ['customer_name', 'name']),
        rowNumber,
        errors,
        'customer_name',
      );
      this.mergeRequiredTextField(
        order,
        'customerPhone',
        this.readValue(row, ['customer_phone', 'phone']),
        rowNumber,
        errors,
        'customer_phone',
      );
      this.mergeOptionalTextField(
        order,
        'customerTownship',
        this.readValue(row, ['customer_township', 'township']) || null,
        rowNumber,
        errors,
        'customer_township',
      );
      this.mergeOptionalTextField(
        order,
        'customerAddress',
        this.readValue(row, ['customer_address', 'address']) || null,
        rowNumber,
        errors,
        'customer_address',
      );

      this.mergeEnumField(
        order,
        'status',
        this.normalizeStatusValue(this.readValue(row, ['status'])),
        rowNumber,
        errors,
        'status',
        orderStatuses,
      );
      this.mergeEnumField(
        order,
        'source',
        this.normalizeSourceValue(this.readValue(row, ['source'])),
        rowNumber,
        errors,
        'source',
        orderSources,
      );
      this.mergeTextFieldWithDefault(
        order,
        'currency',
        this.readValue(row, ['currency']),
        'MMK',
        rowNumber,
        errors,
        'currency',
      );
      this.mergeIntegerField(
        order,
        'deliveryFee',
        this.readValue(row, ['delivery_fee']),
        0,
        rowNumber,
        errors,
        'delivery_fee',
        { min: 0 },
      );
      this.mergeOptionalTextField(
        order,
        'note',
        this.readValue(row, ['note']) || null,
        rowNumber,
        errors,
        'note',
      );
      this.mergeDateField(
        order,
        'orderedAt',
        this.readValue(row, ['ordered_at', 'created_at']),
        rowNumber,
        errors,
        'ordered_at',
      );

      order.items.push(...parsedItems);
    });

    const parsedOrders = [...groupedOrders.values()].filter((order) => {
      if (order.items.length > 0) {
        return true;
      }

      errors.push({
        field: `rows:${order.rowNumbers.join(',')}.items`,
        errors: ['At least one order item is required for each imported order.'],
      });
      return false;
    });

    if (errors.length > 0) {
      throw validationError(
        errors.slice(0, maxReportedErrors),
        'Unable to import orders from spreadsheet',
      );
    }

    return {
      filename,
      format,
      sourceRowCount: rawRows.length,
      orders: parsedOrders,
    };
  }

  private buildTemplateFilename(shopName: string): string {
    const safeShopName = shopName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `${safeShopName || 'shop'}-orders-import-template.xlsx`;
  }

  private decodeBase64Content(contentBase64: string): Buffer {
    const normalized = contentBase64
      .trim()
      .replace(/^data:[^;]+;base64,/, '');

    const bytes = Buffer.from(normalized, 'base64');
    if (bytes.length === 0) {
      throw validationError(
        [
          {
            field: 'content_base64',
            errors: ['The uploaded file content is empty.'],
          },
        ],
        'Unable to import orders from spreadsheet',
      );
    }

    if (bytes.length > maxImportFileBytes) {
      throw validationError(
        [
          {
            field: 'content_base64',
            errors: ['The uploaded file is too large. Please keep it under 5 MB.'],
          },
        ],
        'Unable to import orders from spreadsheet',
      );
    }

    return bytes;
  }

  private resolveFormat(filename: string): 'csv' | 'xlsx' {
    const normalized = filename.trim().toLowerCase();
    if (normalized.endsWith('.csv')) {
      return 'csv';
    }

    return 'xlsx';
  }

  private normalizeRow(row: Record<string, unknown>) {
    return Object.entries(row).reduce<Record<string, string>>((accumulator, entry) => {
      const [key, value] = entry;
      accumulator[this.normalizeHeader(key)] = this.normalizeCellValue(value);
      return accumulator;
    }, {});
  }

  private normalizeHeader(value: string): string {
    return value
      .replace(/^\uFEFF/, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_');
  }

  private normalizeCellValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value).trim();
  }

  private readValue(
    row: Record<string, string>,
    keys: readonly string[],
  ): string {
    for (const key of keys) {
      const value = row[this.normalizeHeader(key)] ?? '';
      if (value.trim()) {
        return value.trim();
      }
    }

    return '';
  }

  private parseItemsForRow(
    row: Record<string, string>,
    rowNumber: number,
    errors: ErrorDetail[],
  ): SpreadsheetImportItem[] {
    const compactItems = this.readValue(row, ['items']);
    if (compactItems) {
      return this.parseCompactItems(compactItems, rowNumber, errors);
    }

    const productName = this.readValue(row, ['product_name']);
    const qtyValue = this.readValue(row, ['qty']);
    const unitPriceValue = this.readValue(row, ['unit_price']);

    if (!productName && !qtyValue && !unitPriceValue) {
      errors.push({
        field: `row:${rowNumber}.product_name`,
        errors: ['Provide product_name, qty, and unit_price for each order item row.'],
      });
      return [];
    }

    const qty = this.parseInteger(qtyValue, {
      field: `row:${rowNumber}.qty`,
      errors,
      min: 1,
    });
    const unitPrice = this.parseInteger(unitPriceValue, {
      field: `row:${rowNumber}.unit_price`,
      errors,
      min: 0,
    });

    if (!productName) {
      errors.push({
        field: `row:${rowNumber}.product_name`,
        errors: ['Product name is required for each order item row.'],
      });
    }

    if (!productName || qty === null || unitPrice === null) {
      return [];
    }

    return [
      {
        productId: this.readValue(row, ['product_id']) || null,
        productName,
        qty,
        unitPrice,
      },
    ];
  }

  private parseCompactItems(
    compactItems: string,
    rowNumber: number,
    errors: ErrorDetail[],
  ): SpreadsheetImportItem[] {
    const segments = compactItems
      .split('|')
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (segments.length === 0) {
      errors.push({
        field: `row:${rowNumber}.items`,
        errors: ['The items column is empty.'],
      });
      return [];
    }

    const parsedItems: SpreadsheetImportItem[] = [];
    for (const segment of segments) {
      const match = segment.match(/^(.*?)\s*x(\d+)\s*@\s*([\d,]+)$/i);
      if (!match) {
        errors.push({
          field: `row:${rowNumber}.items`,
          errors: [
            'Use the items format "Product name x2 @ 12000 | Another product x1 @ 5000".',
          ],
        });
        continue;
      }

      const productName = (match[1] ?? '').trim();
      const qty = Number.parseInt(match[2] ?? '', 10);
      const unitPrice = Number.parseInt((match[3] ?? '').replace(/,/g, ''), 10);

      if (!productName || !Number.isFinite(qty) || qty < 1) {
        errors.push({
          field: `row:${rowNumber}.items`,
          errors: ['Each compact item must include a valid product name and quantity.'],
        });
        continue;
      }

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        errors.push({
          field: `row:${rowNumber}.items`,
          errors: ['Each compact item must include a valid non-negative unit price.'],
        });
        continue;
      }

      parsedItems.push({
        productId: null,
        productName,
        qty,
        unitPrice,
      });
    }

    return parsedItems;
  }

  private mergeRequiredTextField(
    order: SpreadsheetImportOrder,
    field: 'customerName' | 'customerPhone',
    value: string,
    rowNumber: number,
    errors: ErrorDetail[],
    label: string,
  ) {
    this.mergeTextField(order, field, value, rowNumber, errors, label, {
      required: true,
    });
  }

  private mergeOptionalTextField(
    order: SpreadsheetImportOrder,
    field: 'customerTownship' | 'customerAddress' | 'note',
    value: string | null,
    rowNumber: number,
    errors: ErrorDetail[],
    label: string,
  ) {
    this.mergeTextField(order, field, value, rowNumber, errors, label);
  }

  private mergeTextField(
    order: SpreadsheetImportOrder,
    field: 'customerName' | 'customerPhone' | 'customerTownship' | 'customerAddress' | 'note',
    value: string | null,
    rowNumber: number,
    errors: ErrorDetail[],
    label: string,
    options?: { required?: boolean },
  ) {
    const normalized = value?.trim() || '';
    const currentValue =
      typeof order[field] === 'string' ? ((order[field] as string | null) ?? '') : '';

    if (!normalized) {
      if (options?.required && !currentValue) {
        errors.push({
          field: `row:${rowNumber}.${label}`,
          errors: [`${label} is required.`],
        });
      }
      return;
    }

    if (!currentValue) {
      order[field] = normalized as never;
      return;
    }

    if (currentValue !== normalized) {
      errors.push({
        field: `row:${rowNumber}.${label}`,
        errors: [`${label} must stay consistent for the same order_ref.`],
      });
    }
  }

  private mergeTextFieldWithDefault(
    order: SpreadsheetImportOrder,
    field: 'currency',
    value: string,
    fallback: string,
    rowNumber: number,
    errors: ErrorDetail[],
    label: string,
  ) {
    const normalized = value.trim() || fallback;
    if (!order[field]) {
      order[field] = normalized;
      return;
    }

    if (order[field] !== normalized) {
      errors.push({
        field: `row:${rowNumber}.${label}`,
        errors: [`${label} must stay consistent for the same order_ref.`],
      });
    }
  }

  private mergeIntegerField(
    order: SpreadsheetImportOrder,
    field: 'deliveryFee',
    value: string,
    fallback: number,
    rowNumber: number,
    errors: ErrorDetail[],
    label: string,
    options: { min: number },
  ) {
    const parsed = value.trim()
      ? this.parseInteger(value, {
          field: `row:${rowNumber}.${label}`,
          errors,
          min: options.min,
        })
      : fallback;

    if (parsed === null) {
      return;
    }

    if (order[field] === fallback && order.rowNumbers.length === 1) {
      order[field] = parsed;
      return;
    }

    if (order[field] !== parsed) {
      errors.push({
        field: `row:${rowNumber}.${label}`,
        errors: [`${label} must stay consistent for the same order_ref.`],
      });
    }
  }

  private mergeEnumField<T extends string>(
    order: SpreadsheetImportOrder,
    field: 'status' | 'source',
    value: T,
    rowNumber: number,
    errors: ErrorDetail[],
    label: string,
    allowedValues: readonly T[],
  ) {
    const normalized = value.trim()
      ? (value.trim() as T)
      : (order[field] as T);

    if (!allowedValues.includes(normalized)) {
      errors.push({
        field: `row:${rowNumber}.${label}`,
        errors: [`${label} must be one of: ${allowedValues.join(', ')}.`],
      });
      return;
    }

    if (order[field] !== normalized) {
      if (order.rowNumbers.length === 1 && rowNumber === order.rowNumbers[0]) {
        order[field] = normalized as never;
        return;
      }

      errors.push({
        field: `row:${rowNumber}.${label}`,
        errors: [`${label} must stay consistent for the same order_ref.`],
      });
    }
  }

  private mergeDateField(
    order: SpreadsheetImportOrder,
    field: 'orderedAt',
    value: string,
    rowNumber: number,
    errors: ErrorDetail[],
    label: string,
  ) {
    if (!value.trim()) {
      return;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      errors.push({
        field: `row:${rowNumber}.${label}`,
        errors: ['Use a valid ISO date, for example 2026-04-01T09:30:00+06:30.'],
      });
      return;
    }

    if (!order[field]) {
      order[field] = parsed;
      return;
    }

    if (order[field]!.toISOString() !== parsed.toISOString()) {
      errors.push({
        field: `row:${rowNumber}.${label}`,
        errors: [`${label} must stay consistent for the same order_ref.`],
      });
    }
  }

  private normalizeStatusValue(value: string): OrderStatusValue | '' {
    const normalized = value.trim().toLowerCase().replace(/\s+/g, '_');
    return normalized as OrderStatusValue | '';
  }

  private normalizeSourceValue(value: string): OrderSourceValue | '' {
    return value.trim().toLowerCase() as OrderSourceValue | '';
  }

  private parseInteger(
    value: string,
    input: {
      field: string;
      errors: ErrorDetail[];
      min: number;
    },
  ): number | null {
    const normalized = value.trim().replace(/,/g, '');
    const parsed = Number.parseInt(normalized, 10);

    if (!Number.isFinite(parsed)) {
      input.errors.push({
        field: input.field,
        errors: ['Use a whole number value.'],
      });
      return null;
    }

    if (parsed < input.min) {
      input.errors.push({
        field: input.field,
        errors: [`Value must be at least ${input.min}.`],
      });
      return null;
    }

    return parsed;
  }
}
