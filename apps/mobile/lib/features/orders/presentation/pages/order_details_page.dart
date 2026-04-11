import "package:app_ui_kit/app_ui_kit.dart";
import "package:flutter/material.dart";
import "package:flutter_bloc/flutter_bloc.dart";
import "package:fom_mobile/app/di/injection_container.dart";
import "package:intl/intl.dart";

import "../../domain/entities/order_source.dart";
import "../../domain/entities/order_status.dart";
import "../bloc/order_details_bloc.dart";
import "../bloc/order_details_event.dart";
import "../bloc/order_details_state.dart";
import "../widgets/order_details_widgets.dart";
import "../widgets/update_status_bottom_sheet.dart";

class OrderDetailsPage extends StatelessWidget {
  const OrderDetailsPage({
    required this.orderId,
    required this.initialShopId,
    super.key,
  });

  final String orderId;
  final String initialShopId;

  @override
  Widget build(BuildContext context) {
    return BlocProvider<OrderDetailsBloc>(
      create: (_) =>
          getIt<OrderDetailsBloc>()
            ..add(OrderDetailsStarted(shopId: initialShopId, orderId: orderId)),
      child: const _OrderDetailsView(),
    );
  }
}

class _OrderDetailsView extends StatelessWidget {
  const _OrderDetailsView();

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<OrderDetailsBloc, OrderDetailsState>(
      listenWhen: (previous, current) {
        return previous.errorMessage != current.errorMessage &&
            (current.errorMessage ?? "").trim().isNotEmpty;
      },
      listener: (context, state) {
        final message = state.errorMessage;
        if ((message ?? "").trim().isEmpty) {
          return;
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message!),
            behavior: SnackBarBehavior.floating,
          ),
        );
        context.read<OrderDetailsBloc>().add(
          const OrderDetailsErrorDismissed(),
        );
      },
      builder: (context, state) {
        final order = state.effectiveOrder;
        final currentStatus = state.currentStatus;

        if (state.isLoadingInitial) {
          return const Scaffold(
            backgroundColor: AppColors.background,
            body: SafeArea(
              child: Center(
                child: CircularProgressIndicator(color: AppColors.softOrange),
              ),
            ),
          );
        }

        if (order == null || currentStatus == null) {
          return Scaffold(
            backgroundColor: AppColors.background,
            appBar: AppBar(
              backgroundColor: AppColors.warmWhite,
              elevation: 0,
              leadingWidth: 70,
              leading: Center(
                child: AppIconButton(
                  icon: const Icon(Icons.arrow_back_rounded),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ),
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(1.5),
                child: Container(color: AppColors.border, height: 1.5),
              ),
            ),
            body: Center(
              child: AppEmptyState(
                icon: const Icon(Icons.receipt_long_outlined),
                title: "Order not found",
                message: "Unable to load this order details.",
                action: AppButton(
                  text: "Retry",
                  onPressed: () => context.read<OrderDetailsBloc>().add(
                    const OrderDetailsRefreshRequested(),
                  ),
                ),
              ),
            ),
          );
        }

        final details = state.orderDetails;
        final createdAtText = DateFormat(
          "MMM d, h:mm a",
        ).format(order.createdAt);
        final currentStep = _stepForStatus(currentStatus);
        final primaryAction = _primaryActionForStatus(currentStatus);

        return Scaffold(
          backgroundColor: AppColors.background,
          appBar: AppBar(
            backgroundColor: AppColors.warmWhite,
            elevation: 0,
            leadingWidth: 70,
            leading: Center(
              child: AppIconButton(
                icon: const Icon(Icons.arrow_back_rounded),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Order Detail",
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppColors.textDark,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                Text(
                  "${order.orderNo} · $createdAtText",
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: AppColors.textLight,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            actions: [
              Padding(
                padding: const EdgeInsets.only(right: AppSpacing.md),
                child: AppIconButton(
                  icon: const Icon(Icons.refresh_rounded),
                  onPressed: state.isRefreshing
                      ? null
                      : () => context.read<OrderDetailsBloc>().add(
                          const OrderDetailsRefreshRequested(),
                        ),
                ),
              ),
            ],
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(1.5),
              child: Container(color: AppColors.border, height: 1.5),
            ),
          ),
          body: RefreshIndicator(
            onRefresh: () async {
              context.read<OrderDetailsBloc>().add(
                const OrderDetailsRefreshRequested(),
              );
            },
            color: AppColors.softOrange,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
              children: [
                OrderDetailsStatusHero(
                  status: currentStatus,
                  currentStep: currentStep,
                ),
                if (currentStatus == OrderStatus.outForDelivery) ...[
                  const SizedBox(height: AppSpacing.md),
                  OrderDetailsShippingBanner(
                    isLoading: state.isUpdatingStatus,
                    onMarkDelivered: () => context.read<OrderDetailsBloc>().add(
                      const OrderDetailsStatusChangeRequested(
                        nextStatus: OrderStatus.delivered,
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: AppSpacing.md),
                const AppSectionHeader(
                  icon: Icon(Icons.refresh_rounded),
                  title: "Update Status",
                  subtitle: "အခြေအနေ ပြောင်းမည်",
                ),
                const SizedBox(height: AppSpacing.sm),
                StatusUpdateGrid(
                  currentStatus: currentStatus,
                  onUpdate: (nextStatus) => _onRequestStatusChange(
                    context,
                    currentStatus: currentStatus,
                    requestedStatus: nextStatus,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                CustomerInfoCard(
                  order: order,
                  onCallTap: () => _showComingSoon(context, "Call"),
                  onMessageTap: () => _showComingSoon(context, "Message"),
                  onMapTap: () => _showComingSoon(context, "Map"),
                ),
                const SizedBox(height: AppSpacing.md),
                ProductPaymentCard(order: order, details: details),
                const SizedBox(height: AppSpacing.md),
                ActivityLogCard(
                  history: details?.statusHistory ?? const [],
                  createdAt: order.createdAt,
                  currentStatus: currentStatus,
                  source: details?.source ?? OrderSource.manual,
                ),
              ],
            ),
          ),
          bottomNavigationBar: OrderDetailsBottomBar(
            secondaryLabel: "Update Status",
            onSecondaryPressed: () =>
                _openStatusSheet(context, currentStatus: currentStatus),
            primaryLabel: primaryAction.label,
            primaryEnabled: primaryAction.nextStatus != null,
            onPrimaryPressed: () {
              final nextStatus = primaryAction.nextStatus;
              if (nextStatus == null) {
                return;
              }

              context.read<OrderDetailsBloc>().add(
                OrderDetailsStatusChangeRequested(nextStatus: nextStatus),
              );
            },
            isPrimaryLoading: state.isUpdatingStatus,
          ),
        );
      },
    );
  }

  Future<void> _openStatusSheet(
    BuildContext context, {
    required OrderStatus currentStatus,
  }) async {
    final selection = await UpdateStatusBottomSheet.show(
      context,
      initialStatus: currentStatus,
      allowedStatuses: _allowedStatusesForSheet(currentStatus),
    );

    if (!context.mounted || selection == null) {
      return;
    }

    if (selection.status == currentStatus &&
        (selection.note ?? "").trim().isEmpty) {
      return;
    }

    if (!_isTransitionAllowed(currentStatus, selection.status)) {
      _showInvalidTransition(context);
      return;
    }

    context.read<OrderDetailsBloc>().add(
      OrderDetailsStatusChangeRequested(
        nextStatus: selection.status,
        note: selection.note,
      ),
    );
  }

  void _onRequestStatusChange(
    BuildContext context, {
    required OrderStatus currentStatus,
    required OrderStatus requestedStatus,
  }) {
    if (requestedStatus == currentStatus) {
      return;
    }

    if (!_isTransitionAllowed(currentStatus, requestedStatus)) {
      _showInvalidTransition(context);
      return;
    }

    context.read<OrderDetailsBloc>().add(
      OrderDetailsStatusChangeRequested(nextStatus: requestedStatus),
    );
  }

  void _showInvalidTransition(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text("This status change is not allowed."),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showComingSoon(BuildContext context, String actionName) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text("$actionName integration will be added soon."),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}

class _PrimaryAction {
  const _PrimaryAction({required this.label, required this.nextStatus});

  final String label;
  final OrderStatus? nextStatus;
}

_PrimaryAction _primaryActionForStatus(OrderStatus status) {
  switch (status) {
    case OrderStatus.newOrder:
      return const _PrimaryAction(
        label: "Confirm Order",
        nextStatus: OrderStatus.confirmed,
      );
    case OrderStatus.confirmed:
      return const _PrimaryAction(
        label: "Out for Delivery",
        nextStatus: OrderStatus.outForDelivery,
      );
    case OrderStatus.outForDelivery:
      return const _PrimaryAction(
        label: "Mark Delivered",
        nextStatus: OrderStatus.delivered,
      );
    case OrderStatus.delivered:
      return const _PrimaryAction(label: "Delivered", nextStatus: null);
    case OrderStatus.cancelled:
      return const _PrimaryAction(label: "Cancelled", nextStatus: null);
  }
}

int _stepForStatus(OrderStatus status) {
  switch (status) {
    case OrderStatus.newOrder:
      return 1;
    case OrderStatus.confirmed:
      return 2;
    case OrderStatus.outForDelivery:
      return 3;
    case OrderStatus.delivered:
      return 4;
    case OrderStatus.cancelled:
      return 1;
  }
}

List<OrderStatus> _allowedStatusesForSheet(OrderStatus currentStatus) {
  final ordered = const <OrderStatus>[
    OrderStatus.newOrder,
    OrderStatus.confirmed,
    OrderStatus.outForDelivery,
    OrderStatus.delivered,
    OrderStatus.cancelled,
  ];

  return ordered
      .where(
        (candidate) =>
            candidate == currentStatus ||
            _isTransitionAllowed(currentStatus, candidate),
      )
      .toList(growable: false);
}

bool _isTransitionAllowed(OrderStatus current, OrderStatus next) {
  if (current == next) {
    return true;
  }

  if (current == OrderStatus.delivered || current == OrderStatus.cancelled) {
    return false;
  }

  if (next == OrderStatus.cancelled) {
    return true;
  }

  const rank = <OrderStatus, int>{
    OrderStatus.newOrder: 0,
    OrderStatus.confirmed: 1,
    OrderStatus.outForDelivery: 2,
    OrderStatus.delivered: 3,
    OrderStatus.cancelled: 4,
  };

  return (rank[next] ?? -1) >= (rank[current] ?? -1);
}
