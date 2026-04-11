import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';

class SearchFilterBottomSheet extends StatefulWidget {
  const SearchFilterBottomSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const SearchFilterBottomSheet(),
    );
  }

  @override
  State<SearchFilterBottomSheet> createState() =>
      _SearchFilterBottomSheetState();
}

class _SearchFilterBottomSheetState extends State<SearchFilterBottomSheet> {
  String _statusSelected = 'New';
  String _quickDateSelected = 'This Week';
  String _sortSelected = 'Newest first';

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.88,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (_, controller) {
        return Container(
          decoration: const BoxDecoration(
            color: AppColors.warmWhite,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: Column(
            children: [
              // Handle
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(top: 12, bottom: 16),
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Expanded(
                child: ListView(
                  controller: controller,
                  padding: const EdgeInsets.only(
                    left: 20,
                    right: 20,
                    bottom: 36,
                  ),
                  children: [
                    const Text(
                      'Filter & Sort',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w900,
                        color: AppColors.textDark,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'စစ်ထုတ်မည် — ကြည့်ရှုမည်',
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.textLight,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'NotoSansMyanmar',
                      ),
                    ),
                    const SizedBox(height: 18),

                    // Order Status
                    const _SectionTitle('Order Status'),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _buildStatusChip(
                          '🆕 New',
                          AppColors.softOrange,
                          AppColors.softOrangeLight,
                          AppColors.softOrangeMid,
                        ),
                        _buildStatusChip(
                          '✅ Confirmed',
                          AppColors.teal,
                          AppColors.tealLight,
                          AppColors.teal,
                        ),
                        _buildStatusChip(
                          '🚚 Shipping',
                          AppColors.textMid,
                          Colors.white,
                          AppColors.border,
                        ),
                        _buildStatusChip(
                          '🎉 Delivered',
                          AppColors.green,
                          AppColors.greenLight,
                          AppColors.green,
                        ),
                        _buildStatusChip(
                          '✗ Cancelled',
                          AppColors.textMid,
                          Colors.white,
                          AppColors.border,
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),

                    // Date Range
                    const _SectionTitle('Date Range'),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const _SectionTitle('From', noMargin: true),
                              const SizedBox(height: 4),
                              _buildDateInput('Apr 1, 2025'),
                            ],
                          ),
                        ),
                        const Padding(
                          padding: EdgeInsets.only(left: 8, right: 8, top: 12),
                          child: Text(
                            '→',
                            style: TextStyle(
                              color: AppColors.textLight,
                              fontWeight: FontWeight.w800,
                              fontSize: 14,
                            ),
                          ),
                        ),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const _SectionTitle('To', noMargin: true),
                              const SizedBox(height: 4),
                              _buildDateInput('Apr 2, 2025'),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    // Quick Date Chips
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        _buildQuickDateChip('Today'),
                        _buildQuickDateChip('This Week'),
                        _buildQuickDateChip('This Month'),
                        _buildQuickDateChip('Custom'),
                      ],
                    ),
                    const SizedBox(height: 18),

                    // Price Range
                    const _SectionTitle('Price Range (MMK)'),
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Column(
                        children: [
                          const Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '10,000',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.textMid,
                                ),
                              ),
                              Text(
                                '10K – 70K selected',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.softOrange,
                                ),
                              ),
                              Text(
                                '100,000+',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.textMid,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          // Custom slider track UI
                          SizedBox(
                            height: 24,
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                Container(
                                  height: 6,
                                  decoration: BoxDecoration(
                                    color: AppColors.border,
                                    borderRadius: BorderRadius.circular(3),
                                  ),
                                ),
                                Positioned(
                                  left: 30, // arbitrary visual
                                  right: 90, // arbitrary visual
                                  child: Container(
                                    height: 6,
                                    decoration: BoxDecoration(
                                      color: AppColors.softOrange,
                                      borderRadius: BorderRadius.circular(3),
                                    ),
                                  ),
                                ),
                                Positioned(left: 20, child: _buildSliderKnob()),
                                Positioned(
                                  right: 80,
                                  child: _buildSliderKnob(),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),

                    // Sort By
                    const _SectionTitle('Sort By'),
                    Column(
                      children: [
                        _buildSortOption('Newest first'),
                        const SizedBox(height: 6),
                        _buildSortOption('Highest price first'),
                        const SizedBox(height: 6),
                        _buildSortOption('Oldest first'),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Apply Row
                    Row(
                      children: [
                        AppButton(
                          text: 'Reset',
                          onPressed: () {},
                          variant: AppButtonVariant.secondary,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: AppButton(
                            text: 'Show 12 Results →',
                            onPressed: () => Navigator.of(context).pop(),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatusChip(
    String label,
    Color color,
    Color bgColor,
    Color borderColor,
  ) {
    final bareLabel = label.split(' ').last;
    final isSelected = _statusSelected == bareLabel;

    return GestureDetector(
      onTap: () => setState(() => _statusSelected = bareLabel),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? bgColor : Colors.white,
          border: Border.all(
            color: isSelected ? borderColor : AppColors.border,
            width: 2,
          ),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w800,
            color: isSelected ? color : AppColors.textMid,
          ),
        ),
      ),
    );
  }

  Widget _buildDateInput(String value) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.softOrange, width: 2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        value,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: AppColors.textDark,
        ),
      ),
    );
  }

  Widget _buildQuickDateChip(String label) {
    final isSelected = _quickDateSelected == label;
    return GestureDetector(
      onTap: () => setState(() => _quickDateSelected = label),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.softOrangeLight : Colors.white,
          border: Border.all(
            color: isSelected ? AppColors.softOrangeMid : AppColors.border,
            width: 2,
          ),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: isSelected ? AppColors.softOrange : AppColors.textMid,
          ),
        ),
      ),
    );
  }

  Widget _buildSortOption(String label) {
    final isSelected = _sortSelected == label;
    return GestureDetector(
      onTap: () => setState(() => _sortSelected = label),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.softOrangeLight : Colors.white,
          border: Border.all(
            color: isSelected ? AppColors.softOrange : AppColors.border,
            width: 2,
          ),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          children: [
            Container(
              width: 18,
              height: 18,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected ? AppColors.softOrange : Colors.white,
                border: Border.all(
                  color: isSelected ? AppColors.softOrange : AppColors.border,
                  width: 2,
                ),
              ),
              alignment: Alignment.center,
              child: isSelected
                  ? Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 12),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: isSelected ? AppColors.softOrange : AppColors.textMid,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSliderKnob() {
    return Container(
      width: 18,
      height: 18,
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.softOrange, width: 2.5),
        boxShadow: const [
          BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2)),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title, {this.noMargin = false});
  final String title;
  final bool noMargin;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: noMargin ? 0 : 10),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          color: AppColors.textLight,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}
