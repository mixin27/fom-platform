import { Injectable } from '@nestjs/common';

type FieldSource = 'message' | 'customer_match' | 'default';

type ParsedItemDraft = {
  product_name: string | null;
  qty: number | null;
  unit_price: number | null;
  line_total: number | null;
};

type ParsedCustomerDraft = {
  name: string | null;
  phone: string | null;
  township: string | null;
  address: string | null;
};

type ParsedOrderDraft = {
  customer: ParsedCustomerDraft;
  items: ParsedItemDraft[];
  delivery_fee: number | null;
  subtotal: number;
  total_price: number;
  currency: 'MMK';
  status: 'new' | 'confirmed';
  source: 'messenger';
  note: string | null;
};

type ParseMeta = {
  is_ready_to_create: boolean;
  confidence: number;
  matched_fields: string[];
  field_sources: Record<string, FieldSource>;
  warnings: string[];
  unparsed_lines: string[];
};

type ParseResult = {
  suggested_order: ParsedOrderDraft;
  parse_meta: ParseMeta;
};

type LineInfo = {
  index: number;
  raw: string;
  normalized: string;
  lower: string;
};

const MYANMAR_DIGIT_MAP: Record<string, string> = {
  '၀': '0',
  '၁': '1',
  '၂': '2',
  '၃': '3',
  '၄': '4',
  '၅': '5',
  '၆': '6',
  '၇': '7',
  '၈': '8',
  '၉': '9',
};

const TOWNSHIP_PATTERNS = [
  /\b([a-z][a-z\s]+?)\s+(?:tsp|township)\b/i,
  /\b([က-အ][က-အ\s]+?)\s*မြို့နယ်/u,
] as const;

const PRODUCT_LABEL_PATTERNS = [
  /^(?:product(?:\s*name)?|item|ပစ္စည်း|ကုန်ပစ္စည်း)\s*[:\-]?\s*(.+)$/i,
] as const;

const QTY_LABEL_PATTERNS = [
  /^(?:qty|quantity|အရေအတွက်)\s*[:\-]?\s*(.+)$/i,
] as const;

const PRICE_LABEL_PATTERNS = [
  /^(?:unit\s*price|price|amount|ဈေး|စျေး|ကျသင့်ငွေ)\s*[:\-]?\s*(.+)$/i,
] as const;

const DELIVERY_FEE_LABEL_PATTERNS = [
  /^(?:delivery(?:\s*fee)?|deli(?:very)?|ပို့ခ|အိမ်အရောက်ခ)\s*[:\-]?\s*(.+)$/i,
] as const;

const NOTE_LABEL_PATTERNS = [
  /^(?:note|remark|မှတ်ချက်)\s*[:\-]?\s*(.+)$/i,
] as const;

@Injectable()
export class OrderMessageParserService {
  parseMessage(message: string): ParseResult {
    const lines = this.toLines(message);
    const consumedLineIndexes = new Set<number>();
    const matchedFields = new Set<string>();
    const fieldSources: Record<string, FieldSource> = {};
    const warnings: string[] = [];

    const customer: ParsedCustomerDraft = {
      name: null,
      phone: null,
      township: null,
      address: null,
    };

    const setField = (
      fieldPath: string,
      value: string | number | null,
      source: FieldSource,
    ) => {
      if (value === null || value === '') {
        return;
      }

      matchedFields.add(fieldPath);
      fieldSources[fieldPath] = source;
    };

    const labeledName = this.extractLabeledValue(lines, [
      /^(?:customer\s+name|name|customer|နာမည်|အမည်)\s*[:\-]\s*(.+)$/i,
    ]);
    if (labeledName) {
      customer.name = labeledName.value;
      consumedLineIndexes.add(labeledName.index);
      setField('customer.name', customer.name, 'message');
    }

    const labeledPhone = this.extractLabeledValue(lines, [
      /^(?:phone(?:\s*number)?|tel|ph|ဖုန်း(?:နံပါတ်)?)\s*[:\-]?\s*(.+)$/i,
    ]);
    if (labeledPhone) {
      customer.phone = this.normalizePhone(labeledPhone.value);
      consumedLineIndexes.add(labeledPhone.index);
      setField('customer.phone', customer.phone, 'message');
    } else {
      const phoneCandidate = this.extractPhone(lines);
      if (phoneCandidate) {
        customer.phone = phoneCandidate.phone;
        consumedLineIndexes.add(phoneCandidate.index);
        setField('customer.phone', customer.phone, 'message');
      }
    }

    const labeledTownship = this.extractLabeledValue(lines, [
      /^(?:township|town|tsp|မြို့နယ်)\s*[:\-]?\s*(.+)$/i,
    ]);
    if (labeledTownship) {
      customer.township = labeledTownship.value;
      consumedLineIndexes.add(labeledTownship.index);
      setField('customer.township', customer.township, 'message');
    }

    const labeledAddress = this.extractLabeledValue(lines, [
      /^(?:address|delivery\s+address|လိပ်စာ|နေရပ်)\s*[:\-]?\s*(.+)$/i,
    ]);
    if (labeledAddress) {
      customer.address = labeledAddress.value;
      consumedLineIndexes.add(labeledAddress.index);
      setField('customer.address', customer.address, 'message');
    } else {
      const addressCandidate = this.extractAddress(lines, consumedLineIndexes);
      if (addressCandidate) {
        customer.address = addressCandidate.value;
        consumedLineIndexes.add(addressCandidate.index);
        setField('customer.address', customer.address, 'message');
      }
    }

    if (!customer.township && customer.address) {
      const township = this.extractTownshipFromAddress(customer.address);
      if (township) {
        customer.township = township;
        setField('customer.township', customer.township, 'message');
      }
    }

    if (!customer.name) {
      const fallbackName = this.extractName(lines, consumedLineIndexes);
      if (fallbackName) {
        customer.name = fallbackName.value;
        consumedLineIndexes.add(fallbackName.index);
        setField('customer.name', customer.name, 'message');
      }
    }

    const labeledQty = this.extractLabeledValue(lines, QTY_LABEL_PATTERNS);
    const labeledPrice = this.extractLabeledValue(lines, PRICE_LABEL_PATTERNS);
    const labeledDeliveryFee = this.extractLabeledValue(
      lines,
      DELIVERY_FEE_LABEL_PATTERNS,
    );
    const labeledNote = this.extractLabeledValue(lines, NOTE_LABEL_PATTERNS);

    const items: ParsedItemDraft[] = this.extractItemsFromLabeledProductBlocks(
      lines,
      consumedLineIndexes,
      warnings,
    );

    if (labeledDeliveryFee) {
      consumedLineIndexes.add(labeledDeliveryFee.index);
    }
    if (labeledNote) {
      consumedLineIndexes.add(labeledNote.index);
    }

    for (const line of lines) {
      if (consumedLineIndexes.has(line.index)) {
        continue;
      }

      const parsedItem = this.tryParseItemLine(line.raw);
      if (!parsedItem) {
        continue;
      }

      items.push(parsedItem);
      consumedLineIndexes.add(line.index);
    }

    if (items.length === 0) {
      const fallbackProduct = this.extractFallbackProductLine(
        lines,
        consumedLineIndexes,
      );
      if (fallbackProduct) {
        const fallbackQty = labeledQty
          ? this.parseQuantity(labeledQty.value)
          : this.extractFallbackQuantity(lines, consumedLineIndexes);
        const fallbackPrice = labeledPrice
          ? this.parseMoney(labeledPrice.value)
          : this.extractFallbackPrice(lines, consumedLineIndexes);

        items.push({
          product_name: fallbackProduct.value,
          qty: fallbackQty ?? 1,
          unit_price: fallbackPrice,
          line_total:
            fallbackPrice !== null ? (fallbackQty ?? 1) * fallbackPrice : null,
        });
        consumedLineIndexes.add(fallbackProduct.index);

        if (fallbackQty === null) {
          warnings.push('Quantity was not detected. Defaulted to 1.');
        }
      }
    }

    const deliveryFee = labeledDeliveryFee
      ? this.parseMoney(labeledDeliveryFee.value)
      : this.extractFallbackDeliveryFee(lines, consumedLineIndexes);
    if (deliveryFee !== null) {
      setField('delivery_fee', deliveryFee, 'message');
    }

    const note = labeledNote?.value ?? null;
    if (note) {
      setField('note', note, 'message');
    }

    for (const [index, item] of items.entries()) {
      if (item.product_name) {
        setField(`items.${index}.product_name`, item.product_name, 'message');
      }
      if (item.qty !== null) {
        setField(`items.${index}.qty`, item.qty, 'message');
      }
      if (item.unit_price !== null) {
        setField(`items.${index}.unit_price`, item.unit_price, 'message');
      }
    }

    const status = this.detectStatus(message);
    setField('status', status, status === 'new' ? 'default' : 'message');
    setField('source', 'messenger', 'default');

    const subtotal = items.reduce(
      (sum, item) => sum + (item.line_total ?? 0),
      0,
    );
    const totalPrice = subtotal + (deliveryFee ?? 0);

    warnings.push(...this.buildWarnings(customer, items));

    const parseMeta: ParseMeta = {
      is_ready_to_create: this.isReadyToCreate(customer, items),
      confidence: this.calculateConfidence(customer, items, deliveryFee),
      matched_fields: [...matchedFields].sort(),
      field_sources: fieldSources,
      warnings,
      unparsed_lines: lines
        .filter((line) => !consumedLineIndexes.has(line.index))
        .map((line) => line.raw)
        .filter((line) => line.length > 0),
    };

    return {
      suggested_order: {
        customer,
        items,
        delivery_fee: deliveryFee,
        subtotal,
        total_price: totalPrice,
        currency: 'MMK',
        status,
        source: 'messenger',
        note,
      },
      parse_meta: parseMeta,
    };
  }

  backfillMissingCustomerFields(
    result: ParseResult,
    customerMatch: {
      name: string;
      phone: string;
      township: string | null;
      address: string | null;
    },
  ) {
    const assign = (
      fieldPath: keyof ParsedCustomerDraft,
      fallbackValue: string | null,
    ) => {
      if (!fallbackValue) {
        return;
      }

      if (!result.suggested_order.customer[fieldPath]) {
        result.suggested_order.customer[fieldPath] = fallbackValue;
        result.parse_meta.field_sources[`customer.${fieldPath}`] =
          'customer_match';
      }
    };

    assign('name', customerMatch.name);
    assign('phone', customerMatch.phone);
    assign('township', customerMatch.township);
    assign('address', customerMatch.address);

    result.parse_meta.matched_fields = Object.keys(result.parse_meta.field_sources)
      .sort();
    result.parse_meta.is_ready_to_create = this.isReadyToCreate(
      result.suggested_order.customer,
      result.suggested_order.items,
    );
    result.parse_meta.confidence = this.calculateConfidence(
      result.suggested_order.customer,
      result.suggested_order.items,
      result.suggested_order.delivery_fee,
    );
    result.parse_meta.warnings = this.buildWarnings(
      result.suggested_order.customer,
      result.suggested_order.items,
    );
  }

  private toLines(message: string): LineInfo[] {
    return this.normalizeText(message)
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line, index) => ({
        index,
        raw: line,
        normalized: line,
        lower: line.toLowerCase(),
      }));
  }

  private normalizeText(value: string): string {
    return value
      .replace(/[၀-၉]/g, (digit) => MYANMAR_DIGIT_MAP[digit] ?? digit)
      .replace(/[၊]/g, ', ')
      .replace(/[။]/g, '. ')
      .replace(/[×]/g, 'x')
      .replace(/\r/g, '\n')
      .replace(/\n{2,}/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  private extractLabeledValue(
    lines: LineInfo[],
    patterns: readonly RegExp[],
  ): { index: number; value: string } | null {
    return this.extractLabeledValues(lines, patterns)[0] ?? null;
  }

  private extractLabeledValues(
    lines: LineInfo[],
    patterns: readonly RegExp[],
  ): Array<{ index: number; value: string }> {
    const values: Array<{ index: number; value: string }> = [];

    for (const line of lines) {
      const value = this.matchLabeledValue(line.raw, patterns);
      if (!value) {
        continue;
      }

      values.push({
        index: line.index,
        value,
      });
    }

    return values;
  }

  private matchLabeledValue(
    value: string,
    patterns: readonly RegExp[],
  ): string | null {
    for (const pattern of patterns) {
      const match = value.match(pattern);
      if (!match?.[1]) {
        continue;
      }

      const extracted = match[1].trim();
      if (extracted.length === 0) {
        continue;
      }

      return extracted;
    }

    return null;
  }

  private extractItemsFromLabeledProductBlocks(
    lines: LineInfo[],
    consumedLineIndexes: Set<number>,
    warnings: string[],
  ): ParsedItemDraft[] {
    const items: ParsedItemDraft[] = [];

    let currentItem: {
      product_name: string;
      qty: number | null;
      unit_price: number | null;
    } | null = null;

    const flushCurrentItem = () => {
      if (!currentItem) {
        return;
      }

      items.push({
        product_name: currentItem.product_name,
        qty: currentItem.qty ?? 1,
        unit_price: currentItem.unit_price,
        line_total:
          currentItem.unit_price !== null
            ? (currentItem.qty ?? 1) * currentItem.unit_price
            : null,
      });

      if (currentItem.qty === null) {
        warnings.push(
          'One or more item quantities were not detected. Defaulted to 1.',
        );
      }

      currentItem = null;
    };

    for (const line of lines) {
      const productValue = this.matchLabeledValue(line.raw, PRODUCT_LABEL_PATTERNS);
      if (productValue) {
        flushCurrentItem();
        consumedLineIndexes.add(line.index);

        const inlineSegments = this.splitInlineItemSegments(productValue);
        if (inlineSegments.length > 1) {
          for (const segment of inlineSegments) {
            const inlineItem =
              this.tryParseItemLine(segment) ?? this.toInlineItemDraft(segment);
            if (!inlineItem) {
              continue;
            }

            items.push(inlineItem);
          }
          continue;
        }

        const productName = this.cleanProductName(productValue);
        if (!productName) {
          continue;
        }

        currentItem = {
          product_name: productName,
          qty: this.extractQuantityFromText(productValue),
          unit_price: this.extractPriceFromText(productValue),
        };
        continue;
      }

      if (!currentItem) {
        continue;
      }

      const qtyValue = this.matchLabeledValue(line.raw, QTY_LABEL_PATTERNS);
      if (qtyValue && currentItem.qty === null) {
        currentItem.qty = this.parseQuantity(qtyValue);
        consumedLineIndexes.add(line.index);
        continue;
      }

      const priceValue = this.matchLabeledValue(line.raw, PRICE_LABEL_PATTERNS);
      if (priceValue && currentItem.unit_price === null) {
        currentItem.unit_price = this.parseMoney(priceValue);
        consumedLineIndexes.add(line.index);
      }
    }

    flushCurrentItem();

    return items;
  }

  private extractPhone(lines: LineInfo[]) {
    const phonePattern = /(?:\+?95|0)9[\d\s\-]{7,14}\d/g;

    for (const line of lines) {
      const match = line.raw.match(phonePattern)?.[0];
      if (!match) {
        continue;
      }

      return {
        index: line.index,
        phone: this.normalizePhone(match),
      };
    }

    return null;
  }

  private extractAddress(
    lines: LineInfo[],
    consumedLineIndexes: Set<number>,
  ): { index: number; value: string } | null {
    for (const line of lines) {
      if (consumedLineIndexes.has(line.index)) {
        continue;
      }

      if (
        /(?:street|st\b|road|rd\b|lane|house|no\.?|block|floor|room|လမ်း|အိမ်|အမှတ်)/i.test(
          line.raw,
        ) ||
        (line.raw.includes(',') && line.raw.length >= 12)
      ) {
        return {
          index: line.index,
          value: line.raw,
        };
      }
    }

    return null;
  }

  private extractTownshipFromAddress(address: string): string | null {
    for (const pattern of TOWNSHIP_PATTERNS) {
      const match = address.match(pattern);
      if (match?.[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  private extractName(
    lines: LineInfo[],
    consumedLineIndexes: Set<number>,
  ): { index: number; value: string } | null {
    for (const line of lines) {
      if (consumedLineIndexes.has(line.index)) {
        continue;
      }

      if (
        /\d/.test(line.raw) ||
        /(?:street|road|lane|address|လိပ်စာ|ပို့ခ|price|qty|product|item)/i.test(
          line.lower,
        )
      ) {
        continue;
      }

      if (line.raw.length < 3) {
        continue;
      }

      return {
        index: line.index,
        value: line.raw,
      };
    }

    return null;
  }

  private tryParseItemLine(line: string): ParsedItemDraft | null {
    const cleaned = line
      .replace(/^\s*[-*•]\s*/, '')
      .replace(/^\s*\d+[\).]\s*/, '')
      .trim();

    const combinedPatterns: RegExp[] = [
      /^(.*?)\s*[x]\s*(\d+)\s*[-–—]?\s*([0-9][0-9,]*(?:\.\d+)?\s*[kK]?)\s*(?:mmk|ks|kyats?|ကျပ်)?$/i,
      /^(.*?)\s+(\d+)\s*(?:pcs?|pc|qty|ခု|ထည်|set)s?\s+([0-9][0-9,]*(?:\.\d+)?\s*[kK]?)\s*(?:mmk|ks|kyats?|ကျပ်)?$/i,
      /^(.*?)\s*[-–—]\s*([0-9][0-9,]*(?:\.\d+)?\s*[kK]?)\s*(?:mmk|ks|kyats?|ကျပ်)?$/i,
    ];

    for (const pattern of combinedPatterns) {
      const match = cleaned.match(pattern);
      if (!match) {
        continue;
      }

      const productName = this.cleanProductName(match[1] ?? '');
      if (!productName) {
        continue;
      }

      if (match.length >= 4) {
        const qty = this.parseQuantity(match[2] ?? '');
        const unitPrice = this.parseMoney(match[3] ?? '');
        if (qty === null || unitPrice === null || unitPrice < 500) {
          continue;
        }

        return {
          product_name: productName,
          qty,
          unit_price: unitPrice,
          line_total: qty * unitPrice,
        };
      }

      const unitPrice = this.parseMoney(match[2] ?? '');
      if (unitPrice === null || unitPrice < 500) {
        continue;
      }

      return {
        product_name: productName,
        qty: 1,
        unit_price: unitPrice,
        line_total: unitPrice,
      };
    }

    return null;
  }

  private splitInlineItemSegments(value: string): string[] {
    return value
      .split(/\s*(?:;|\|)\s*/g)
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);
  }

  private toInlineItemDraft(value: string): ParsedItemDraft | null {
    const productName = this.cleanProductName(value);
    if (!productName) {
      return null;
    }

    const qty = this.extractQuantityFromText(value);
    const unitPrice = this.extractPriceFromText(value);

    return {
      product_name: productName,
      qty: qty ?? 1,
      unit_price: unitPrice,
      line_total:
        unitPrice !== null ? (qty ?? 1) * unitPrice : null,
    };
  }

  private extractFallbackProductLine(
    lines: LineInfo[],
    consumedLineIndexes: Set<number>,
  ): { index: number; value: string } | null {
    for (const line of lines) {
      if (consumedLineIndexes.has(line.index)) {
        continue;
      }

      if (
        /\d{3,}/.test(line.raw) ||
        /(?:street|road|lane|address|လိပ်စာ|ပို့ခ|delivery|phone|qty|price)/i.test(
          line.lower,
        )
      ) {
        continue;
      }

      if (line.raw.length < 3) {
        continue;
      }

      return {
        index: line.index,
        value: this.cleanProductName(line.raw),
      };
    }

    return null;
  }

  private extractFallbackQuantity(
    lines: LineInfo[],
    consumedLineIndexes: Set<number>,
  ): number | null {
    for (const line of lines) {
      if (consumedLineIndexes.has(line.index)) {
        continue;
      }

      const parsed = this.parseQuantity(line.raw);
      if (parsed === null) {
        continue;
      }

      if (parsed < 1 || parsed > 99) {
        continue;
      }

      return parsed;
    }

    return null;
  }

  private extractFallbackPrice(
    lines: LineInfo[],
    consumedLineIndexes: Set<number>,
  ): number | null {
    for (const line of lines) {
      if (consumedLineIndexes.has(line.index)) {
        continue;
      }

      const parsed = this.parseMoney(line.raw);
      if (parsed === null || parsed < 500) {
        continue;
      }

      return parsed;
    }

    return null;
  }

  private extractFallbackDeliveryFee(
    lines: LineInfo[],
    consumedLineIndexes: Set<number>,
  ): number | null {
    for (const line of lines) {
      if (consumedLineIndexes.has(line.index)) {
        continue;
      }

      if (!/(?:deli|delivery|ပို့ခ|အိမ်အရောက်)/i.test(line.raw)) {
        continue;
      }

      const parsed = this.parseMoney(line.raw);
      if (parsed !== null) {
        consumedLineIndexes.add(line.index);
        return parsed;
      }
    }

    return null;
  }

  private detectStatus(message: string): 'new' | 'confirmed' {
    return /(?:paid|payment\s*(?:sent|done|confirmed)|ငွေလွှဲ(?:ပြီး|ထား)|လွှဲပြီး|payment\s*screenshot)/i.test(
      message,
    )
      ? 'confirmed'
      : 'new';
  }

  private isReadyToCreate(
    customer: ParsedCustomerDraft,
    items: ParsedItemDraft[],
  ): boolean {
    return Boolean(
      customer.name &&
        customer.phone &&
        items.length > 0 &&
        items.every(
          (item) =>
            item.product_name &&
            item.qty !== null &&
            item.qty > 0 &&
            item.unit_price !== null,
        ),
    );
  }

  private calculateConfidence(
    customer: ParsedCustomerDraft,
    items: ParsedItemDraft[],
    deliveryFee: number | null,
  ): number {
    const checks = [
      Boolean(customer.name),
      Boolean(customer.phone),
      Boolean(customer.address),
      Boolean(items[0]?.product_name),
      Boolean(items[0]?.qty),
      Boolean(items[0]?.unit_price !== null && items[0]?.unit_price !== undefined),
      deliveryFee !== null,
    ];

    const score = checks.filter(Boolean).length / checks.length;
    return Number.parseFloat(score.toFixed(2));
  }

  private buildWarnings(
    customer: ParsedCustomerDraft,
    items: ParsedItemDraft[],
  ): string[] {
    const warnings: string[] = [];

    if (!customer.name) {
      warnings.push('Customer name was not detected.');
    }
    if (!customer.phone) {
      warnings.push('Phone number was not detected.');
    }
    if (items.length === 0 || !items[0]?.product_name) {
      warnings.push('Product name was not detected.');
    }
    if (items.length > 0 && items.some((item) => item.unit_price === null)) {
      warnings.push('One or more item prices were not detected.');
    }

    return warnings;
  }

  private normalizePhone(phone: string): string {
    return phone
      .replace(/\+?959/, '09')
      .replace(/[^\d]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private parseQuantity(value: string): number | null {
    const match = value.match(/(?:x\s*)?(\d{1,3})/i);
    if (!match?.[1]) {
      return null;
    }

    const parsed = Number.parseInt(match[1], 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private parseMoney(value: string): number | null {
    const normalized = value
      .toLowerCase()
      .replace(/mmk|ks|kyats?|ကျပ်/g, '')
      .trim();
    const match = normalized.match(/(\d[\d,]*(?:\.\d+)?)(\s*[k])?/i);
    if (!match?.[1]) {
      return null;
    }

    const numeric = Number.parseFloat(match[1].replace(/,/g, ''));
    if (!Number.isFinite(numeric)) {
      return null;
    }

    return match[2] ? Math.round(numeric * 1000) : Math.round(numeric);
  }

  private extractQuantityFromText(value: string): number | null {
    const quantityMatch = value.match(/[x]\s*(\d{1,3})/i);
    if (quantityMatch?.[1]) {
      return Number.parseInt(quantityMatch[1], 10);
    }

    return null;
  }

  private extractPriceFromText(value: string): number | null {
    const matches = [...value.matchAll(/(\d[\d,]*(?:\.\d+)?)(\s*[kK])?/g)];
    for (let index = matches.length - 1; index >= 0; index -= 1) {
      const candidate = matches[index];
      if (!candidate) {
        continue;
      }

      const parsed = this.parseMoney(candidate[0]);
      if (parsed !== null && parsed >= 500) {
        return parsed;
      }
    }

    return this.parseMoney(value);
  }

  private cleanProductName(value: string): string {
    return value
      .replace(/[x]\s*\d{1,3}\b.*$/i, '')
      .replace(/\b\d[\d,]*(?:\.\d+)?\s*(?:mmk|ks|kyats?|k|ကျပ်)?\b.*$/i, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/[-–—,\s]+$/g, '')
      .trim();
  }
}
