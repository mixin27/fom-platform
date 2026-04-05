import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:fom_mobile/app/router/app_route_paths.dart';
import 'package:go_router/go_router.dart';

import '../widgets/customer_card.dart';

class CustomersHomePage extends StatefulWidget {
  const CustomersHomePage({super.key});

  @override
  State<CustomersHomePage> createState() => _CustomersHomePageState();
}

class _CustomersHomePageState extends State<CustomersHomePage> {
  int _selectedTab = 0;

  final List<CustomerListItemData> _mockCustomers = const [
    CustomerListItemData(
      id: 'C-001',
      name: 'Daw Aye Aye',
      phone: '09 9871 2345',
      location: 'Hlaing',
      avatarEmoji: '👩',
      avatarBgColor: AppColors.softOrangeLight,
      spentMmk: 312000,
      ordersCount: 18,
      lastActive: '2 days ago',
      badgeType: CustomerBadgeType.vip,
    ),
    CustomerListItemData(
      id: 'C-002',
      name: 'Daw Khin Myat',
      phone: '09 7812 3456',
      location: 'Sanchaung',
      avatarEmoji: '👩',
      avatarBgColor: AppColors.softOrangeLight,
      spentMmk: 245000,
      ordersCount: 14,
      lastActive: 'Today',
      badgeType: CustomerBadgeType.vip,
    ),
    CustomerListItemData(
      id: 'C-003',
      name: 'Ko Zaw Lin',
      phone: '09 4556 7890',
      location: 'Tarmwe',
      avatarEmoji: '👨',
      avatarBgColor: AppColors.tealLight,
      spentMmk: 21000,
      ordersCount: 1,
      lastActive: 'Today',
      badgeType: CustomerBadgeType.newCustomer,
    ),
    CustomerListItemData(
      id: 'C-004',
      name: 'Khin Su Wai',
      phone: '09 6644 1234',
      location: 'Bahan',
      avatarEmoji: '👩',
      avatarBgColor: AppColors.purpleLight,
      spentMmk: 88000,
      ordersCount: 5,
      lastActive: '3 days ago',
    ),
    CustomerListItemData(
      id: 'C-005',
      name: 'Ma Thin Zar',
      phone: '09 2234 5678',
      location: 'Hlaing',
      avatarEmoji: '👩',
      avatarBgColor: AppColors.greenLight,
      spentMmk: 185000,
      ordersCount: 9,
      lastActive: 'Yesterday',
    ),
    CustomerListItemData(
      id: 'C-006',
      name: 'U Kyaw Zin',
      phone: '09 5678 9012',
      location: 'Tarmwe',
      avatarEmoji: '👨',
      avatarBgColor: AppColors.yellowLight,
      spentMmk: 54000,
      ordersCount: 3,
      lastActive: 'Today',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      floatingActionButton: FloatingActionButton(
        heroTag: 'customers_fab',
        onPressed: () {},
        backgroundColor: AppColors.softOrange,
        elevation: 8,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: const Icon(Icons.add, color: Colors.white, size: 28),
      ),
      body: SafeArea(
        child: Stack(
          children: [
            CustomScrollView(
              slivers: [
                SliverToBoxAdapter(child: _buildHeader(context)),
                SliverPadding(
                  padding: const EdgeInsets.only(
                    left: 16,
                    right: 32,
                    top: 16,
                    bottom: 90,
                  ),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
                      // Stats Row
                      Row(
                        children: [
                          Expanded(child: _buildStatPill('89', 'Customers')),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _buildStatPill(
                              '12',
                              'VIP',
                              valueColor: AppColors.softOrange,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _buildStatPill(
                              '7',
                              'New this wk',
                              valueColor: AppColors.teal,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      _buildSectionLabel('A'),
                      CustomerCard(
                        data: _mockCustomers[0],
                        onTap: () =>
                            context.push('/customers/${_mockCustomers[0].id}'),
                      ), // Aye Aye

                      _buildSectionLabel('D'),
                      CustomerCard(
                        data: _mockCustomers[1],
                        onTap: () =>
                            context.push('/customers/${_mockCustomers[1].id}'),
                      ), // Khin Myat

                      _buildSectionLabel('K'),
                      CustomerCard(
                        data: _mockCustomers[2],
                        onTap: () =>
                            context.push('/customers/${_mockCustomers[2].id}'),
                      ), // Zaw Lin
                      CustomerCard(
                        data: _mockCustomers[3],
                        onTap: () =>
                            context.push('/customers/${_mockCustomers[3].id}'),
                      ), // Khin Su Wai

                      _buildSectionLabel('M'),
                      CustomerCard(
                        data: _mockCustomers[4],
                        onTap: () =>
                            context.push('/customers/${_mockCustomers[4].id}'),
                      ), // Thin Zar

                      _buildSectionLabel('U'),
                      CustomerCard(
                        data: _mockCustomers[5],
                        onTap: () =>
                            context.push('/customers/${_mockCustomers[5].id}'),
                      ), // Kyaw Zin
                    ]),
                  ),
                ),
              ],
            ),

            // Alpha Index
            const Positioned(
              right: 8,
              top: 0,
              bottom: 0,
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _AlphaLetter('A'),
                    _AlphaLetter('D'),
                    _AlphaLetter('K'),
                    _AlphaLetter('M'),
                    _AlphaLetter('S'),
                    _AlphaLetter('T'),
                    _AlphaLetter('U'),
                    _AlphaLetter('Y'),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 2, top: 4),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w800,
          color: AppColors.textLight,
          letterSpacing: 1.1, // 0.1em approx
        ),
      ),
    );
  }

  Widget _buildStatPill(
    String val,
    String label, {
    Color valueColor = AppColors.textDark,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            val,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              color: valueColor,
              height: 1,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w800,
              color: AppColors.textLight,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      color: AppColors.warmWhite,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Top
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Customers',
                      style: TextTheme.of(context).bodyLarge?.copyWith(
                        fontWeight: FontWeight.w900,
                        color: AppColors.textDark,
                        fontSize: 18,
                        height: 1.2,
                      ),
                    ),
                    Text(
                      'ဖောက်သည်များ',
                      style: TextTheme.of(context).bodySmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.textLight,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
                Row(
                  children: [
                    _IconBtn(
                      icon: '🔔',
                      onTap: () => context.push(AppRoutePaths.notifications),
                    ),
                    const SizedBox(width: 8),
                    _IconBtn(icon: '↕', onTap: () {}),
                    const SizedBox(width: 8),
                    _IconBtn(icon: '+', onTap: () {}),
                  ],
                ),
              ],
            ),
          ),

          // Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.background,
                border: Border.all(color: AppColors.border, width: 2),
                borderRadius: BorderRadius.circular(14),
              ),
              child: TextField(
                readOnly: true,
                onTap: () => context.push(AppRoutePaths.search),
                decoration: const InputDecoration(
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  disabledBorder: InputBorder.none,
                  errorBorder: InputBorder.none,
                  prefixIcon: Icon(Icons.search, size: 20),
                  prefixIconConstraints: BoxConstraints(minWidth: 32),
                  hintText: 'Search name, phone, township...',
                ),
              ),
            ),
          ),

          const SizedBox(height: 12),

          // Filter Tabs
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                const SizedBox(width: 14),
                _FilterTab(
                  label: 'All (89)',
                  isActive: _selectedTab == 0,
                  onTap: () => setState(() => _selectedTab = 0),
                ),
                _FilterTab(
                  label: 'VIP ⭐',
                  isActive: _selectedTab == 1,
                  onTap: () => setState(() => _selectedTab = 1),
                ),
                _FilterTab(
                  label: 'Top Spenders',
                  isActive: _selectedTab == 2,
                  onTap: () => setState(() => _selectedTab = 2),
                ),
                _FilterTab(
                  label: 'New This Week',
                  isActive: _selectedTab == 3,
                  onTap: () => setState(() => _selectedTab = 3),
                ),
                const SizedBox(width: 14),
              ],
            ),
          ),
          // Divider for tabs bottom
          Container(height: 1.5, color: AppColors.border),
        ],
      ),
    );
  }
}

class _AlphaLetter extends StatelessWidget {
  const _AlphaLetter(this.letter);
  final String letter;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.0),
      child: Text(
        letter,
        style: const TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w800,
          color: AppColors.textLight,
        ),
      ),
    );
  }
}

class _IconBtn extends StatelessWidget {
  const _IconBtn({required this.icon, this.onTap});

  final String icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: AppColors.border, width: 2),
          borderRadius: BorderRadius.circular(12),
        ),
        alignment: Alignment.center,
        child: Text(icon, style: const TextStyle(fontSize: 17)),
      ),
    );
  }
}

class _FilterTab extends StatelessWidget {
  const _FilterTab({
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  final String label;
  final bool isActive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 3),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? AppColors.background : Colors.transparent,
          border: Border(
            top: BorderSide(
              color: isActive ? AppColors.border : Colors.transparent,
              width: 2,
            ),
            left: BorderSide(
              color: isActive ? AppColors.border : Colors.transparent,
              width: 2,
            ),
            right: BorderSide(
              color: isActive ? AppColors.border : Colors.transparent,
              width: 2,
            ),
          ),
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
          ),
        ),
        child: Text(
          label,
          style: TextTheme.of(context).labelSmall?.copyWith(
            fontWeight: FontWeight.w800,
            color: isActive ? AppColors.softOrange : AppColors.textLight,
            fontSize: 11,
          ),
        ),
      ),
    );
  }
}
