import "package:app_ui_kit/app_ui_kit.dart";
import "package:flutter/material.dart";

import "../../domain/entities/order_status.dart";

/// Returns true if the user confirms cancelling the order.
Future<bool> showOrderCancellationConfirmSheet(BuildContext context) async {
  final confirmed = await showModalBottomSheet<bool>(
    context: context,
    backgroundColor: Colors.transparent,
    builder: (sheetContext) {
      return Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: Color(0xFFFEE2E2),
                    child: Icon(
                      Icons.cancel_outlined,
                      size: 18,
                      color: Color(0xFFB91C1C),
                    ),
                  ),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      "Cancel this order?",
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: AppColors.textDark,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Text(
                "This order will move to Cancelled and cannot continue in the delivery flow.",
                style: TextStyle(
                  fontSize: 13,
                  height: 1.5,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textMid,
                ),
              ),
              const SizedBox(height: 18),
              AppButton(
                text: "Keep Order",
                variant: AppButtonVariant.secondary,
                onPressed: () => Navigator.of(sheetContext).pop(false),
              ),
              const SizedBox(height: 10),
              AppButton(
                text: "Cancel Order",
                onPressed: () => Navigator.of(sheetContext).pop(true),
              ),
            ],
          ),
        ),
      );
    },
  );

  return confirmed == true;
}

/// Use before applying [OrderStatus.cancelled] from list shortcuts or sheets.
Future<bool> confirmOrderCancellationIfNeeded(
  BuildContext context,
  OrderStatus nextStatus,
) async {
  if (nextStatus != OrderStatus.cancelled) {
    return true;
  }
  return showOrderCancellationConfirmSheet(context);
}
