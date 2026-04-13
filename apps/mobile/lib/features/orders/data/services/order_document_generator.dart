import "dart:convert";
import "dart:typed_data";

import "package:app_ui_kit/app_ui_kit.dart";
import "package:flutter/material.dart";
import "package:fom_mobile/features/orders/domain/entities/order_details.dart";
import "package:fom_mobile/features/orders/domain/entities/order_document_export_format.dart";
import "package:intl/intl.dart";
import "package:pdf/pdf.dart";
import "package:pdf/widgets.dart" as pw;
import "package:screenshot/screenshot.dart";

const Color _invoiceCanvasColor = Color(0xFFF4EEE6);
const String _documentBrandLine = "Generated with FOM Order Manager";
const String _documentBrandCaption =
    "Create customer-ready orders, invoices, and delivery updates with FOM.";

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
      ..writeln(_documentBrandCaption);

    return buffer.toString().trimRight();
  }

  Future<Uint8List> _buildPdf({
    required OrderDetails order,
    required String shopName,
  }) async {
    final invoiceBytes = await _buildInvoiceVisualBytes(
      order: order,
      shopName: shopName,
    );
    final document = pw.Document();
    final invoiceImage = pw.MemoryImage(invoiceBytes);
    final watermarkColor = PdfColor.fromHex("#F6E9DE");
    final captionColor = PdfColor.fromHex("#8B806F");

    document.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        build: (context) {
          return pw.Stack(
            children: [
              pw.Positioned.fill(child: pw.Container(color: PdfColors.white)),
              pw.Positioned.fill(
                child: pw.Padding(
                  padding: const pw.EdgeInsets.all(36),
                  child: pw.Watermark.text(
                    "FOM ORDER MANAGER",
                    angle: -0.5,
                    style: pw.TextStyle(
                      color: watermarkColor,
                      fontSize: 58,
                      fontWeight: pw.FontWeight.bold,
                      letterSpacing: 4,
                    ),
                  ),
                ),
              ),
              pw.Padding(
                padding: const pw.EdgeInsets.fromLTRB(24, 28, 24, 20),
                child: pw.Column(
                  children: [
                    pw.Expanded(
                      child: pw.Center(
                        child: pw.Image(invoiceImage, fit: pw.BoxFit.contain),
                      ),
                    ),
                    pw.SizedBox(height: 12),
                    pw.Text(
                      _documentBrandLine,
                      style: pw.TextStyle(
                        color: captionColor,
                        fontSize: 10,
                        fontWeight: pw.FontWeight.bold,
                      ),
                    ),
                    pw.SizedBox(height: 4),
                    pw.Text(
                      _documentBrandCaption,
                      textAlign: pw.TextAlign.center,
                      style: pw.TextStyle(color: captionColor, fontSize: 9),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );

    return document.save();
  }

  Future<Uint8List> _buildImage({
    required OrderDetails order,
    required String shopName,
  }) {
    return _buildInvoiceVisualBytes(order: order, shopName: shopName);
  }

  Future<Uint8List> _buildInvoiceVisualBytes({
    required OrderDetails order,
    required String shopName,
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
            color: _invoiceCanvasColor,
            child: _InvoiceDocumentCanvas(order: order, shopName: shopName),
          ),
        ),
      ),
      delay: const Duration(milliseconds: 48),
      pixelRatio: 2.5,
      constraints: const BoxConstraints(maxWidth: 840),
    );
  }
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
  const _InvoiceDocumentCanvas({required this.order, required this.shopName});

  final OrderDetails order;
  final String shopName;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      width: 808,
      color: _invoiceCanvasColor,
      padding: const EdgeInsets.all(24),
      child: Stack(
        children: [
          Positioned(
            top: 18,
            right: 8,
            child: IgnorePointer(
              child: Opacity(
                opacity: 0.1,
                child: Transform.rotate(
                  angle: -0.22,
                  child: Text(
                    "FOM",
                    style: theme.textTheme.displayLarge?.copyWith(
                      fontSize: 84,
                      fontWeight: FontWeight.w900,
                      color: AppColors.softOrange,
                      letterSpacing: 4,
                    ),
                  ),
                ),
              ),
            ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _InvoiceImageCard(order: order, shopName: shopName),
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 14,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.94),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppColors.border, width: 1.5),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: AppColors.softOrangeLight,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.auto_awesome_rounded,
                        color: AppColors.softOrange,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _documentBrandLine,
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w900,
                              color: AppColors.textDark,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _documentBrandCaption,
                            style: theme.textTheme.bodySmall?.copyWith(
                              fontWeight: FontWeight.w700,
                              color: AppColors.textMid,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
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

    return Container(
      width: 760,
      decoration: BoxDecoration(
        color: AppColors.warmWhite,
        borderRadius: BorderRadius.circular(28),
        boxShadow: const [
          BoxShadow(
            color: AppColors.shadow,
            blurRadius: 24,
            offset: Offset(0, 16),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.softOrangeLight,
                borderRadius: BorderRadius.circular(22),
              ),
              child: Row(
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
                        const SizedBox(height: 6),
                        Text(
                          "Customer Invoice",
                          style: theme.textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w900,
                            color: AppColors.textDark,
                          ),
                        ),
                        const SizedBox(height: 12),
                        _ImageInfoPill(
                          label: "Status",
                          value: _statusLabel(order),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      _ImageInfoPill(label: "Order No", value: order.orderNo),
                      const SizedBox(height: 8),
                      _ImageInfoPill(
                        label: "Created",
                        value: _formatDateTime(order.createdAt),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            _ImageSectionCard(
              title: "Customer",
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
            const SizedBox(height: 20),
            _ImageSectionCard(
              title: "Items",
              child: Column(
                children: [
                  for (final item in order.items)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(
                              item.productName,
                              style: theme.textTheme.bodyLarge?.copyWith(
                                fontWeight: FontWeight.w800,
                                color: AppColors.textDark,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Text(
                            "x${item.quantity}",
                            style: theme.textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                              color: AppColors.textMid,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Text(
                            _formatMoney(item.lineTotal, order.currency),
                            style: theme.textTheme.bodyLarge?.copyWith(
                              fontWeight: FontWeight.w900,
                              color: AppColors.textDark,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Align(
              alignment: Alignment.centerRight,
              child: Container(
                width: 300,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: AppColors.cream,
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: AppColors.border, width: 1.5),
                ),
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
                      padding: EdgeInsets.symmetric(vertical: 12),
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
              const SizedBox(height: 20),
              _ImageSectionCard(
                title: "Note",
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
        ),
      ),
    );
  }
}

class _ImageSectionCard extends StatelessWidget {
  const _ImageSectionCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w900,
              color: AppColors.textDark,
            ),
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
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
        borderRadius: BorderRadius.circular(18),
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
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 92,
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
