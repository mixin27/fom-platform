import 'package:app_core/app_core.dart';
import 'package:app_network/app_network.dart';
import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:fom_mobile/app/di/injection_container.dart';
import 'package:fom_mobile/app/router/app_route_paths.dart';
import 'package:fom_mobile/features/orders/data/models/order_list_item_model.dart';
import 'package:fom_mobile/features/orders/domain/entities/order_list_item.dart';
import 'package:fom_mobile/features/orders/domain/entities/order_status.dart';
import 'package:fom_mobile/features/orders/presentation/models/orders_home_tab.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

class CustomerOrdersPage extends StatefulWidget {
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
  State<CustomerOrdersPage> createState() => _CustomerOrdersPageState();
}

class _CustomerOrdersPageState extends State<CustomerOrdersPage> {
  late final TextEditingController _searchController;

  List<OrderListItem> _orders = const <OrderListItem>[];
  OrdersHomeTab _selectedTab = OrdersHomeTab.all;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController()..addListener(_onSearchChanged);
    _fetchOrders();
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
    final tabs = kOrdersHomeTabs
        .map((tab) => '${tab.title} (${_countForTab(tab)})')
        .toList(growable: false);
    final filteredOrders = _filteredOrders;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        onRefresh: _fetchOrders,
        color: AppColors.softOrange,
        child: SafeArea(
          bottom: false,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: AppOrdersHomeHeader(
                  shopName: widget.customerName.trim().isEmpty
                      ? 'Customer'
                      : widget.customerName,
                  shopSubtitle: _buildSubtitle(),
                  tabs: tabs,
                  selectedTabIndex: _selectedTab.index,
                  onTabSelected: (index) {
                    setState(() {
                      _selectedTab = kOrdersHomeTabs[index];
                    });
                  },
                  todayOrdersCount: _countForTab(OrdersHomeTab.today),
                  todayRevenueText: _formatCompactAmount(_todayRevenue),
                  pendingCount: _countForTab(OrdersHomeTab.pending),
                  showSummaryCards: true,
                  showPendingAlert:
                      _selectedTab == OrdersHomeTab.pending &&
                      _countForTab(OrdersHomeTab.pending) > 0,
                  pendingAlertTitle:
                      '${_countForTab(OrdersHomeTab.pending)} orders need attention',
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
              ..._buildContentSlivers(filteredOrders),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _buildContentSlivers(List<OrderListItem> filteredOrders) {
    if (_isLoading && _orders.isEmpty) {
      return const <Widget>[
        SliverFillRemaining(
          hasScrollBody: false,
          child: Center(child: CircularProgressIndicator()),
        ),
      ];
    }

    if (_errorMessage != null && _orders.isEmpty) {
      return <Widget>[
        SliverFillRemaining(
          hasScrollBody: false,
          child: AppEmptyState(
            icon: const Icon(Icons.receipt_long_outlined),
            title: 'Unable to load orders',
            message: _errorMessage!,
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

    final sections = _buildSections(filteredOrders);
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

  Future<void> _fetchOrders() async {
    final normalizedShopId = widget.shopId.trim();
    final normalizedCustomerId = widget.customerId.trim();

    if (normalizedShopId.isEmpty || normalizedCustomerId.isEmpty) {
      if (!mounted) {
        return;
      }

      setState(() {
        _orders = const <OrderListItem>[];
        _isLoading = false;
        _errorMessage = 'Customer orders are unavailable right now.';
      });
      return;
    }

    if (mounted) {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
    }

    try {
      final payload = await getIt<ApiClient>().getList(
        '/shops/$normalizedShopId/orders',
        queryParameters: <String, dynamic>{
          'customer_id': normalizedCustomerId,
          'limit': 200,
        },
      );
      final orders = payload
          .map(OrderListItemModel.fromJson)
          .where((order) => order.id.isNotEmpty)
          .toList(growable: false);

      if (!mounted) {
        return;
      }

      setState(() {
        _orders = orders;
        _isLoading = false;
        _errorMessage = null;
      });
    } on AppException catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _isLoading = false;
        _errorMessage = error.message;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }

      setState(() {
        _isLoading = false;
        _errorMessage = 'Unable to load orders right now.';
      });
    }
  }

  void _onSearchChanged() {
    if (!mounted) {
      return;
    }

    setState(() {});
  }

  List<OrderListItem> get _filteredOrders {
    final query = _searchController.text.trim().toLowerCase();

    return _orders
        .where((order) {
          if (!_matchesTab(order, _selectedTab)) {
            return false;
          }

          if (query.isEmpty) {
            return true;
          }

          final searchValues = <String>[
            order.orderNo,
            order.customerName,
            order.customerPhone,
            order.customerTownship ?? '',
            order.customerAddress ?? '',
            order.primaryProductSummary,
            ...order.items.map((item) => item.productName),
          ];

          return searchValues.any(
            (value) => value.toLowerCase().contains(query),
          );
        })
        .toList(growable: false);
  }

  int _countForTab(OrdersHomeTab tab) {
    final now = DateTime.now();

    switch (tab) {
      case OrdersHomeTab.all:
        return _orders.length;
      case OrdersHomeTab.today:
        return _orders
            .where((order) => _isSameDay(order.createdAt, now))
            .length;
      case OrdersHomeTab.pending:
        return _orders.where((order) => order.status.isPending).length;
      case OrdersHomeTab.delivered:
        return _orders
            .where((order) => order.status == OrderStatus.delivered)
            .length;
    }
  }

  int get _todayRevenue {
    final now = DateTime.now();
    return _orders
        .where((order) => _isSameDay(order.createdAt, now))
        .fold<int>(0, (sum, order) => sum + order.totalPrice);
  }

  String _buildSubtitle() {
    final phone = widget.customerPhone.trim();
    final count = _orders.length;
    final countLabel = '$count ${count == 1 ? 'order' : 'orders'}';

    if (phone.isEmpty) {
      return countLabel;
    }

    return '$phone · $countLabel';
  }

  List<_OrderSection> _buildSections(List<OrderListItem> orders) {
    if (orders.isEmpty) {
      return const <_OrderSection>[];
    }

    final sorted = <OrderListItem>[...orders]
      ..sort((left, right) => right.createdAt.compareTo(left.createdAt));

    if (_selectedTab == OrdersHomeTab.pending) {
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

  bool _matchesTab(OrderListItem order, OrdersHomeTab tab) {
    final now = DateTime.now();

    switch (tab) {
      case OrdersHomeTab.all:
        return true;
      case OrdersHomeTab.today:
        return _isSameDay(order.createdAt, now);
      case OrdersHomeTab.pending:
        return order.status.isPending;
      case OrdersHomeTab.delivered:
        return order.status == OrderStatus.delivered;
    }
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
