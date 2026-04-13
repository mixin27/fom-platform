import 'package:app_logger/app_logger.dart';
import 'package:app_network/app_network.dart';
import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fom_mobile/app/di/injection_container.dart';
import 'package:fom_mobile/app/router/app_route_paths.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../domain/entities/order_list_item.dart';
import '../../domain/entities/order_status.dart';
import '../../domain/usecases/refresh_orders_use_case.dart';
import '../../domain/usecases/update_order_status_use_case.dart';
import '../../domain/usecases/watch_orders_use_case.dart';
import '../bloc/orders_home_bloc.dart';
import '../bloc/orders_home_event.dart';
import '../bloc/orders_home_state.dart';
import '../models/orders_home_tab.dart';

class OrdersHomePage extends StatelessWidget {
  const OrdersHomePage({
    super.key,
    required this.initialShopId,
    required this.initialShopName,
    this.initialSearchQuery = '',
    this.headerTitle,
    this.headerSubtitle,
    this.showBackButton = false,
    this.showHeaderActions = true,
    this.showCreateOrderAction = true,
    this.useSharedBloc = true,
  });

  final String initialShopId;
  final String initialShopName;
  final String initialSearchQuery;
  final String? headerTitle;
  final String? headerSubtitle;
  final bool showBackButton;
  final bool showHeaderActions;
  final bool showCreateOrderAction;
  final bool useSharedBloc;

  @override
  Widget build(BuildContext context) {
    if (useSharedBloc) {
      return BlocProvider<OrdersHomeBloc>.value(
        value: getIt<OrdersHomeBloc>(),
        child: _OrdersHomeView(
          initialShopId: initialShopId,
          initialShopName: initialShopName,
          initialSearchQuery: initialSearchQuery,
          headerTitle: headerTitle,
          headerSubtitle: headerSubtitle,
          showBackButton: showBackButton,
          showHeaderActions: showHeaderActions,
          showCreateOrderAction: showCreateOrderAction,
        ),
      );
    }

    return BlocProvider<OrdersHomeBloc>(
      create: (_) => OrdersHomeBloc(
        watchOrdersUseCase: getIt<WatchOrdersUseCase>(),
        refreshOrdersUseCase: getIt<RefreshOrdersUseCase>(),
        updateOrderStatusUseCase: getIt<UpdateOrderStatusUseCase>(),
        networkConnectionService: getIt<NetworkConnectionService>(),
        logger: getIt<AppLogger>(),
      ),
      child: _OrdersHomeView(
        initialShopId: initialShopId,
        initialShopName: initialShopName,
        initialSearchQuery: initialSearchQuery,
        headerTitle: headerTitle,
        headerSubtitle: headerSubtitle,
        showBackButton: showBackButton,
        showHeaderActions: showHeaderActions,
        showCreateOrderAction: showCreateOrderAction,
      ),
    );
  }
}

class _OrdersHomeView extends StatefulWidget {
  const _OrdersHomeView({
    required this.initialShopId,
    required this.initialShopName,
    required this.initialSearchQuery,
    required this.headerTitle,
    required this.headerSubtitle,
    required this.showBackButton,
    required this.showHeaderActions,
    required this.showCreateOrderAction,
  });

  final String initialShopId;
  final String initialShopName;
  final String initialSearchQuery;
  final String? headerTitle;
  final String? headerSubtitle;
  final bool showBackButton;
  final bool showHeaderActions;
  final bool showCreateOrderAction;

  @override
  State<_OrdersHomeView> createState() => _OrdersHomeViewState();
}

class _OrdersHomeViewState extends State<_OrdersHomeView> {
  late final TextEditingController _searchController;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController(text: widget.initialSearchQuery);
    _searchController.addListener(_onSearchChanged);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrdersHomeBloc>().add(
        OrdersHomeStarted(
          shopId: widget.initialShopId,
          shopName: widget.initialShopName,
        ),
      );
      if (widget.initialSearchQuery.trim().isNotEmpty) {
        context.read<OrdersHomeBloc>().add(
          OrdersHomeSearchChanged(widget.initialSearchQuery),
        );
      }
    });
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
    return BlocConsumer<OrdersHomeBloc, OrdersHomeState>(
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
        context.read<OrdersHomeBloc>().add(const OrdersHomeErrorDismissed());
      },
      builder: (context, state) {
        final tabs = kOrdersHomeTabs
            .map((tab) => '${tab.title} (${state.countForTab(tab)})')
            .toList(growable: false);

        return Scaffold(
          backgroundColor: AppColors.background,
          floatingActionButton: widget.showCreateOrderAction
              ? AppFAB(
                  onPressed: () => context.push(AppRoutePaths.addOrder),
                  icon: const Icon(Icons.add_rounded),
                )
              : null,
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
                      shopName: widget.headerTitle ?? state.shopName,
                      shopSubtitle:
                          widget.headerSubtitle ??
                          (state.selectedTab == OrdersHomeTab.pending
                              ? '${state.pendingOrdersCount} orders need action'
                              : '${state.todayOrdersCount} orders today'),
                      tabs: tabs,
                      selectedTabIndex: state.selectedTab.index,
                      onTabSelected: (index) {
                        final tab = kOrdersHomeTabs[index];
                        context.read<OrdersHomeBloc>().add(
                          OrdersHomeTabChanged(tab),
                        );
                      },
                      todayOrdersCount: state.todayOrdersCount,
                      todayRevenueText: _formatCompactAmount(
                        state.todayRevenue,
                      ),
                      pendingCount: state.pendingOrdersCount,
                      showSummaryCards:
                          state.selectedTab != OrdersHomeTab.pending,
                      showPendingAlert:
                          state.selectedTab == OrdersHomeTab.pending &&
                          state.pendingOrdersCount > 0,
                      pendingAlertTitle:
                          '${state.pendingOrdersCount} orders need your attention',
                      pendingAlertMessage: 'Confirm or update status now',
                      onNotificationPressed: () =>
                          context.push(AppRoutePaths.notifications),
                      onMorePressed: widget.showHeaderActions ? () {} : null,
                      hasUnreadNotifications: widget.showHeaderActions,
                      leading: widget.showBackButton
                          ? AppIconButton(
                              icon: const Icon(
                                Icons.arrow_back_ios_new_rounded,
                              ),
                              onPressed: () => Navigator.of(context).maybePop(),
                            )
                          : null,
                      showTrailingActions: widget.showHeaderActions,
                    ),
                  ),
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                    sliver: SliverToBoxAdapter(
                      child: AppSearchBar(
                        controller: _searchController,
                        hintText: widget.initialSearchQuery.trim().isNotEmpty
                            ? 'Search this customer\'s orders...'
                            : state.selectedTab == OrdersHomeTab.pending
                            ? 'Search pending orders...'
                            : 'Search orders, customers...',
                        filterLabel: widget.initialSearchQuery.trim().isNotEmpty
                            ? '${state.filteredOrders.length} orders'
                            : state.selectedTab == OrdersHomeTab.pending
                            ? '${state.filteredOrders.length} results'
                            : 'Filter',
                      ),
                    ),
                  ),
                  ..._buildOrdersSlivers(state),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  List<Widget> _buildOrdersSlivers(OrdersHomeState state) {
    if (state.status == OrdersHomeStatus.loading && !state.hasOrders) {
      return const [
        SliverFillRemaining(
          hasScrollBody: false,
          child: Center(child: CircularProgressIndicator()),
        ),
      ];
    }

    final sections = _buildSections(state.filteredOrders, state.selectedTab);

    if (sections.isEmpty) {
      return [
        SliverFillRemaining(
          hasScrollBody: false,
          child: AppEmptyState(
            icon: const Icon(Icons.receipt_long_outlined),
            title: state.searchQuery.trim().isEmpty
                ? 'No orders yet'
                : 'No matching orders',
            message: state.searchQuery.trim().isEmpty
                ? 'New orders will appear here when synced from server.'
                : 'Try a different keyword or clear search.',
          ),
        ),
      ];
    }

    final children = <Widget>[];
    for (final section in sections) {
      children.add(AppOrdersSectionLabel(title: section.title));
      for (final order in section.orders) {
        children.add(
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _OrderListCard(
              order: order,
              isUpdating: state.isOrderUpdating(order.id),
              onTap: () => context.push(
                AppRoutePaths.orderDetails.replaceFirst(':id', order.id),
              ),
              onStatusChange: (nextStatus) {
                context.read<OrdersHomeBloc>().add(
                  OrdersHomeOrderStatusChangeRequested(
                    orderId: order.id,
                    nextStatus: nextStatus,
                  ),
                );
              },
            ),
          ),
        );
      }
    }

    children.add(const SizedBox(height: 90));

    return [
      SliverPadding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
        sliver: SliverList(delegate: SliverChildListDelegate(children)),
      ),
    ];
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

  Future<void> _onRefresh(BuildContext context) async {
    context.read<OrdersHomeBloc>().add(const OrdersHomeRefreshRequested());
    await Future<void>.delayed(const Duration(milliseconds: 800));
  }

  void _onSearchChanged() {
    context.read<OrdersHomeBloc>().add(
      OrdersHomeSearchChanged(_searchController.text),
    );
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
}

class _OrderSection {
  const _OrderSection({required this.title, required this.orders});

  final String title;
  final List<OrderListItem> orders;
}

class _OrderListCard extends StatelessWidget {
  const _OrderListCard({
    required this.order,
    required this.isUpdating,
    required this.onTap,
    required this.onStatusChange,
  });

  final OrderListItem order;
  final bool isUpdating;
  final VoidCallback onTap;
  final ValueChanged<OrderStatus> onStatusChange;

  @override
  Widget build(BuildContext context) {
    final actions = _actionsForStatus(order.status);

    return AppOrderCard(
      customerName: order.customerName,
      orderId: '#${order.orderNo}',
      productName: order.primaryProductSummary,
      price: NumberFormat.decimalPattern().format(order.totalPrice),
      status: _toStatusVariant(order.status),
      phone: order.customerPhone,
      township: order.customerTownship,
      time: _formatCardTime(order.createdAt),
      productIconWidget: Icon(_productIcon(order.primaryProductSummary)),
      onTap: onTap,
      isActionLoading: isUpdating,
      onPrimaryAction: actions.primaryStatus == null
          ? null
          : () => onStatusChange(actions.primaryStatus!),
      primaryActionLabel: actions.primaryLabel,
      primaryActionIcon: actions.primaryIcon,
      onSecondaryAction: actions.secondaryStatus == null
          ? null
          : () => onStatusChange(actions.secondaryStatus!),
      secondaryActionLabel: actions.secondaryLabel,
      secondaryActionIcon: actions.secondaryIcon,
    );
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

  _OrderCardActions _actionsForStatus(OrderStatus status) {
    switch (status) {
      case OrderStatus.newOrder:
        return const _OrderCardActions(
          primaryLabel: 'Confirm',
          primaryIcon: Icons.check_rounded,
          primaryStatus: OrderStatus.confirmed,
          secondaryLabel: 'Cancel',
          secondaryIcon: Icons.close_rounded,
          secondaryStatus: OrderStatus.cancelled,
        );
      case OrderStatus.confirmed:
        return const _OrderCardActions(
          primaryLabel: 'Send Out',
          primaryIcon: Icons.local_shipping_outlined,
          primaryStatus: OrderStatus.outForDelivery,
          secondaryLabel: 'Cancel',
          secondaryIcon: Icons.close_rounded,
          secondaryStatus: OrderStatus.cancelled,
        );
      case OrderStatus.outForDelivery:
        return const _OrderCardActions(
          primaryLabel: 'Delivered',
          primaryIcon: Icons.check_circle_outline_rounded,
          primaryStatus: OrderStatus.delivered,
          secondaryLabel: 'Cancel',
          secondaryIcon: Icons.close_rounded,
          secondaryStatus: OrderStatus.cancelled,
        );
      case OrderStatus.delivered:
      case OrderStatus.cancelled:
        return const _OrderCardActions();
    }
  }
}

class _OrderCardActions {
  const _OrderCardActions({
    this.primaryLabel,
    this.primaryIcon,
    this.primaryStatus,
    this.secondaryLabel,
    this.secondaryIcon,
    this.secondaryStatus,
  });

  final String? primaryLabel;
  final IconData? primaryIcon;
  final OrderStatus? primaryStatus;
  final String? secondaryLabel;
  final IconData? secondaryIcon;
  final OrderStatus? secondaryStatus;
}
