import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:fom_mobile/app/router/app_route_paths.dart';
import 'package:go_router/go_router.dart';

import '../widgets/home_header.dart';
import '../widgets/order_card.dart';

class OrdersHomePage extends StatefulWidget {
  const OrdersHomePage({super.key});

  @override
  State<OrdersHomePage> createState() => _OrdersHomePageState();
}

class _OrdersHomePageState extends State<OrdersHomePage> {
  int _selectedTab = 0;

  final List<OrderEntryData> _mockOrders = const [
    OrderEntryData(
      id: 'ORD-0241',
      customerName: 'Daw Khin Myat',
      customerPhone: '09 7812 3456 · Sanchaung',
      customerAvatar: '👩',
      productSummary: 'Silk Longyi Set × 2',
      productIcon: '👗',
      priceMmk: 45000,
      timeLabel: '10:32 AM — 2h ago',
      status: OrderStatusType.newOrder,
    ),
    OrderEntryData(
      id: 'ORD-0243',
      customerName: 'U Kyaw Zin',
      customerPhone: '09 5678 9012 · Tarmwe',
      customerAvatar: '👨',
      productSummary: 'Formal Shirt × 3',
      productIcon: '👔',
      priceMmk: 54000,
      timeLabel: '11:10 AM — 1h ago',
      status: OrderStatusType.newOrder,
    ),
    OrderEntryData(
      id: 'ORD-0240',
      customerName: 'Ko Zaw Lin',
      customerPhone: '09 4556 7890',
      customerAvatar: '👨',
      productSummary: 'Men Shirt (L) × 1',
      productIcon: '👔',
      priceMmk: 18500,
      timeLabel: '9:14 AM',
      status: OrderStatusType.outForDelivery,
    ),
    OrderEntryData(
      id: 'ORD-0239',
      customerName: 'Ma Thin Zar',
      customerPhone: '09 2234 5678 · Hlaing',
      customerAvatar: '👩',
      productSummary: 'Handbag (Black) × 1',
      productIcon: '👜',
      priceMmk: 32000,
      timeLabel: '8:50 AM · Confirmed 2h ago',
      status: OrderStatusType.confirmed,
    ),
    OrderEntryData(
      id: 'ORD-0238',
      customerName: 'Daw Aye Aye',
      customerPhone: '09 9871 2345',
      customerAvatar: '👩',
      productSummary: 'Summer Dress × 3',
      productIcon: '👗',
      priceMmk: 54000,
      timeLabel: 'Apr 1, 4:22 PM',
      status: OrderStatusType.delivered,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    List<OrderEntryData> displayingOrders = _mockOrders;

    if (_selectedTab == 2) {
      displayingOrders = _mockOrders
          .where(
            (o) =>
                o.status == OrderStatusType.newOrder ||
                o.status == OrderStatusType.confirmed,
          )
          .toList();
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push(AppRoutePaths.addOrder),
        backgroundColor: AppColors.softOrange,
        elevation: 8,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: const Icon(Icons.add, color: Colors.white, size: 28),
      ),
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: HomeHeader(
                selectedTab: _selectedTab,
                onTabChanged: (val) => setState(() => _selectedTab = val),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // Search Bar
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 2,
                    ),
                    margin: const EdgeInsets.only(bottom: 14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(color: AppColors.border, width: 2),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: TextField(
                      decoration: InputDecoration(
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        prefixIcon: const Icon(Icons.search, size: 20),
                        prefixIconConstraints: const BoxConstraints(
                          minWidth: 32,
                        ),
                        hintText: _selectedTab == 2
                            ? 'Search pending orders...'
                            : 'Search orders, customers...',
                        suffixIcon: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.softOrangeLight,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                _selectedTab == 2 ? '8 results' : 'Filter',
                                style: TextTheme.of(context).labelSmall
                                    ?.copyWith(
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.softOrange,
                                      fontSize: 11,
                                    ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  // Content
                  if (_selectedTab == 2) ...[
                    _buildSectionHeader('Needs Confirmation', context),
                    ...displayingOrders
                        .where((o) => o.status == OrderStatusType.newOrder)
                        .map(
                          (o) => OrderCard(
                            data: o,
                            onTap: () => context.push(
                              AppRoutePaths.orderDetails.replaceFirst(
                                ':id',
                                o.id,
                              ),
                            ),
                          ),
                        ),
                    _buildSectionHeader('Ready to Ship', context),
                    ...displayingOrders
                        .where((o) => o.status == OrderStatusType.confirmed)
                        .map(
                          (o) => OrderCard(
                            data: o,
                            onTap: () => context.push(
                              AppRoutePaths.orderDetails.replaceFirst(
                                ':id',
                                o.id,
                              ),
                            ),
                          ),
                        ),
                  ] else ...[
                    _buildSectionHeader('Today — April 2', context),
                    ...displayingOrders
                        .where((o) => o.status != OrderStatusType.delivered)
                        .map(
                          (o) => OrderCard(
                            data: o,
                            onTap: () => context.push(
                              AppRoutePaths.orderDetails.replaceFirst(
                                ':id',
                                o.id,
                              ),
                            ),
                          ),
                        ),
                    _buildSectionHeader('Yesterday — April 1', context),
                    ...displayingOrders
                        .where((o) => o.status == OrderStatusType.delivered)
                        .map((o) => OrderCard(data: o)),
                  ],
                  const SizedBox(height: 80), // FAB spacer
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 4, bottom: 8, left: 2, right: 2),
      child: Text(
        title.toUpperCase(),
        style: TextTheme.of(context).labelSmall?.copyWith(
          fontWeight: FontWeight.w800,
          color: AppColors.textLight,
          fontSize: 11,
          letterSpacing: 1.1,
        ),
      ),
    );
  }
}
