import "package:app_ui_kit/app_ui_kit.dart";
import "package:flutter/material.dart";
import "package:fom_mobile/features/orders/domain/entities/order_document_export_format.dart";

enum OrderDocumentExportAction { save, share }

class OrderDocumentExportSelection {
  const OrderDocumentExportSelection({
    required this.format,
    required this.action,
  });

  final OrderDocumentExportFormat format;
  final OrderDocumentExportAction action;
}

class OrderDocumentExportBottomSheet extends StatefulWidget {
  const OrderDocumentExportBottomSheet({super.key, this.initialFormat});

  final OrderDocumentExportFormat? initialFormat;

  static Future<OrderDocumentExportSelection?> show(
    BuildContext context, {
    OrderDocumentExportFormat? initialFormat,
  }) {
    return showModalBottomSheet<OrderDocumentExportSelection>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) =>
          OrderDocumentExportBottomSheet(initialFormat: initialFormat),
    );
  }

  @override
  State<OrderDocumentExportBottomSheet> createState() =>
      _OrderDocumentExportBottomSheetState();
}

class _OrderDocumentExportBottomSheetState
    extends State<OrderDocumentExportBottomSheet> {
  late OrderDocumentExportFormat _selectedFormat;

  @override
  void initState() {
    super.initState();
    _selectedFormat = widget.initialFormat ?? OrderDocumentExportFormat.pdf;
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return SafeArea(
      top: false,
      child: Container(
        padding: EdgeInsets.fromLTRB(20, 8, 20, 24 + bottomInset),
        decoration: const BoxDecoration(
          color: AppColors.warmWhite,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Text(
              "Share or Export Customer Document",
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w900,
                color: AppColors.textDark,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              "Choose text for quick chat sharing, or choose PDF / image for a customer-ready invoice.",
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.textLight,
                fontWeight: FontWeight.w600,
                height: 1.45,
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: AppSelectionOption(
                    icon: const Icon(Icons.notes_rounded),
                    label: "Text",
                    subtitle: "Order info",
                    isSelected:
                        _selectedFormat == OrderDocumentExportFormat.text,
                    onTap: () => setState(() {
                      _selectedFormat = OrderDocumentExportFormat.text;
                    }),
                    selectedBorderColor: AppColors.teal,
                    selectedBackgroundColor: AppColors.tealLight,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: AppSelectionOption(
                    icon: const Icon(Icons.picture_as_pdf_rounded),
                    label: "PDF",
                    subtitle: "Invoice",
                    isSelected:
                        _selectedFormat == OrderDocumentExportFormat.pdf,
                    onTap: () => setState(() {
                      _selectedFormat = OrderDocumentExportFormat.pdf;
                    }),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: AppSelectionOption(
                    icon: const Icon(Icons.image_rounded),
                    label: "Image",
                    subtitle: "Invoice",
                    isSelected:
                        _selectedFormat == OrderDocumentExportFormat.image,
                    onTap: () => setState(() {
                      _selectedFormat = OrderDocumentExportFormat.image;
                    }),
                    selectedBorderColor: AppColors.purple,
                    selectedBackgroundColor: AppColors.purpleLight,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.cream,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.border, width: 1.5),
              ),
              child: Text(
                _helperText(_selectedFormat),
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textMid,
                  fontWeight: FontWeight.w700,
                  height: 1.45,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: AppButton(
                    text: "Save",
                    variant: AppButtonVariant.secondary,
                    icon: const Icon(Icons.download_rounded),
                    onPressed: () => Navigator.of(context).pop(
                      OrderDocumentExportSelection(
                        format: _selectedFormat,
                        action: OrderDocumentExportAction.save,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: AppButton(
                    text: "Share",
                    icon: const Icon(Icons.ios_share_rounded),
                    onPressed: () => Navigator.of(context).pop(
                      OrderDocumentExportSelection(
                        format: _selectedFormat,
                        action: OrderDocumentExportAction.share,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _helperText(OrderDocumentExportFormat format) {
    switch (format) {
      case OrderDocumentExportFormat.text:
        return "Best for sending quick order information into chat apps as plain text.";
      case OrderDocumentExportFormat.pdf:
        return "Best for a formal invoice file that customers can save, print, or forward.";
      case OrderDocumentExportFormat.image:
        return "Best for sharing a visual invoice preview directly in chat and social apps.";
    }
  }
}
