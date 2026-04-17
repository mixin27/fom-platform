import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fom_mobile/app/di/injection_container.dart';
import 'package:fom_mobile/app/router/app_route_paths.dart';
import 'package:fom_mobile/features/customers/feature_customers.dart';
import 'package:fom_mobile/features/orders/domain/entities/order_list_item.dart';
import 'package:fom_mobile/features/orders/domain/entities/order_status.dart';
import 'package:fom_mobile/features/orders/presentation/models/orders_home_tab.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

class CustomerOrdersPage extends StatelessWidget {
  const CustomerOrdersPage({
    super.key,
    required this.customerId,
    required this.customerName,
    required this.customerPhone,
    required this.shopId,
  });

  final String customerId;
  final String customerName;
  final String customerPhone;
  final String shopId;

  @override
  Widget build(BuildContext context) {
    return BlocProvider<CustomerOrdersBloc>(
      create: (_) => getIt<CustomerOrdersBloc>()
        ..add(
          CustomerOrdersStarted(
            shopId: shopId,
            shopName: '',
            customerId: customerId,
            customerName: customerName,
            customerPhone: customerPhone,
          ),
        ),
      child: const _CustomerOrdersView(),
    );
  }
}

class _CustomerOrdersView extends StatefulWidget {
  const _CustomerOrdersView();

  @override
  State<_CustomerOrdersView> createState() => _CustomerOrdersViewState();
}

class _CustomerOrdersViewState extends State<_CustomerOrdersView> {
  late final TextEditingController _searchController;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController()..addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController
      ..removeListener(_onSearchChanged)
      ..dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<CustomerOrdersBloc, CustomerOrdersState>(
      listenWhen: (previous, current) {
        return previous.errorMessage != current.errorMessage &&
            current.errorMessage != null;
      },
      listener: (context, state) {
        final message = state.errorMessage;
        if (message == null || message.isEmpty) {
          return;
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
        );
        context.read<CustomerOrdersBloc>().add(
          const CustomerOrdersErrorDismissed(),
        );
      },
      builder: (context, state) {
        final tabs = kOrdersHomeTabs
            .map((tab) => '${tab.title} (${state.countForTab(tab)})')
            .toList(growable: false);
        final filteredOrders = state.filteredOrders;

        return Scaffold(
          backgroundColor: AppColors.background,
          body: RefreshIndicator(
            onRefresh: () => _onRefresh(context),
            color: AppColors.softOrange,
            child: SafeArea(
              bottom: false,
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverToBoxAdapter(
                    child: AppOrdersHomeHeader(
                      shopName: state.customerName,
                      shopSubtitle: _buildSubtitle(state),
                      tabs: tabs,
                      selectedTabIndex: state.selectedTab.index,
                      onTabSelected: (index) {
                        context.read<CustomerOrdersBloc>().add(
                          CustomerOrdersTabChanged(kOrdersHomeTabs[index]),
                        );
                      },
                      todayOrdersCount: state.totalOrdersCount,
                      todayOrdersLabel: "Total Orders",
                      todayRevenueText: _formatCompactAmount(
                        state.totalRevenue,
                      ),
                      revenueLabel: "Total Spent",
                      revenueSubtitle: "Total MMK",
                      pendingCount: state.countForTab(OrdersHomeTab.pending),
                      showSummaryCards: true,
                      showPendingAlert:
                          state.selectedTab == OrdersHomeTab.pending &&
                          state.countForTab(OrdersHomeTab.pending) > 0,
                      pendingAlertTitle:
                          '${state.countForTab(OrdersHomeTab.pending)} orders need attention',
                      pendingAlertMessage:
                          'These orders are linked to this customer.',
                      leading: AppIconButton(
                        icon: const Icon(Icons.arrow_back_ios_new_rounded),
                        onPressed: () => Navigator.of(context).maybePop(),
                      ),
                      showTrailingActions: false,
                    ),
                  ),
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                    sliver: SliverToBoxAdapter(
                      child: AppSearchBar(
                        controller: _searchController,
                        hintText: 'Search this customer\'s orders...',
                        filterLabel: '${filteredOrders.length} orders',
                      ),
                    ),
                  ),
                  ..._buildContentSlivers(state, filteredOrders),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  List<Widget> _buildContentSlivers(
    CustomerOrdersState state,
    List<OrderListItem> filteredOrders,
  ) {
    if (state.status == CustomerOrdersStatus.loading && !state.hasOrders) {
      return const <Widget>[
        SliverFillRemaining(
          hasScrollBody: false,
          child: Center(child: CircularProgressIndicator()),
        ),
      ];
    }

    if (state.status == CustomerOrdersStatus.error && !state.hasOrders) {
      return <Widget>[
        SliverFillRemaining(
          hasScrollBody: false,
          child: AppEmptyState(
            icon: const Icon(Icons.receipt_long_outlined),
            title: 'Unable to load orders',
            message: state.errorMessage ?? 'Unable to load customer orders.',
          ),
        ),
      ];
    }

    if (filteredOrders.isEmpty) {
      return <Widget>[
        SliverFillRemaining(
          hasScrollBody: false,
          child: AppEmptyState(
            icon: const Icon(Icons.receipt_long_outlined),
            title: _searchController.text.trim().isEmpty
                ? 'No customer orders yet'
                : 'No matching orders',
            message: _searchController.text.trim().isEmpty
                ? 'Orders linked to this customer will appear here.'
                : 'Try another keyword or clear search.',
          ),
        ),
      ];
    }

    final sections = _buildSections(filteredOrders, state.selectedTab);
    final children = <Widget>[];

    for (final section in sections) {
      children.add(AppOrdersSectionLabel(title: section.title));
      for (final order in section.orders) {
        children.add(
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: AppOrderCard(
              customerName: order.customerName,
              orderId: '#${order.orderNo}',
              productName: order.primaryProductSummary,
              price: NumberFormat.decimalPattern().format(order.totalPrice),
              status: _toStatusVariant(order.status),
              phone: order.customerPhone,
              township: order.customerTownship,
              time: _formatCardTime(order.createdAt),
              productIconWidget: Icon(
                _productIcon(order.primaryProductSummary),
              ),
              onTap: () => context.push(
                AppRoutePaths.orderDetails.replaceFirst(':id', order.id),
              ),
            ),
          ),
        );
      }
    }

    children.add(const SizedBox(height: 90));

    return <Widget>[
      SliverPadding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
        sliver: SliverList(delegate: SliverChildListDelegate(children)),
      ),
    ];
  }

  Future<void> _onRefresh(BuildContext context) async {
    context.read<CustomerOrdersBloc>().add(
      const CustomerOrdersRefreshRequested(),
    );
    await Future<void>.delayed(const Duration(milliseconds: 800));
  }

  void _onSearchChanged() {
    context.read<CustomerOrdersBloc>().add(
      CustomerOrdersSearchChanged(_searchController.text),
    );
  }

  String _buildSubtitle(CustomerOrdersState state) {
    final phone = state.customerPhone.trim();
    final count = state.orders.length;
    final countLabel = '$count ${count == 1 ? 'order' : 'orders'}';

    if (phone.isEmpty) {
      return countLabel;
    }

    return '$phone · $countLabel';
  }

  List<_OrderSection> _buildSections(
    List<OrderListItem> orders,
    OrdersHomeTab selectedTab,
  ) {
    if (orders.isEmpty) {
      return const <_OrderSection>[];
    }

    final sorted = <OrderListItem>[...orders]
      ..sort((left, right) => right.createdAt.compareTo(left.createdAt));

    if (selectedTab == OrdersHomeTab.pending) {
      final needsConfirmation = sorted
          .where((order) => order.status == OrderStatus.newOrder)
          .toList(growable: false);
      final readyToShip = sorted
          .where(
            (order) =>
                order.status == OrderStatus.confirmed ||
                order.status == OrderStatus.outForDelivery,
          )
          .toList(growable: false);

      return <_OrderSection>[
        if (needsConfirmation.isNotEmpty)
          _OrderSection(title: 'Needs Confirmation', orders: needsConfirmation),
        if (readyToShip.isNotEmpty)
          _OrderSection(title: 'Ready to Ship', orders: readyToShip),
      ];
    }

    final grouped = <DateTime, List<OrderListItem>>{};
    for (final order in sorted) {
      final day = DateTime(
        order.createdAt.year,
        order.createdAt.month,
        order.createdAt.day,
      );
      grouped.putIfAbsent(day, () => <OrderListItem>[]).add(order);
    }

    final dayKeys = grouped.keys.toList(growable: false)
      ..sort((left, right) => right.compareTo(left));

    return dayKeys
        .map(
          (day) => _OrderSection(
            title: _formatDaySectionLabel(day),
            orders: grouped[day]!,
          ),
        )
        .toList(growable: false);
  }

  String _formatDaySectionLabel(DateTime day) {
    final now = DateTime.now();
    final yesterday = now.subtract(const Duration(days: 1));

    if (_isSameDay(day, now)) {
      return 'Today — ${DateFormat('MMMM d').format(day)}';
    }

    if (_isSameDay(day, yesterday)) {
      return 'Yesterday — ${DateFormat('MMMM d').format(day)}';
    }

    return DateFormat('MMMM d').format(day);
  }

  String _formatCardTime(DateTime createdAt) {
    final now = DateTime.now();
    final yesterday = now.subtract(const Duration(days: 1));

    if (_isSameDay(createdAt, now)) {
      return DateFormat('h:mm a').format(createdAt);
    }

    if (_isSameDay(createdAt, yesterday)) {
      return 'Yesterday · ${DateFormat('h:mm a').format(createdAt)}';
    }

    return DateFormat('MMM d, h:mm a').format(createdAt);
  }

  String _formatCompactAmount(int amount) {
    if (amount.abs() >= 1000) {
      final compact = amount / 1000;
      final hasFraction = compact.truncateToDouble() != compact;
      return '${compact.toStringAsFixed(hasFraction ? 1 : 0)}K';
    }

    return NumberFormat.decimalPattern().format(amount);
  }

  bool _isSameDay(DateTime left, DateTime right) {
    return left.year == right.year &&
        left.month == right.month &&
        left.day == right.day;
  }

  IconData _productIcon(String summary) {
    final normalized = summary.toLowerCase();
    if (normalized.contains('dress') ||
        normalized.contains('shirt') ||
        normalized.contains('longyi')) {
      return Icons.checkroom_outlined;
    }

    if (normalized.contains('bag')) {
      return Icons.shopping_bag_outlined;
    }

    return Icons.inventory_2_outlined;
  }

  AppStatusVariant _toStatusVariant(OrderStatus status) {
    return switch (status) {
      OrderStatus.newOrder => AppStatusVariant.newOrder,
      OrderStatus.confirmed => AppStatusVariant.confirmed,
      OrderStatus.outForDelivery => AppStatusVariant.shipping,
      OrderStatus.delivered => AppStatusVariant.delivered,
      OrderStatus.cancelled => AppStatusVariant.cancelled,
    };
  }
}

class _OrderSection {
  const _OrderSection({required this.title, required this.orders});

  final String title;
  final List<OrderListItem> orders;
}
