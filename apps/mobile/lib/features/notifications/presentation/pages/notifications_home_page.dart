import "package:app_ui_kit/app_ui_kit.dart";
import "package:flutter/material.dart";
import "package:flutter_bloc/flutter_bloc.dart";
import "package:fom_mobile/app/di/injection_container.dart";
import "package:fom_mobile/features/auth/feature_auth.dart";
import "package:fom_mobile/features/notifications/feature_notifications.dart";
import "package:go_router/go_router.dart";
import "package:intl/intl.dart";

class NotificationsHomePage extends StatelessWidget {
  const NotificationsHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<NotificationsHomeBloc>.value(
      value: getIt<NotificationsHomeBloc>(),
      child: const _NotificationsHomeView(),
    );
  }
}

class _NotificationsHomeView extends StatefulWidget {
  const _NotificationsHomeView();

  @override
  State<_NotificationsHomeView> createState() => _NotificationsHomeViewState();
}

class _NotificationsHomeViewState extends State<_NotificationsHomeView> {
  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authState = getIt<AuthBloc>().state;
      final activeShop = authState.activeShop;

      context.read<NotificationsHomeBloc>().add(
        NotificationsHomeStarted(
          shopId: activeShop?.shopId ?? "",
          shopName: activeShop?.shopName ?? "My Shop",
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<NotificationsHomeBloc, NotificationsHomeState>(
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
        context.read<NotificationsHomeBloc>().add(
          const NotificationsHomeErrorDismissed(),
        );
      },
      builder: (context, state) {
        return Scaffold(
          backgroundColor: AppColors.background,
          body: RefreshIndicator(
            onRefresh: () async {
              context.read<NotificationsHomeBloc>().add(
                const NotificationsHomeRefreshRequested(),
              );
            },
            color: AppColors.softOrange,
            child: SafeArea(
              bottom: false,
              child: Column(
                children: [
                  _buildHeader(context, state),
                  Expanded(child: _buildBody(context, state)),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildHeader(
    BuildContext context,
    NotificationsHomeState state,
  ) {
    final hasUnread = state.unreadCount > 0;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: const BoxDecoration(
        color: AppColors.warmWhite,
        border: Border(bottom: BorderSide(color: AppColors.border, width: 1.5)),
      ),
      child: Row(
        children: [
          AppIconButton(
            icon: const Icon(Icons.arrow_back_rounded),
            onPressed: () => context.pop(),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "Notifications",
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w900,
                    color: AppColors.textDark,
                  ),
                ),
                Text(
                  state.shopName,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textLight,
                  ),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: hasUnread && !state.isMarkingAllRead
                ? () {
                    context.read<NotificationsHomeBloc>().add(
                      const NotificationsHomeMarkAllRequested(),
                    );
                  }
                : null,
            child: AnimatedOpacity(
              duration: const Duration(milliseconds: 180),
              opacity: hasUnread ? 1 : 0.5,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                decoration: BoxDecoration(
                  color: AppColors.softOrangeLight,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  state.isMarkingAllRead ? "Saving..." : "Mark all read",
                  style: const TextStyle(
                    color: AppColors.softOrange,
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody(BuildContext context, NotificationsHomeState state) {
    if (state.status == NotificationsHomeStatus.loading && !state.hasNotifications) {
      return const Center(child: CircularProgressIndicator());
    }

    if (!state.hasShop && !state.hasNotifications) {
      return const AppEmptyState(
        icon: Icon(Icons.storefront_outlined),
        title: "Shop access is required",
        message: "Select a shop first to view notifications for that workspace.",
      );
    }

    if (!state.hasNotifications) {
      return const AppEmptyState(
        icon: Icon(Icons.notifications_none_rounded),
        title: "No notifications yet",
        message: "New order activity and summaries will appear here.",
      );
    }

    final sections = _buildSections(state.notifications);

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.only(left: 16, right: 16, top: 14, bottom: 90),
      children: sections
          .map(
            (section) => Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _SectionLabel(section.label),
                ...section.notifications.map(
                  (notification) => NotificationCard(
                    title: notification.title,
                    body: notification.body,
                    timeLabel: _formatTimeLabel(notification.createdAt),
                    icon: _iconFor(notification),
                    statusType: _statusTypeFor(notification),
                    isUnread: !notification.isRead,
                    onTap: () => _onNotificationTap(context, notification),
                  ),
                ),
              ],
            ),
          )
          .toList(growable: false),
    );
  }

  void _onNotificationTap(
    BuildContext context,
    InboxNotification notification,
  ) {
    if (!notification.isRead) {
      context.read<NotificationsHomeBloc>().add(
        NotificationsHomeNotificationReadRequested(
          notificationId: notification.id,
        ),
      );
    }

    final actionTarget = notification.actionTarget?.trim();
    if (actionTarget != null && actionTarget.isNotEmpty) {
      context.push(actionTarget);
    }
  }

  List<_NotificationSection> _buildSections(
    List<InboxNotification> notifications,
  ) {
    final grouped = <String, List<InboxNotification>>{};

    for (final notification in notifications) {
      final label = _sectionLabelFor(notification.createdAt);
      grouped.putIfAbsent(label, () => <InboxNotification>[]).add(notification);
    }

    const preferredOrder = <String>["Just Now", "Today", "Yesterday", "Earlier"];
    final orderedLabels = <String>[
      ...preferredOrder.where(grouped.containsKey),
      ...grouped.keys.where((key) => !preferredOrder.contains(key)),
    ];

    return orderedLabels
        .map(
          (label) => _NotificationSection(
            label: label,
            notifications: grouped[label] ?? const <InboxNotification>[],
          ),
        )
        .toList(growable: false);
  }

  String _sectionLabelFor(DateTime createdAt) {
    final now = DateTime.now();
    final localDate = createdAt.toLocal();
    final difference = now.difference(localDate);

    if (difference.inMinutes < 10) {
      return "Just Now";
    }

    if (_isSameDay(now, localDate)) {
      return "Today";
    }

    final yesterday = now.subtract(const Duration(days: 1));
    if (_isSameDay(yesterday, localDate)) {
      return "Yesterday";
    }

    return "Earlier";
  }

  String _formatTimeLabel(DateTime createdAt) {
    final now = DateTime.now();
    final localDate = createdAt.toLocal();
    final difference = now.difference(localDate);

    if (difference.inMinutes < 1) {
      return "Just now";
    }

    if (difference.inMinutes < 60) {
      return "${difference.inMinutes} min ago";
    }

    if (_isSameDay(now, localDate)) {
      return DateFormat("h:mm a").format(localDate);
    }

    final yesterday = now.subtract(const Duration(days: 1));
    if (_isSameDay(yesterday, localDate)) {
      return "Yesterday · ${DateFormat("h:mm a").format(localDate)}";
    }

    return DateFormat("MMM d, h:mm a").format(localDate);
  }

  Widget _iconFor(InboxNotification notification) {
    final category = notification.category;
    final title = notification.title.toLowerCase();

    if (category == "daily_summary") {
      return const Icon(Icons.bar_chart_rounded);
    }

    if (category == "billing_updates") {
      return const Icon(Icons.credit_card_rounded);
    }

    if (category == "promotional_tips") {
      return const Icon(Icons.campaign_rounded);
    }

    if (title.contains("delivered")) {
      return const Icon(Icons.task_alt_rounded);
    }

    if (title.contains("cancel")) {
      return const Icon(Icons.cancel_outlined);
    }

    if (title.contains("delivery")) {
      return const Icon(Icons.local_shipping_rounded);
    }

    return const Icon(Icons.receipt_long_rounded);
  }

  NotificationStatusType _statusTypeFor(InboxNotification notification) {
    final category = notification.category;
    final title = notification.title.toLowerCase();

    if (category == "daily_summary") {
      return NotificationStatusType.teal;
    }

    if (category == "billing_updates") {
      return NotificationStatusType.yellow;
    }

    if (category == "promotional_tips") {
      return NotificationStatusType.purple;
    }

    if (title.contains("delivered")) {
      return NotificationStatusType.green;
    }

    if (title.contains("cancel")) {
      return NotificationStatusType.red;
    }

    if (title.contains("delivery")) {
      return NotificationStatusType.orange;
    }

    return NotificationStatusType.orange;
  }

  bool _isSameDay(DateTime left, DateTime right) {
    return left.year == right.year &&
        left.month == right.month &&
        left.day == right.day;
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 2, right: 2, bottom: 8, top: 12),
      child: Text(
        label.toUpperCase(),
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w800,
          color: AppColors.textLight,
          letterSpacing: 1,
        ),
      ),
    );
  }
}

class _NotificationSection {
  const _NotificationSection({
    required this.label,
    required this.notifications,
  });

  final String label;
  final List<InboxNotification> notifications;
}
