import "dart:convert";
import "dart:isolate";

import "package:app_ui_kit/app_ui_kit.dart";
import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:fom_mobile/features/orders/domain/entities/order_details.dart";
import "package:fom_mobile/features/orders/domain/entities/order_document_export_format.dart";
import "package:intl/intl.dart";
import "package:pdf/pdf.dart";
import "package:pdf/widgets.dart" as pw;
import "package:screenshot/screenshot.dart";

const Color _invoiceCanvasColor = Colors.white;
const String _documentBrandmarkAssetPath = "assets/branding/favicon.png";
const String _documentBrandLine = "Powered by FOM Order Manager";
const String _documentBrandWebsite = "https://getfom.com";
const String _documentBrandFooter =
    "$_documentBrandLine | $_documentBrandWebsite";
const double _invoicePageWidth = 860;
const double _invoicePageMinHeight = 1216;

class GeneratedOrderDocument {
  const GeneratedOrderDocument({
    required this.fileName,
    required this.mimeType,
    required this.subject,
    this.bytes,
    this.shareText,
  });

  final String fileName;
  final String mimeType;
  final String subject;
  final Uint8List? bytes;
  final String? shareText;
}

abstract class OrderDocumentGenerator {
  Future<GeneratedOrderDocument> generate({
    required OrderDetails order,
    required String shopName,
    required OrderDocumentExportFormat format,
  });
}

class OrderDocumentGeneratorImpl implements OrderDocumentGenerator {
  OrderDocumentGeneratorImpl({ScreenshotController? screenshotController})
    : _screenshotController = screenshotController ?? ScreenshotController();

  final ScreenshotController _screenshotController;

  @override
  Future<GeneratedOrderDocument> generate({
    required OrderDetails order,
    required String shopName,
    required OrderDocumentExportFormat format,
  }) async {
    final subject = _buildSubject(order);
    final baseName = _buildBaseName(shopName: shopName, order: order);

    switch (format) {
      case OrderDocumentExportFormat.text:
        final content = _buildOrderInformationText(
          order: order,
          shopName: shopName,
        );
        return GeneratedOrderDocument(
          fileName: "$baseName-order-info.txt",
          mimeType: format.mimeType,
          subject: subject,
          bytes: Uint8List.fromList(utf8.encode(content)),
          shareText: content,
        );
      case OrderDocumentExportFormat.pdf:
        final bytes = await _buildPdf(order: order, shopName: shopName);
        return GeneratedOrderDocument(
          fileName: "$baseName-invoice.pdf",
          mimeType: format.mimeType,
          subject: subject,
          bytes: bytes,
          shareText: "Invoice ${order.orderNo} from $shopName",
        );
      case OrderDocumentExportFormat.image:
        final bytes = await _buildImage(order: order, shopName: shopName);
        return GeneratedOrderDocument(
          fileName: "$baseName-invoice.png",
          mimeType: format.mimeType,
          subject: subject,
          bytes: bytes,
          shareText: "Invoice ${order.orderNo} from $shopName",
        );
    }
  }

  String _buildSubject(OrderDetails order) {
    return "Order ${order.orderNo} for ${order.customerName}";
  }

  String _buildBaseName({
    required String shopName,
    required OrderDetails order,
  }) {
    final timestamp = DateFormat("yyyyMMdd_HHmmss").format(DateTime.now());
    final safeShopName = _slugify(shopName);
    final safeOrderNo = _slugify(order.orderNo);
    final safeCustomerName = _slugify(order.customerName);

    return [
      safeShopName.isEmpty ? "shop" : safeShopName,
      safeCustomerName.isEmpty ? "customer" : safeCustomerName,
      safeOrderNo.isEmpty ? "order" : safeOrderNo,
      timestamp,
    ].join("-");
  }

  String _slugify(String value) {
    return value
        .trim()
        .toLowerCase()
        .replaceAll(RegExp(r"[^a-z0-9]+"), "-")
        .replaceAll(RegExp(r"^-+|-+$"), "");
  }

  String _buildOrderInformationText({
    required OrderDetails order,
    required String shopName,
  }) {
    final buffer = StringBuffer()
      ..writeln(shopName)
      ..writeln("Order Information")
      ..writeln("")
      ..writeln("Order No: ${order.orderNo}")
      ..writeln("Status: ${_statusLabel(order)}")
      ..writeln("Created At: ${_formatDateTime(order.createdAt)}")
      ..writeln("Updated At: ${_formatDateTime(order.updatedAt)}")
      ..writeln("")
      ..writeln("Customer")
      ..writeln("Name: ${order.customerName}")
      ..writeln("Phone: ${order.customerPhone}");

    if ((order.customerTownship ?? "").trim().isNotEmpty) {
      buffer.writeln("Township: ${order.customerTownship!.trim()}");
    }
    if ((order.customerAddress ?? "").trim().isNotEmpty) {
      buffer.writeln("Address: ${order.customerAddress!.trim()}");
    }

    buffer
      ..writeln("")
      ..writeln("Items");

    for (final item in order.items) {
      buffer.writeln(
        "- ${item.productName} x ${item.quantity} · ${_formatMoney(item.lineTotal, order.currency)}",
      );
    }

    buffer
      ..writeln("")
      ..writeln("Subtotal: ${_formatMoney(order.subtotal, order.currency)}")
      ..writeln(
        "Delivery Fee: ${_formatMoney(order.deliveryFee, order.currency)}",
      )
      ..writeln("Total: ${_formatMoney(order.totalPrice, order.currency)}");

    if ((order.note ?? "").trim().isNotEmpty) {
      buffer
        ..writeln("")
        ..writeln("Note")
        ..writeln(order.note!.trim());
    }

    buffer
      ..writeln("")
      ..writeln("---")
      ..writeln(_documentBrandLine)
      ..writeln(_documentBrandWebsite);

    return buffer.toString().trimRight();
  }

  Future<Uint8List> _buildPdf({
    required OrderDetails order,
    required String shopName,
  }) async {
    final brandmarkBytes = await _loadBrandmarkBytes();
    final payload = _buildPdfPayload(order: order, shopName: shopName);

    final result = await Isolate.run(
      () => _buildPdfDocumentInIsolate(
        payload,
        TransferableTypedData.fromList([brandmarkBytes]),
      ),
    );

    return result.materialize().asUint8List();
  }

  Future<Uint8List> _buildImage({
    required OrderDetails order,
    required String shopName,
  }) async {
    final brandmarkBytes = await _loadBrandmarkBytes();
    return _buildInvoiceVisualBytes(
      order: order,
      shopName: shopName,
      brandmarkBytes: brandmarkBytes,
    );
  }

  Future<Uint8List> _buildInvoiceVisualBytes({
    required OrderDetails order,
    required String shopName,
    required Uint8List brandmarkBytes,
  }) {
    final view = WidgetsBinding.instance.platformDispatcher.views.first;
    return _screenshotController.captureFromLongWidget(
      MediaQuery(
        data: MediaQueryData.fromView(view),
        child: Theme(
          data: ThemeData(
            useMaterial3: true,
            colorScheme: ColorScheme.fromSeed(
              seedColor: AppColors.softOrange,
              brightness: Brightness.light,
            ),
          ),
          child: Material(
            color: Colors.white,
            child: _InvoiceDocumentCanvas(
              order: order,
              shopName: shopName,
              brandmarkBytes: brandmarkBytes,
            ),
          ),
        ),
      ),
      delay: const Duration(milliseconds: 48),
      pixelRatio: 2.5,
      constraints: const BoxConstraints(maxWidth: _invoicePageWidth),
    );
  }

  Future<Uint8List> _loadBrandmarkBytes() async {
    final asset = await rootBundle.load(_documentBrandmarkAssetPath);
    return asset.buffer.asUint8List();
  }

  Map<String, Object?> _buildPdfPayload({
    required OrderDetails order,
    required String shopName,
  }) {
    return <String, Object?>{
      "shopName": shopName,
      "status": _statusLabel(order),
      "orderNo": order.orderNo,
      "createdAt": _formatDateTime(order.createdAt),
      "customerName": order.customerName,
      "customerPhone": order.customerPhone,
      "customerTownship": order.customerTownship?.trim() ?? "",
      "customerAddress": order.customerAddress?.trim() ?? "",
      "note": order.note?.trim() ?? "",
      "subtotal": _formatMoney(order.subtotal, order.currency),
      "deliveryFee": _formatMoney(order.deliveryFee, order.currency),
      "total": _formatMoney(order.totalPrice, order.currency),
      "items": order.items
          .map(
            (item) => <String, Object?>{
              "productName": item.productName,
              "quantity": "${item.quantity}",
              "unitPrice": _formatMoney(item.unitPrice, order.currency),
              "lineTotal": _formatMoney(item.lineTotal, order.currency),
            },
          )
          .toList(growable: false),
    };
  }
}

Future<TransferableTypedData> _buildPdfDocumentInIsolate(
  Map<String, Object?> payload,
  TransferableTypedData brandmarkBytesData,
) async {
  final brandmarkBytes = brandmarkBytesData.materialize().asUint8List();
  final brandmarkImage = pw.MemoryImage(brandmarkBytes);
  final document = pw.Document();
  final headerColor = PdfColor.fromHex("#FF6B35");
  final accentColor = PdfColor.fromHex("#2AA8A0");
  final softSurface = PdfColor.fromHex("#FFF0EB");
  final borderColor = PdfColor.fromHex("#EDE8E0");
  final textDark = PdfColor.fromHex("#1A1A2E");
  final textMid = PdfColor.fromHex("#5A5A7A");
  final cream = PdfColor.fromHex("#FDF9F4");
  final items = (payload["items"] as List<Object?>)
      .cast<Map<String, Object?>>();
  final customerTownship = _pdfString(payload, "customerTownship");
  final customerAddress = _pdfString(payload, "customerAddress");
  final note = _pdfString(payload, "note");

  document.addPage(
    pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.fromLTRB(28, 32, 28, 28),
      footer: (context) => pw.Padding(
        padding: const pw.EdgeInsets.only(top: 14),
        child: pw.Center(
          child: pw.Row(
            mainAxisSize: pw.MainAxisSize.min,
            children: [
              pw.Image(brandmarkImage, width: 14, height: 14),
              pw.SizedBox(width: 6),
              pw.Text(
                _documentBrandFooter,
                style: pw.TextStyle(
                  color: textMid,
                  fontSize: 9,
                  fontWeight: pw.FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
      build: (context) => [
        pw.Container(
          padding: const pw.EdgeInsets.all(18),
          decoration: pw.BoxDecoration(
            color: softSurface,
            border: pw.Border.all(color: borderColor),
          ),
          child: pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Row(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Expanded(
                    child: pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text(
                          _pdfString(payload, "shopName"),
                          style: pw.TextStyle(
                            color: headerColor,
                            fontSize: 24,
                            fontWeight: pw.FontWeight.bold,
                          ),
                        ),
                        pw.SizedBox(height: 4),
                        pw.Text(
                          "Customer Invoice",
                          style: pw.TextStyle(
                            color: textDark,
                            fontSize: 18,
                            fontWeight: pw.FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  pw.Container(
                    padding: const pw.EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: pw.BoxDecoration(
                      color: PdfColor.fromHex("#E8F7F6"),
                      border: pw.Border.all(color: accentColor),
                    ),
                    child: pw.Text(
                      _pdfString(payload, "status"),
                      style: pw.TextStyle(
                        color: accentColor,
                        fontSize: 10,
                        fontWeight: pw.FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              pw.SizedBox(height: 16),
              pw.Row(
                children: [
                  pw.Expanded(
                    child: _pdfInfoBlock(
                      label: "Order No",
                      value: _pdfString(payload, "orderNo"),
                      textDark: textDark,
                      textMid: textMid,
                    ),
                  ),
                  pw.SizedBox(width: 12),
                  pw.Expanded(
                    child: _pdfInfoBlock(
                      label: "Created",
                      value: _pdfString(payload, "createdAt"),
                      textDark: textDark,
                      textMid: textMid,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        pw.SizedBox(height: 18),
        _pdfSectionTitle("Customer", textDark),
        pw.SizedBox(height: 8),
        pw.Container(
          width: double.infinity,
          padding: const pw.EdgeInsets.all(14),
          decoration: pw.BoxDecoration(
            color: PdfColors.white,
            border: pw.Border.all(color: borderColor),
          ),
          child: pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              _pdfLine(
                "Name",
                _pdfString(payload, "customerName"),
                textDark,
                textMid,
              ),
              _pdfLine(
                "Phone",
                _pdfString(payload, "customerPhone"),
                textDark,
                textMid,
              ),
              if (customerTownship.isNotEmpty)
                _pdfLine("Township", customerTownship, textDark, textMid),
              if (customerAddress.isNotEmpty)
                _pdfLine("Address", customerAddress, textDark, textMid),
            ],
          ),
        ),
        pw.SizedBox(height: 18),
        _pdfSectionTitle("Items", textDark),
        pw.SizedBox(height: 8),
        pw.Table(
          border: pw.TableBorder.all(color: borderColor, width: 0.8),
          columnWidths: const <int, pw.TableColumnWidth>{
            0: pw.FlexColumnWidth(3.3),
            1: pw.FlexColumnWidth(0.9),
            2: pw.FlexColumnWidth(1.6),
            3: pw.FlexColumnWidth(1.6),
          },
          children: [
            pw.TableRow(
              decoration: pw.BoxDecoration(color: softSurface),
              children: [
                _pdfTableCell(
                  "Item",
                  isHeader: true,
                  textAlign: pw.TextAlign.left,
                ),
                _pdfTableCell(
                  "Qty",
                  isHeader: true,
                  textAlign: pw.TextAlign.center,
                ),
                _pdfTableCell(
                  "Unit Price",
                  isHeader: true,
                  textAlign: pw.TextAlign.right,
                ),
                _pdfTableCell(
                  "Total",
                  isHeader: true,
                  textAlign: pw.TextAlign.right,
                ),
              ],
            ),
            ...items.map(
              (item) => pw.TableRow(
                decoration: const pw.BoxDecoration(color: PdfColors.white),
                children: [
                  _pdfTableCell(
                    _pdfItemString(item, "productName"),
                    textAlign: pw.TextAlign.left,
                  ),
                  _pdfTableCell(
                    _pdfItemString(item, "quantity"),
                    textAlign: pw.TextAlign.center,
                  ),
                  _pdfTableCell(
                    _pdfItemString(item, "unitPrice"),
                    textAlign: pw.TextAlign.right,
                  ),
                  _pdfTableCell(
                    _pdfItemString(item, "lineTotal"),
                    textAlign: pw.TextAlign.right,
                  ),
                ],
              ),
            ),
          ],
        ),
        pw.SizedBox(height: 18),
        pw.Align(
          alignment: pw.Alignment.centerRight,
          child: pw.Container(
            width: 220,
            padding: const pw.EdgeInsets.all(14),
            decoration: pw.BoxDecoration(
              color: cream,
              border: pw.Border.all(color: borderColor),
            ),
            child: pw.Column(
              children: [
                _pdfTotalRow(
                  "Subtotal",
                  _pdfString(payload, "subtotal"),
                  textDark,
                  textDark,
                ),
                pw.SizedBox(height: 8),
                _pdfTotalRow(
                  "Delivery Fee",
                  _pdfString(payload, "deliveryFee"),
                  textDark,
                  textDark,
                ),
                pw.Padding(
                  padding: const pw.EdgeInsets.symmetric(vertical: 10),
                  child: pw.Divider(color: borderColor, height: 1),
                ),
                _pdfTotalRow(
                  "Total",
                  _pdfString(payload, "total"),
                  textDark,
                  headerColor,
                  isEmphasized: true,
                ),
              ],
            ),
          ),
        ),
        if (note.isNotEmpty) ...[
          pw.SizedBox(height: 18),
          _pdfSectionTitle("Note", textDark),
          pw.SizedBox(height: 8),
          pw.Container(
            width: double.infinity,
            padding: const pw.EdgeInsets.all(14),
            decoration: pw.BoxDecoration(
              color: PdfColors.white,
              border: pw.Border.all(color: borderColor),
            ),
            child: pw.Text(
              note,
              style: pw.TextStyle(color: textMid, fontSize: 11, lineSpacing: 3),
            ),
          ),
        ],
      ],
    ),
  );

  final bytes = await document.save();
  return TransferableTypedData.fromList([bytes]);
}

String _pdfString(Map<String, Object?> payload, String key) {
  final value = payload[key];
  return value is String ? value : "";
}

String _pdfItemString(Map<String, Object?> payload, String key) {
  final value = payload[key];
  return value is String ? value : "";
}

pw.Widget _pdfSectionTitle(String title, PdfColor textDark) {
  return pw.Text(
    title,
    style: pw.TextStyle(
      color: textDark,
      fontSize: 14,
      fontWeight: pw.FontWeight.bold,
    ),
  );
}

pw.Widget _pdfInfoBlock({
  required String label,
  required String value,
  required PdfColor textDark,
  required PdfColor textMid,
}) {
  return pw.Container(
    padding: const pw.EdgeInsets.all(12),
    decoration: pw.BoxDecoration(
      color: PdfColors.white,
      border: pw.Border.all(color: PdfColor.fromHex("#EDE8E0")),
    ),
    child: pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(label, style: pw.TextStyle(color: textMid, fontSize: 10)),
        pw.SizedBox(height: 4),
        pw.Text(
          value,
          style: pw.TextStyle(
            color: textDark,
            fontSize: 12,
            fontWeight: pw.FontWeight.bold,
          ),
        ),
      ],
    ),
  );
}

pw.Widget _pdfLine(
  String label,
  String value,
  PdfColor textDark,
  PdfColor textMid,
) {
  return pw.Padding(
    padding: const pw.EdgeInsets.only(bottom: 8),
    child: pw.Row(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.SizedBox(
          width: 62,
          child: pw.Text(
            label,
            style: pw.TextStyle(color: textMid, fontSize: 11),
          ),
        ),
        pw.Expanded(
          child: pw.Text(
            value,
            style: pw.TextStyle(
              color: textDark,
              fontSize: 11,
              fontWeight: pw.FontWeight.bold,
            ),
          ),
        ),
      ],
    ),
  );
}

pw.Widget _pdfTableCell(
  String text, {
  bool isHeader = false,
  pw.TextAlign textAlign = pw.TextAlign.left,
}) {
  return pw.Padding(
    padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 10),
    child: pw.Text(
      text,
      textAlign: textAlign,
      style: pw.TextStyle(
        color: PdfColor.fromHex("#1A1A2E"),
        fontSize: 11,
        fontWeight: isHeader ? pw.FontWeight.bold : pw.FontWeight.normal,
      ),
    ),
  );
}

pw.Widget _pdfTotalRow(
  String label,
  String value,
  PdfColor leadingColor,
  PdfColor trailingColor, {
  bool isEmphasized = false,
}) {
  return pw.Row(
    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
    children: [
      pw.Text(
        label,
        style: pw.TextStyle(
          color: leadingColor,
          fontSize: isEmphasized ? 12 : 11,
          fontWeight: isEmphasized ? pw.FontWeight.bold : pw.FontWeight.normal,
        ),
      ),
      pw.Text(
        value,
        style: pw.TextStyle(
          color: trailingColor,
          fontSize: isEmphasized ? 13 : 11,
          fontWeight: pw.FontWeight.bold,
        ),
      ),
    ],
  );
}

String _formatMoney(int value, String currency) {
  final amount = NumberFormat.decimalPattern().format(value);
  final normalizedCurrency = currency.trim();
  if (normalizedCurrency.isEmpty) {
    return amount;
  }

  return "$amount $normalizedCurrency";
}

String _formatDateTime(DateTime value) {
  return DateFormat("MMM d, yyyy · h:mm a").format(value);
}

String _statusLabel(OrderDetails order) {
  final raw = "${order.status}";
  if (raw.contains("newOrder")) {
    return "New";
  }
  if (raw.contains("confirmed")) {
    return "Confirmed";
  }
  if (raw.contains("outForDelivery")) {
    return "Out for Delivery";
  }
  if (raw.contains("delivered")) {
    return "Delivered";
  }
  if (raw.contains("cancelled")) {
    return "Cancelled";
  }
  return "Order";
}

class _InvoiceDocumentCanvas extends StatelessWidget {
  const _InvoiceDocumentCanvas({
    required this.order,
    required this.shopName,
    required this.brandmarkBytes,
  });

  final OrderDetails order;
  final String shopName;
  final Uint8List brandmarkBytes;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: _invoicePageWidth,
      constraints: const BoxConstraints(minHeight: _invoicePageMinHeight),
      decoration: BoxDecoration(
        color: _invoiceCanvasColor,
        border: Border.all(color: AppColors.border),
      ),
      child: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(34, 36, 34, 64),
            child: _InvoiceImageCard(order: order, shopName: shopName),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 22,
            child: Center(
              child: _DocumentWatermarkRow(brandmarkBytes: brandmarkBytes),
            ),
          ),
        ],
      ),
    );
  }
}

class _InvoiceImageCard extends StatelessWidget {
  const _InvoiceImageCard({required this.order, required this.shopName});

  final OrderDetails order;
  final String shopName;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.softOrangeLight,
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          shopName,
                          style: theme.textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.w900,
                            color: AppColors.softOrange,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "Customer Invoice",
                          style: theme.textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w900,
                            color: AppColors.textDark,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.tealLight,
                      border: Border.all(color: AppColors.teal),
                    ),
                    child: Text(
                      _statusLabel(order),
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: AppColors.teal,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _ImageInfoPill(
                      label: "Order No",
                      value: order.orderNo,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _ImageInfoPill(
                      label: "Created",
                      value: _formatDateTime(order.createdAt),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        const _InvoiceSectionTitle(title: "Customer"),
        const SizedBox(height: 8),
        _ImageSectionCard(
          child: Column(
            children: [
              _ImageInfoRow(label: "Name", value: order.customerName),
              _ImageInfoRow(label: "Phone", value: order.customerPhone),
              if ((order.customerTownship ?? "").trim().isNotEmpty)
                _ImageInfoRow(
                  label: "Township",
                  value: order.customerTownship!.trim(),
                ),
              if ((order.customerAddress ?? "").trim().isNotEmpty)
                _ImageInfoRow(
                  label: "Address",
                  value: order.customerAddress!.trim(),
                ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        const _InvoiceSectionTitle(title: "Items"),
        const SizedBox(height: 8),
        _InvoiceItemsTable(order: order),
        const SizedBox(height: 18),
        Align(
          alignment: Alignment.centerRight,
          child: Container(
            width: 230,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.cream,
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                _ImageSummaryRow(
                  label: "Subtotal",
                  value: _formatMoney(order.subtotal, order.currency),
                ),
                const SizedBox(height: 8),
                _ImageSummaryRow(
                  label: "Delivery Fee",
                  value: _formatMoney(order.deliveryFee, order.currency),
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 10),
                  child: Divider(height: 1, color: AppColors.border),
                ),
                _ImageSummaryRow(
                  label: "Total",
                  value: _formatMoney(order.totalPrice, order.currency),
                  emphasize: true,
                ),
              ],
            ),
          ),
        ),
        if ((order.note ?? "").trim().isNotEmpty) ...[
          const SizedBox(height: 18),
          const _InvoiceSectionTitle(title: "Note"),
          const SizedBox(height: 8),
          _ImageSectionCard(
            child: Text(
              order.note!.trim(),
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.textMid,
                height: 1.45,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _ImageSectionCard extends StatelessWidget {
  const _ImageSectionCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.border),
      ),
      child: child,
    );
  }
}

class _ImageInfoPill extends StatelessWidget {
  const _ImageInfoPill({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: AppColors.textLight,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textDark,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}

class _ImageInfoRow extends StatelessWidget {
  const _ImageInfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 72,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.textLight,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textDark,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _InvoiceSectionTitle extends StatelessWidget {
  const _InvoiceSectionTitle({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: Theme.of(context).textTheme.titleMedium?.copyWith(
        fontWeight: FontWeight.w900,
        color: AppColors.textDark,
      ),
    );
  }
}

class _InvoiceItemsTable extends StatelessWidget {
  const _InvoiceItemsTable({required this.order});

  final OrderDetails order;

  @override
  Widget build(BuildContext context) {
    const border = BorderSide(color: AppColors.border, width: 1);

    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: Table(
        columnWidths: const <int, TableColumnWidth>{
          0: FlexColumnWidth(3.3),
          1: FlexColumnWidth(0.9),
          2: FlexColumnWidth(1.6),
          3: FlexColumnWidth(1.6),
        },
        border: const TableBorder(
          top: border,
          bottom: border,
          left: border,
          right: border,
          horizontalInside: border,
          verticalInside: border,
        ),
        children: [
          const TableRow(
            decoration: BoxDecoration(color: AppColors.softOrangeLight),
            children: [
              _InvoiceTableCell(
                "Item",
                isHeader: true,
                alignment: TextAlign.left,
              ),
              _InvoiceTableCell(
                "Qty",
                isHeader: true,
                alignment: TextAlign.center,
              ),
              _InvoiceTableCell(
                "Unit Price",
                isHeader: true,
                alignment: TextAlign.right,
              ),
              _InvoiceTableCell(
                "Total",
                isHeader: true,
                alignment: TextAlign.right,
              ),
            ],
          ),
          ...order.items.map(
            (item) => TableRow(
              decoration: const BoxDecoration(color: Colors.white),
              children: [
                _InvoiceTableCell(item.productName),
                _InvoiceTableCell(
                  "${item.quantity}",
                  alignment: TextAlign.center,
                ),
                _InvoiceTableCell(
                  _formatMoney(item.unitPrice, order.currency),
                  alignment: TextAlign.right,
                ),
                _InvoiceTableCell(
                  _formatMoney(item.lineTotal, order.currency),
                  alignment: TextAlign.right,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InvoiceTableCell extends StatelessWidget {
  const _InvoiceTableCell(
    this.text, {
    this.isHeader = false,
    this.alignment = TextAlign.left,
  });

  final String text;
  final bool isHeader;
  final TextAlign alignment;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      child: Text(
        text,
        textAlign: alignment,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          color: AppColors.textDark,
          fontWeight: isHeader ? FontWeight.w900 : FontWeight.w700,
          height: 1.35,
        ),
      ),
    );
  }
}

class _ImageSummaryRow extends StatelessWidget {
  const _ImageSummaryRow({
    required this.label,
    required this.value,
    this.emphasize = false,
  });

  final String label;
  final String value;
  final bool emphasize;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: AppColors.textDark,
            fontWeight: emphasize ? FontWeight.w900 : FontWeight.w700,
          ),
        ),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
            color: emphasize ? AppColors.softOrange : AppColors.textDark,
            fontWeight: FontWeight.w900,
          ),
        ),
      ],
    );
  }
}

class _DocumentWatermarkRow extends StatelessWidget {
  const _DocumentWatermarkRow({required this.brandmarkBytes});

  final Uint8List brandmarkBytes;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: 0.82,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Image.memory(
            brandmarkBytes,
            width: 18,
            height: 18,
            filterQuality: FilterQuality.medium,
          ),
          const SizedBox(width: 8),
          Text(
            _documentBrandFooter,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: AppColors.textLight,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }
}
