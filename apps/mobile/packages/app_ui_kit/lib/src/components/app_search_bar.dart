import 'package:flutter/material.dart';
import '../tokens/app_colors.dart';
import '../tokens/app_spacing.dart';

/// A customized search bar with integrated filter button.
class AppSearchBar extends StatelessWidget {
  const AppSearchBar({
    required this.hintText,
    super.key,
    this.controller,
    this.onChanged,
    this.filterLabel,
    this.onFilterTap,
  });

  /// Hint text for the search input.
  final String hintText;

  /// Optional search controller.
  final TextEditingController? controller;

  /// Callback when the search text changes.
  final ValueChanged<String>? onChanged;

  /// Optional label for the filter button.
  final String? filterLabel;

  /// Optional callback for the filter button.
  final VoidCallback? onFilterTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppSpacing.borderRadiusMd),
        border: Border.all(color: AppColors.border, width: 2),
      ),
      child: Row(
        children: [
          const Icon(Icons.search, size: 16, color: AppColors.textLight),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              controller: controller,
              onChanged: onChanged,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: AppColors.textDark,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
              decoration: InputDecoration(
                hintText: hintText,
                hintStyle: theme.textTheme.bodyMedium?.copyWith(
                  color: AppColors.textLight,
                  fontSize: 13,
                ),
                isDense: true,
                contentPadding: EdgeInsets.zero,
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                filled: false,
              ),
            ),
          ),
          if (filterLabel != null) ...[
            const SizedBox(width: 8),
            GestureDetector(
              onTap: onFilterTap,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: AppColors.softOrangeLight,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  filterLabel!,
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: AppColors.softOrange,
                    fontWeight: FontWeight.w800,
                    fontSize: 11,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
