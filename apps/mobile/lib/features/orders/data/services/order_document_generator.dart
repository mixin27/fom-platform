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
      safeOrderNo.isEmpty ? "order" : safeOrderNo,
      safeCustomerName.isEmpty ? "customer" : safeCustomerName,
      safeShopName.isEmpty ? "shop" : safeShopName,
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
      ..writeln("Order Invoice")
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

  // Color Tokens matching Web Redesign
  final brandOrange = PdfColor.fromHex("#f4622a");
  final textDark = PdfColor.fromHex("#1e293b"); // text-slate-800 approx
  final textLight = PdfColor.fromHex("#64748b"); // text-slate-500
  final borderColor = PdfColor.fromHex("#f1f5f9"); // border-slate-100
  final bgSoft = PdfColor.fromHex("#f8fafc"); // bg-slate-50

  final items = (payload["items"] as List<Object?>)
      .cast<Map<String, Object?>>();
  final customerTownship = _pdfString(payload, "customerTownship");
  final customerAddress = _pdfString(payload, "customerAddress");
  final note = _pdfString(payload, "note");

  document.addPage(
    pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.symmetric(horizontal: 48, vertical: 48),
      footer: (context) => pw.Container(
        margin: const pw.EdgeInsets.only(top: 24),
        padding: const pw.EdgeInsets.only(top: 24),
        decoration: pw.BoxDecoration(
          border: pw.Border(
            top: pw.BorderSide(color: PdfColor.fromHex("#f1f5f9"), width: 1),
          ),
        ),
        child: pw.Column(
          children: [
            pw.Text(
              "Thank you for shopping with us!",
              style: pw.TextStyle(
                color: textDark,
                fontSize: 10,
                fontWeight: pw.FontWeight.bold,
              ),
            ),
            pw.SizedBox(height: 8),
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.center,
              children: [
                pw.Image(brandmarkImage, width: 12, height: 12),
                pw.SizedBox(width: 6),
                pw.Text(
                  "Powered by FOM Order Manager · getfom.com",
                  style: pw.TextStyle(
                    color: textLight,
                    fontSize: 8,
                    fontWeight: pw.FontWeight.bold,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      build: (context) => [
        // Header Section
        pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text(
                  _pdfString(payload, "shopName"),
                  style: pw.TextStyle(
                    color: brandOrange,
                    fontSize: 28,
                    fontWeight: pw.FontWeight.bold,
                  ),
                ),
                pw.SizedBox(height: 2),
                pw.Text(
                  "Official Invoice",
                  style: pw.TextStyle(
                    color: textLight,
                    fontSize: 12,
                    fontWeight: pw.FontWeight.bold,
                  ),
                ),
              ],
            ),
            pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.end,
              children: [
                pw.Row(
                  children: [
                    pw.Text(
                      "INVOICE NO. ",
                      style: pw.TextStyle(
                        color: textLight,
                        fontSize: 8,
                        fontWeight: pw.FontWeight.bold,
                      ),
                    ),
                    pw.Text(
                      _pdfString(payload, "orderNo"),
                      style: pw.TextStyle(
                        color: textDark,
                        fontSize: 14,
                        fontWeight: pw.FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                pw.Text(
                  _pdfString(payload, "createdAt"),
                  style: pw.TextStyle(color: textLight, fontSize: 10),
                ),
                pw.SizedBox(height: 6),
                pw.Container(
                  padding: const pw.EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: pw.BoxDecoration(
                    color: PdfColor.fromHex("#fef3c7"),
                    borderRadius: const pw.BorderRadius.all(
                      pw.Radius.circular(10),
                    ),
                  ),
                  child: pw.Text(
                    _pdfString(payload, "status").toUpperCase(),
                    style: pw.TextStyle(
                      color: PdfColor.fromHex("#b45309"),
                      fontSize: 8,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),

        pw.Padding(
          padding: const pw.EdgeInsets.symmetric(vertical: 24),
          child: pw.Divider(color: borderColor, thickness: 1.5),
        ),

        // Info Grid
        pw.Row(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Expanded(
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    "BILL TO",
                    style: pw.TextStyle(
                      color: textLight,
                      fontSize: 8,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.SizedBox(height: 6),
                  pw.Text(
                    _pdfString(payload, "customerName"),
                    style: pw.TextStyle(
                      color: textDark,
                      fontSize: 12,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.Text(
                    _pdfString(payload, "customerPhone"),
                    style: pw.TextStyle(color: textLight, fontSize: 10),
                  ),
                ],
              ),
            ),
            pw.Expanded(
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    "SHIP TO",
                    style: pw.TextStyle(
                      color: textLight,
                      fontSize: 8,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.SizedBox(height: 6),
                  if (customerTownship.isNotEmpty)
                    pw.Text(
                      customerTownship,
                      style: pw.TextStyle(
                        color: textDark,
                        fontSize: 11,
                        fontWeight: pw.FontWeight.bold,
                      ),
                    ),
                  if (customerAddress.isNotEmpty)
                    pw.Text(
                      customerAddress,
                      style: pw.TextStyle(
                        color: textLight,
                        fontSize: 10,
                        lineSpacing: 2,
                      ),
                    ),
                  if (customerTownship.isEmpty && customerAddress.isEmpty)
                    pw.Text(
                      "No address provided",
                      style: pw.TextStyle(
                        color: textLight,
                        fontSize: 10,
                        fontStyle: pw.FontStyle.italic,
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),

        pw.SizedBox(height: 32),

        // Items Table
        pw.Table(
          columnWidths: const <int, pw.TableColumnWidth>{
            0: pw.FlexColumnWidth(3.3),
            1: pw.FlexColumnWidth(0.9),
            2: pw.FlexColumnWidth(1.6),
            3: pw.FlexColumnWidth(1.6),
          },
          children: [
            pw.TableRow(
              decoration: pw.BoxDecoration(
                border: pw.Border(
                  bottom: pw.BorderSide(color: textDark, width: 0.8),
                ),
              ),
              children: [
                _pdfTableCell(
                  "Item Description",
                  isHeader: true,
                  textAlign: pw.TextAlign.left,
                ),
                _pdfTableCell(
                  "Qty",
                  isHeader: true,
                  textAlign: pw.TextAlign.center,
                ),
                _pdfTableCell(
                  "Price",
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
            ...items.asMap().entries.map((entry) {
              final item = entry.value;
              return pw.TableRow(
                decoration: pw.BoxDecoration(
                  border: pw.Border(
                    bottom: pw.BorderSide(color: borderColor, width: 0.5),
                  ),
                ),
                children: [
                  _pdfTableCell(
                    _pdfItemString(item, "productName"),
                    textAlign: pw.TextAlign.left,
                    verticalPadding: 12,
                  ),
                  _pdfTableCell(
                    _pdfItemString(item, "quantity"),
                    textAlign: pw.TextAlign.center,
                    verticalPadding: 12,
                  ),
                  _pdfTableCell(
                    _pdfItemString(item, "unitPrice"),
                    textAlign: pw.TextAlign.right,
                    verticalPadding: 12,
                  ),
                  _pdfTableCell(
                    _pdfItemString(item, "lineTotal"),
                    textAlign: pw.TextAlign.right,
                    verticalPadding: 12,
                    isBold: true,
                  ),
                ],
              );
            }),
          ],
        ),

        pw.SizedBox(height: 24),

        // Totals aligned right
        pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.end,
          children: [
            pw.Container(
              width: 200,
              child: pw.Column(
                children: [
                  _pdfTotalRow(
                    "Subtotal",
                    _pdfString(payload, "subtotal"),
                    textLight,
                    textDark,
                  ),
                  pw.SizedBox(height: 8),
                  _pdfTotalRow(
                    "Delivery Fee",
                    _pdfString(payload, "deliveryFee"),
                    textLight,
                    textDark,
                  ),
                  pw.Padding(
                    padding: const pw.EdgeInsets.symmetric(vertical: 12),
                    child: pw.Divider(color: borderColor, thickness: 1),
                  ),
                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Text(
                        "Total",
                        style: pw.TextStyle(
                          color: textDark,
                          fontSize: 12,
                          fontWeight: pw.FontWeight.bold,
                        ),
                      ),
                      pw.Text(
                        _pdfString(payload, "total"),
                        style: pw.TextStyle(
                          color: brandOrange,
                          fontSize: 18,
                          fontWeight: pw.FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),

        // Note Section
        if (note.isNotEmpty) ...[
          pw.SizedBox(height: 48),
          pw.Container(
            padding: const pw.EdgeInsets.all(16),
            decoration: pw.BoxDecoration(
              color: bgSoft,
              borderRadius: const pw.BorderRadius.all(pw.Radius.circular(12)),
            ),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text(
                  "CUSTOMER NOTE",
                  style: pw.TextStyle(
                    color: textLight,
                    fontSize: 8,
                    fontWeight: pw.FontWeight.bold,
                  ),
                ),
                pw.SizedBox(height: 6),
                pw.Text(
                  "\"$note\"",
                  style: pw.TextStyle(
                    color: textDark,
                    fontSize: 10,
                    fontStyle: pw.FontStyle.italic,
                    lineSpacing: 1.5,
                  ),
                ),
              ],
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

pw.Widget _pdfTableCell(
  String text, {
  bool isHeader = false,
  bool isBold = false,
  pw.TextAlign textAlign = pw.TextAlign.left,
  double verticalPadding = 10,
}) {
  return pw.Padding(
    padding: pw.EdgeInsets.symmetric(horizontal: 8, vertical: verticalPadding),
    child: pw.Text(
      text,
      textAlign: textAlign,
      style: pw.TextStyle(
        color: PdfColor.fromHex("#1e293b"),
        fontSize: 10,
        fontWeight: (isHeader || isBold)
            ? pw.FontWeight.bold
            : pw.FontWeight.normal,
      ),
    ),
  );
}

pw.Widget _pdfTotalRow(
  String label,
  String value,
  PdfColor leadingColor,
  PdfColor trailingColor,
) {
  return pw.Row(
    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
    children: [
      pw.Text(
        label,
        style: pw.TextStyle(
          color: leadingColor,
          fontSize: 10,
          fontWeight: pw.FontWeight.bold,
        ),
      ),
      pw.Text(
        value,
        style: pw.TextStyle(
          color: trailingColor,
          fontSize: 10,
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
        // Header Section
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  shopName,
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w900,
                    color: AppColors.softOrange,
                    fontSize: 26,
                  ),
                ),
                Text(
                  "Official Invoice",
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: AppColors.textLight,
                  ),
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      "INVOICE NO. ",
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: AppColors.textLight,
                        fontWeight: FontWeight.w800,
                        fontSize: 8,
                      ),
                    ),
                    Text(
                      order.orderNo,
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: AppColors.textDark,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
                Text(
                  _formatDateTime(order.createdAt),
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: AppColors.textLight,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.yellowLight,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _statusLabel(order).toUpperCase(),
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: AppColors.yellow,
                      fontWeight: FontWeight.w900,
                      fontSize: 9,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),

        const Padding(
          padding: EdgeInsets.symmetric(vertical: 24),
          child: Divider(color: AppColors.border, thickness: 1.5),
        ),

        // Info Grid (Bill To & Ship To)
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "BILL TO",
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: AppColors.textLight,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    order.customerName,
                    style: theme.textTheme.titleSmall?.copyWith(
                      color: AppColors.textDark,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  Text(
                    order.customerPhone,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: AppColors.textMid,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 24),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "SHIP TO",
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: AppColors.textLight,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 8),
                  if ((order.customerTownship ?? "").isNotEmpty)
                    Text(
                      order.customerTownship!,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: AppColors.textDark,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  if ((order.customerAddress ?? "").isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(
                        order.customerAddress!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: AppColors.textMid,
                          fontWeight: FontWeight.w500,
                          height: 1.4,
                        ),
                      ),
                    ),
                  if ((order.customerTownship ?? "").isEmpty &&
                      (order.customerAddress ?? "").isEmpty)
                    Text(
                      "No address provided",
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: AppColors.textLight,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),

        const SizedBox(height: 36),

        // Items Table
        _InvoiceItemsTable(order: order),

        const SizedBox(height: 24),

        // Totals Area
        Align(
          alignment: Alignment.centerRight,
          child: SizedBox(
            width: 240,
            child: Column(
              children: [
                _ImageSummaryRow(
                  label: "Subtotal",
                  value: _formatMoney(order.subtotal, order.currency),
                ),
                const SizedBox(height: 10),
                _ImageSummaryRow(
                  label: "Delivery Fee",
                  value: _formatMoney(order.deliveryFee, order.currency),
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Divider(color: AppColors.border, thickness: 1),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "Total",
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: AppColors.textDark,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    Text(
                      _formatMoney(order.totalPrice, order.currency),
                      style: theme.textTheme.headlineSmall?.copyWith(
                        color: AppColors.softOrange,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),

        if ((order.note ?? "").trim().isNotEmpty) ...[
          const SizedBox(height: 48),
          Container(
            padding: const EdgeInsets.all(20),
            width: double.infinity,
            decoration: BoxDecoration(
              color: AppColors.softOrangeLight.withValues(alpha: 0.4),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "CUSTOMER NOTE",
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: AppColors.softOrange.withValues(alpha: 0.8),
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  "\"${order.note!.trim()}\"",
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.textDark,
                    height: 1.5,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _InvoiceItemsTable extends StatelessWidget {
  const _InvoiceItemsTable({required this.order});

  final OrderDetails order;

  @override
  Widget build(BuildContext context) {
    const border = BorderSide(color: AppColors.border, width: 0.8);

    return Table(
      columnWidths: const <int, TableColumnWidth>{
        0: FlexColumnWidth(3.3),
        1: FlexColumnWidth(0.9),
        2: FlexColumnWidth(1.6),
        3: FlexColumnWidth(1.6),
      },
      children: [
        const TableRow(
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(color: AppColors.textDark, width: 1),
            ),
          ),
          children: [
            _InvoiceTableCell(
              "Item Description",
              isHeader: true,
              alignment: TextAlign.left,
            ),
            _InvoiceTableCell(
              "Qty",
              isHeader: true,
              alignment: TextAlign.center,
            ),
            _InvoiceTableCell(
              "Price",
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
            decoration: const BoxDecoration(border: Border(bottom: border)),
            children: [
              _InvoiceTableCell(item.productName, verticalPadding: 14),
              _InvoiceTableCell(
                "${item.quantity}",
                alignment: TextAlign.center,
                verticalPadding: 14,
              ),
              _InvoiceTableCell(
                _formatMoney(item.unitPrice, order.currency),
                alignment: TextAlign.right,
                verticalPadding: 14,
              ),
              _InvoiceTableCell(
                _formatMoney(item.lineTotal, order.currency),
                alignment: TextAlign.right,
                isBold: true,
                verticalPadding: 14,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _InvoiceTableCell extends StatelessWidget {
  const _InvoiceTableCell(
    this.text, {
    this.isHeader = false,
    this.isBold = false,
    this.alignment = TextAlign.left,
    this.verticalPadding = 12,
  });

  final String text;
  final bool isHeader;
  final bool isBold;
  final TextAlign alignment;
  final double verticalPadding;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 4, vertical: verticalPadding),
      child: Text(
        text,
        textAlign: alignment,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          color: AppColors.textDark,
          fontWeight: (isHeader || isBold) ? FontWeight.w900 : FontWeight.w600,
          fontSize: 12,
          height: 1.35,
        ),
      ),
    );
  }
}

class _ImageSummaryRow extends StatelessWidget {
  const _ImageSummaryRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: AppColors.textLight,
            fontWeight: FontWeight.w800,
            fontSize: 12,
          ),
        ),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: AppColors.textDark,
            fontWeight: FontWeight.w900,
            fontSize: 13,
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
