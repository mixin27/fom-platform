import 'package:flutter/material.dart';

import '../tokens/app_colors.dart';

class AppConnectionBanner extends StatelessWidget {
  const AppConnectionBanner({
    required this.isOnline,
    super.key,
    this.transportLabel,
    this.showWhenOnline = false,
    this.offlineMessage,
    this.onlineMessage,
  });

  final bool isOnline;
  final String? transportLabel;
  final bool showWhenOnline;
  final String? offlineMessage;
  final String? onlineMessage;

  @override
  Widget build(BuildContext context) {
    if (isOnline && !showWhenOnline) {
      return const SizedBox.shrink();
    }

    final backgroundColor = isOnline
        ? AppColors.greenLight
        : const Color(0xFFFEE2E2);
    final borderColor = isOnline ? AppColors.green : const Color(0xFFEF4444);
    final textColor = isOnline
        ? const Color(0xFF166534)
        : const Color(0xFF991B1B);

    final resolvedOnlineMessage =
        onlineMessage ??
        (transportLabel == null || transportLabel!.isEmpty
            ? 'Back online.'
            : 'Connected via $transportLabel.');

    final resolvedOfflineMessage =
        offlineMessage ?? 'No internet connection. Changes may not sync yet.';

    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor, width: 1.2),
      ),
      child: Row(
        children: [
          Icon(
            isOnline ? Icons.wifi : Icons.wifi_off,
            size: 18,
            color: textColor,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              isOnline ? resolvedOnlineMessage : resolvedOfflineMessage,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                color: textColor,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
