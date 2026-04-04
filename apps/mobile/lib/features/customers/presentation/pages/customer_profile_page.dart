import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';

import '../widgets/profile_info_card.dart';

class CustomerProfilePage extends StatelessWidget {
  const CustomerProfilePage({super.key, required this.customerId});

  final String customerId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(child: _buildHeader(context)),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                _buildQuickActions(context),
                _buildContactInfo(),
                _buildSpendingSummary(),
                _buildOrderHistory(context),
                const SizedBox(height: 50),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1A1A2E), Color(0xFF2A2A4E)],
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            top: -40,
            right: -40,
            child: Container(
              width: 160,
              height: 160,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.softOrange.withValues(alpha: 0.18),
              ),
            ),
          ),
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _HeaderBtn(
                        icon: Icons.arrow_back,
                        onTap: () => Navigator.of(context).pop(),
                      ),
                      Text(
                        'Customer Profile',
                        style: TextTheme.of(context).labelSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: Colors.white.withValues(alpha: 0.7),
                          fontSize: 12,
                        ),
                      ),
                      _HeaderBtn(icon: Icons.more_horiz, onTap: () {}),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          color: AppColors.softOrangeLight,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.2),
                            width: 3,
                          ),
                        ),
                        alignment: Alignment.center,
                        child: const Text('👩', style: TextStyle(fontSize: 28)),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Daw Aye Aye',
                              style: TextTheme.of(context).titleLarge?.copyWith(
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                fontSize: 18,
                                height: 1.1,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              '📞 09 9871 2345 · Hlaing',
                              style: TextTheme.of(context).bodySmall?.copyWith(
                                fontWeight: FontWeight.w600,
                                color: Colors.white.withValues(alpha: 0.6),
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                _buildChip(
                                  context,
                                  '⭐ VIP',
                                  const Color(0xFFFCD34D),
                                  const Color(0xFF92400E),
                                ),
                                _buildChip(
                                  context,
                                  '🔁 Loyal',
                                  AppColors.teal.withValues(alpha: 0.3),
                                  const Color(0xFF7DF0EB),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _buildHeaderStat('18', 'Orders', context),
                        _buildHeaderStat(
                          '312K',
                          'MMK Spent',
                          context,
                          valueColor: const Color(0xFFFF9F7A),
                        ),
                        _buildHeaderStat('17K', 'Avg Order', context),
                        _buildHeaderStat(
                          '94%',
                          'Delivered',
                          context,
                          valueColor: const Color(0xFF4ADE80),
                          showBorder: false,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChip(
    BuildContext context,
    String label,
    Color bgColor,
    Color textColor,
  ) {
    return Container(
      margin: const EdgeInsets.only(right: 6),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextTheme.of(context).labelSmall?.copyWith(
          fontWeight: FontWeight.w800,
          color: textColor,
          fontSize: 10,
        ),
      ),
    );
  }

  Widget _buildHeaderStat(
    String val,
    String label,
    BuildContext context, {
    Color valueColor = Colors.white,
    bool showBorder = true,
  }) {
    return Expanded(
      child: Container(
        decoration: BoxDecoration(
          border: showBorder
              ? Border(
                  right: BorderSide(
                    color: Colors.white.withValues(alpha: 0.1),
                    width: 1,
                  ),
                )
              : null,
        ),
        child: Column(
          children: [
            Text(
              val,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: valueColor,
                height: 1,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: Colors.white.withValues(alpha: 0.5),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        children: [
          Expanded(
            child: _QuickActionChip(icon: '📞', label: 'Call', onTap: () {}),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _QuickActionChip(icon: '💬', label: 'Message', onTap: () {}),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _QuickActionChip(
              icon: '📦',
              label: 'New Order',
              activeColor: AppColors.softOrange,
              activeBgColor: AppColors.softOrangeLight,
              onTap: () {},
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _QuickActionChip(icon: '🗺', label: 'Map', onTap: () {}),
          ),
        ],
      ),
    );
  }

  Widget _buildContactInfo() {
    return const CustomerProfileInfoCard(
      icon: '👤',
      iconBgColor: AppColors.softOrangeLight,
      title: 'Contact Info',
      rows: [
        CustomerProfileInfoRow(
          keyLabel: 'Phone',
          valueLabel: '09 9871 2345',
          valueColor: AppColors.teal,
        ),
        CustomerProfileInfoRow(
          keyLabel: 'Township',
          valueLabel: 'Hlaing, Yangon',
        ),
        CustomerProfileInfoRow(
          keyLabel: 'Address',
          valueLabel: 'No. 12, Shwe Taung Gyar St, Hlaing',
          valueColor: AppColors.textMid,
          valueFontSize: 11,
        ),
        CustomerProfileInfoRow(
          keyLabel: 'Customer Since',
          valueLabel: 'Jan 5, 2024',
        ),
      ],
    );
  }

  Widget _buildSpendingSummary() {
    return const CustomerProfileInfoCard(
      icon: '💰',
      iconBgColor: AppColors.tealLight,
      title: 'Spending Summary',
      rows: [
        CustomerProfileInfoRow(
          keyLabel: 'Total Spent',
          valueLabel: '312,000 MMK',
          valueColor: AppColors.softOrange,
          valueFontSize: 15,
        ),
        CustomerProfileInfoRow(
          keyLabel: 'Largest Order',
          valueLabel: '72,000 MMK',
        ),
        CustomerProfileInfoRow(
          keyLabel: 'Favourite Item',
          valueLabel: '👗 Silk Longyi',
        ),
        CustomerProfileInfoRow(
          keyLabel: 'Last Order',
          valueLabel: 'Apr 1, 2025',
        ),
      ],
    );
  }

  Widget _buildOrderHistory(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: AppColors.purpleLight,
                  borderRadius: BorderRadius.circular(9),
                ),
                alignment: Alignment.center,
                child: const Text('📋', style: TextStyle(fontSize: 14)),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Order History',
                  style: TextTheme.of(context).bodyLarge?.copyWith(
                    fontWeight: FontWeight.w900,
                    color: AppColors.textDark,
                    fontSize: 13,
                  ),
                ),
              ),
              GestureDetector(
                onTap: () {},
                child: Text(
                  'See all (18)',
                  style: TextTheme.of(context).labelSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: AppColors.softOrange,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildMiniOrder(
            context,
            '#ORD-0238',
            'Summer Dress × 3',
            'Apr 1, 4:22 PM',
            '54,000 MMK',
            true,
          ),
          _buildMiniOrder(
            context,
            '#ORD-0221',
            'Silk Longyi Set × 2',
            'Mar 28, 10:05 AM',
            '36,000 MMK',
            true,
          ),
          _buildMiniOrder(
            context,
            '#ORD-0198',
            'Handbag (Red) × 1',
            'Mar 20, 2:14 PM',
            '32,000 MMK',
            true,
            isLast: true,
          ),
        ],
      ),
    );
  }

  Widget _buildMiniOrder(
    BuildContext context,
    String id,
    String product,
    String date,
    String price,
    bool delivered, {
    bool isLast = false,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        border: isLast
            ? null
            : const Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  id,
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontWeight: FontWeight.w700,
                    color: AppColors.textLight,
                    fontSize: 10,
                  ),
                ),
                Text(
                  product,
                  style: TextTheme.of(context).bodyMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: AppColors.textDark,
                    fontSize: 12,
                  ),
                ),
                Text(
                  date,
                  style: TextTheme.of(context).labelSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.textLight,
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                price,
                style: TextTheme.of(context).titleMedium?.copyWith(
                  fontWeight: FontWeight.w900,
                  color: AppColors.textDark,
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 2),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.greenLight,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  'DELIVERED',
                  style: TextTheme.of(context).labelSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: AppColors.green,
                    fontSize: 9,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeaderBtn extends StatelessWidget {
  const _HeaderBtn({required this.icon, this.onTap});

  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.12),
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.2),
            width: 1.5,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        alignment: Alignment.center,
        child: Icon(icon, color: Colors.white, size: 18),
      ),
    );
  }
}

class _QuickActionChip extends StatelessWidget {
  const _QuickActionChip({
    required this.icon,
    required this.label,
    this.activeColor,
    this.activeBgColor,
    this.onTap,
  });

  final String icon;
  final String label;
  final Color? activeColor;
  final Color? activeBgColor;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final bgColor = activeBgColor ?? Colors.white;
    final borderColor = activeColor ?? AppColors.border;
    final textColor = activeColor ?? AppColors.textMid;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: bgColor,
          border: Border.all(color: borderColor, width: 2),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          children: [
            Text(icon, style: const TextStyle(fontSize: 20)),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextTheme.of(context).labelSmall?.copyWith(
                fontWeight: FontWeight.w800,
                color: textColor,
                fontSize: 10,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
