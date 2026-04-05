import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../widgets/search_filter_bottom_sheet.dart';

class SearchHomePage extends StatefulWidget {
  const SearchHomePage({super.key});

  @override
  State<SearchHomePage> createState() => _SearchHomePageState();
}

class _SearchHomePageState extends State<SearchHomePage> {
  final TextEditingController _searchController = TextEditingController(
    text: 'khin',
  );
  String _activePill = 'All';

  @override
  Widget build(BuildContext context) {
    final query = _searchController.text.trim();
    final hasResults =
        query.toLowerCase() == 'khin'; // mock condition for empty vs results

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            _buildSearchHeader(context),
            Expanded(
              child: hasResults
                  ? _buildResultsView(query)
                  : _buildEmptyState(query),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(top: 14, left: 20, right: 20),
      decoration: const BoxDecoration(
        color: AppColors.warmWhite,
        border: Border(bottom: BorderSide(color: AppColors.border, width: 1.5)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              // Back Button matching .back-btn design
              GestureDetector(
                onTap: () => context.pop(),
                child: Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(color: AppColors.border, width: 2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  alignment: Alignment.center,
                  child: const Text(
                    '←',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textDark,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Search Box
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    border: Border.all(color: AppColors.softOrange, width: 2),
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.softOrange.withValues(alpha: 0.1),
                        blurRadius: 0,
                        spreadRadius: 3,
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.md,
                  ),
                  child: Row(
                    children: [
                      const Text('🔍', style: TextStyle(fontSize: 16)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _searchController,
                          onChanged: (val) => setState(() {}),
                          cursorColor: AppColors.softOrange,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textDark,
                          ),
                          decoration: const InputDecoration(
                            border: InputBorder.none,
                            enabledBorder: InputBorder.none,
                            focusedBorder: InputBorder.none,
                            disabledBorder: InputBorder.none,
                            errorBorder: InputBorder.none,
                            isDense: true,
                            fillColor: AppColors.background,
                            contentPadding: EdgeInsets.symmetric(vertical: 11),
                            hintText: 'Search orders or customers...',
                          ),
                        ),
                      ),
                      if (_searchController.text.isNotEmpty)
                        GestureDetector(
                          onTap: () {
                            _searchController.clear();
                            setState(() {});
                          },
                          child: const Icon(
                            Icons.close_rounded,
                            size: 16,
                            color: AppColors.textLight,
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Cancel Button
              GestureDetector(
                onTap: () => context.pop(),
                child: const Text(
                  'Cancel',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: AppColors.softOrange,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildPill('All'),
                const SizedBox(width: 6),
                _buildPill('Orders'),
                const SizedBox(width: 6),
                _buildPill('Customers'),
                const SizedBox(width: 6),
                _buildFilterPillIcon(context),
                const SizedBox(width: 6),
                _buildPill('🆕 New', isTeal: true),
                const SizedBox(width: 6),
                _buildPill('Delivered'),
                const SizedBox(width: 6),
                _buildPill('Today'),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }

  Widget _buildPill(String label, {bool isTeal = false}) {
    return AppFilterPill(
      label: label,
      isSelected: _activePill == label,
      style: isTeal ? AppFilterPillStyle.teal : AppFilterPillStyle.standard,
      onTap: () => setState(() => _activePill = label),
    );
  }

  Widget _buildFilterPillIcon(BuildContext context) {
    return AppFilterPill(
      label: '🎛 Filters (2)',
      isSelected: false,
      style: AppFilterPillStyle.teal,
      onTap: () => SearchFilterBottomSheet.show(context),
    );
  }

  Widget _buildResultsView(String query) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            RichText(
              text: TextSpan(
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textMid,
                ),
                children: [
                  const TextSpan(text: '4 results for "'),
                  TextSpan(
                    text: query,
                    style: const TextStyle(color: AppColors.textDark),
                  ),
                  const TextSpan(text: '"'),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: AppColors.border, width: 1.5),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Row(
                children: [
                  Icon(Icons.swap_vert, size: 14, color: AppColors.textMid),
                  SizedBox(width: 4),
                  Text(
                    'Latest',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textMid,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Customers Header
        _buildSectionHeader(
          '👥 Customers',
          AppColors.teal,
          AppColors.tealLight,
        ),
        _buildCustomerCard(
          'Khin Myat (Daw)',
          '📞 09 7812 3456 · Sanchaung',
          '14 orders',
          query,
        ),
        _buildCustomerCard(
          'Khin Su Wai',
          '📞 09 6644 1234 · Bahan',
          '5 orders',
          query,
          isPurpleAvatar: true,
        ),

        const SizedBox(height: 12),

        // Orders Header
        _buildSectionHeader(
          '📦 Orders',
          AppColors.softOrange,
          AppColors.softOrangeLight,
        ),
        _buildOrderCard(
          'Daw Khin Myat',
          '#ORD-0244 · Today 10:32 AM',
          '👗 Silk Longyi Set × 2',
          '45,000 MMK',
          'NEW',
          AppColors.softOrange,
          AppColors.softOrangeLight,
          query,
        ),
        _buildOrderCard(
          'Khin Su Wai',
          '#ORD-0201 · Mar 22',
          '💄 Lipstick Set × 3',
          '24,000 MMK',
          'DELIVERED',
          AppColors.green,
          AppColors.greenLight,
          query,
          isPurpleAvatar: true,
        ),
      ],
    );
  }

  Widget _buildSectionHeader(String label, Color color, Color bgColor) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        label.toUpperCase(),
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w800,
          color: color,
          letterSpacing: 0.6,
        ),
      ),
    );
  }

  Widget _buildCustomerCard(
    String name,
    String details,
    String trailingText,
    String query, {
    bool isPurpleAvatar = false,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.border, width: 1.5),
        borderRadius: BorderRadius.circular(16),
      ),
      child: IntrinsicHeight(
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Positioned(
              left: -14,
              top: -12,
              bottom: -12,
              child: Container(
                width: 4,
                decoration: const BoxDecoration(
                  color: AppColors.teal,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(14),
                    bottomLeft: Radius.circular(14),
                  ),
                ),
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: isPurpleAvatar
                            ? AppColors.purpleLight
                            : AppColors.softOrangeLight,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      alignment: Alignment.center,
                      child: const Text('👩', style: TextStyle(fontSize: 15)),
                    ),
                    const SizedBox(width: 8),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildHighlightedText(name, query),
                        const SizedBox(height: 2),
                        Text(
                          details,
                          style: const TextStyle(
                            fontSize: 10,
                            color: AppColors.textLight,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                Text(
                  trailingText,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: AppColors.teal,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderCard(
    String name,
    String idDetails,
    String product,
    String price,
    String badgeLabel,
    Color badgeColor,
    Color badgeBg,
    String query, {
    bool isPurpleAvatar = false,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.border, width: 1.5),
        borderRadius: BorderRadius.circular(16),
      ),
      child: IntrinsicHeight(
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Positioned(
              left: -14,
              top: -12,
              bottom: -12,
              child: Container(
                width: 4,
                decoration: BoxDecoration(
                  color: badgeColor,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(14),
                    bottomLeft: Radius.circular(14),
                  ),
                ),
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: isPurpleAvatar
                                ? AppColors.purpleLight
                                : AppColors.softOrangeLight,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          alignment: Alignment.center,
                          child: const Text(
                            '👩',
                            style: TextStyle(fontSize: 15),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildHighlightedText(name, query),
                            const SizedBox(height: 2),
                            Text(
                              idDetails,
                              style: const TextStyle(
                                fontSize: 10,
                                color: AppColors.textLight,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 9,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: badgeBg,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        badgeLabel,
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          color: badgeColor,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      product,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textMid,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      price,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w900,
                        color: AppColors.textDark,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(String query) {
    if (query.isEmpty) return const SizedBox.shrink();

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('🔍', style: TextStyle(fontSize: 52)),
            const SizedBox(height: 14),
            const Text(
              'No results found',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w900,
                color: AppColors.textDark,
              ),
            ),
            const SizedBox(height: 6),
            RichText(
              textAlign: TextAlign.center,
              text: TextSpan(
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textMid,
                  fontWeight: FontWeight.w600,
                  height: 1.6,
                ),
                children: [
                  const TextSpan(text: 'No orders or customers match '),
                  TextSpan(
                    text: '"$query"\n\n',
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      color: AppColors.textDark,
                    ),
                  ),
                  const TextSpan(
                    text:
                        'Try a different name, phone number, or order ID like #ORD-0244',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.softOrangeLight,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                '💡 Tip: Search by phone number like "09 781…" for fastest results',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: AppColors.softOrange,
                ),
                textAlign: TextAlign.left,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // A basic mock highlighting widget
  Widget _buildHighlightedText(String text, String query) {
    if (query.isEmpty) {
      return Text(
        text,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w900,
          color: AppColors.textDark,
        ),
      );
    }

    final lowerText = text.toLowerCase();
    final lowerQuery = query.toLowerCase();
    final startIndex = lowerText.indexOf(lowerQuery);

    if (startIndex == -1) {
      return Text(
        text,
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w900,
          color: AppColors.textDark,
        ),
      );
    }

    final before = text.substring(0, startIndex);
    final highlight = text.substring(startIndex, startIndex + query.length);
    final after = text.substring(startIndex + query.length);

    return RichText(
      text: TextSpan(
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w900,
          color: AppColors.textDark,
        ),
        children: [
          if (before.isNotEmpty) TextSpan(text: before),
          TextSpan(
            text: highlight,
            style: const TextStyle(
              backgroundColor: Color(0xFFFFECB0),
              color: AppColors.textDark,
            ),
          ),
          if (after.isNotEmpty) TextSpan(text: after),
        ],
      ),
    );
  }
}
