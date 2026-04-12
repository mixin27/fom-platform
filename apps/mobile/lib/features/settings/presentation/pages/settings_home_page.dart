import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../../app/di/injection_container.dart';
import '../../../../app/router/app_route_paths.dart';
import '../../../auth/feature_auth.dart';
import '../../../notifications/feature_notifications.dart';
import '../../feature_settings.dart';

class SettingsHomePage extends StatefulWidget {
  const SettingsHomePage({super.key});

  @override
  State<SettingsHomePage> createState() => _SettingsHomePageState();
}

class _SettingsHomePageState extends State<SettingsHomePage> {
  @override
  void initState() {
    super.initState();
    getIt<NotificationPreferencesBloc>().add(
      const NotificationPreferencesStarted(),
    );
    _loadSettings();
  }

  void _loadSettings({bool forceRefresh = false}) {
    final shopId = getIt<AuthBloc>().state.activeShop?.shopId;
    if ((shopId ?? '').trim().isEmpty) {
      return;
    }

    getIt<SettingsBloc>().add(
      SettingsStarted(shopId: shopId!, forceRefresh: forceRefresh),
    );
  }

  Future<void> _navigateToEditProfile() async {
    await context.push(AppRoutePaths.editProfile);
    _loadSettings(forceRefresh: true);
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocListener(
      listeners: [
        BlocListener<AuthBloc, AuthState>(
          bloc: getIt<AuthBloc>(),
          listenWhen: (previous, current) {
            return previous.activeShopId != current.activeShopId;
          },
          listener: (context, state) => _loadSettings(forceRefresh: true),
        ),
        BlocListener<SettingsBloc, SettingsState>(
          bloc: getIt<SettingsBloc>(),
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
              SnackBar(
                content: Text(message),
                behavior: SnackBarBehavior.floating,
              ),
            );
            getIt<SettingsBloc>().add(const SettingsErrorDismissed());
          },
        ),
        BlocListener<NotificationPreferencesBloc, NotificationPreferencesState>(
          bloc: getIt<NotificationPreferencesBloc>(),
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
              SnackBar(
                content: Text(message),
                behavior: SnackBarBehavior.floating,
              ),
            );
            getIt<NotificationPreferencesBloc>().add(
              const NotificationPreferencesErrorDismissed(),
            );
          },
        ),
      ],
      child: BlocBuilder<AuthBloc, AuthState>(
        bloc: getIt<AuthBloc>(),
        builder: (context, authState) {
          final activeShop = authState.activeShop;
          if (activeShop == null) {
            return Scaffold(
              backgroundColor: AppColors.background,
              body: SafeArea(
                child: AppEmptyState(
                  icon: const Icon(Icons.storefront_outlined),
                  title: 'No active shop selected',
                  message:
                      'Choose a shop first to manage account, billing, and notification settings.',
                  action: AppButton(
                    text: 'Choose shop',
                    onPressed: () => context.push(
                      Uri(
                        path: AppRoutePaths.shopSelection,
                        queryParameters: <String, String>{
                          'from': AppRoutePaths.settings,
                        },
                      ).toString(),
                    ),
                  ),
                ),
              ),
            );
          }

          return BlocBuilder<SettingsBloc, SettingsState>(
            bloc: getIt<SettingsBloc>(),
            builder: (context, settingsState) {
              final snapshot = settingsState.snapshot;

              return Scaffold(
                backgroundColor: AppColors.background,
                body: RefreshIndicator(
                  color: AppColors.softOrange,
                  onRefresh: () async => _loadSettings(forceRefresh: true),
                  child: CustomScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    slivers: [
                      SliverToBoxAdapter(
                        child: _SettingsHero(
                          shopName: snapshot?.shop.name ?? activeShop.shopName,
                          timezone:
                              snapshot?.shop.timezone ?? activeShop.timezone,
                          ownerName:
                              snapshot?.account.name ?? authState.user?.name,
                          ownerEmail:
                              snapshot?.account.email ?? authState.user?.email,
                          onEditPressed: _navigateToEditProfile,
                        ),
                      ),
                      if (settingsState.status == SettingsStatus.loading &&
                          snapshot == null)
                        const SliverFillRemaining(
                          hasScrollBody: false,
                          child: Center(child: CircularProgressIndicator()),
                        )
                      else if (snapshot == null)
                        SliverFillRemaining(
                          hasScrollBody: false,
                          child: AppEmptyState(
                            icon: const Icon(Icons.settings_outlined),
                            title: 'Settings unavailable',
                            message:
                                'We could not load your account and billing details right now.',
                            action: AppButton(
                              text: 'Retry',
                              onPressed: () =>
                                  _loadSettings(forceRefresh: true),
                            ),
                          ),
                        )
                      else
                        SliverPadding(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 92),
                          sliver: SliverList(
                            delegate: SliverChildListDelegate([
                              _BillingPlanCard(
                                billing: snapshot.billing,
                                shopName: snapshot.shop.name,
                              ),
                              if (_buildBillingBanner(snapshot.billing) !=
                                  null) ...[
                                _buildBillingBanner(snapshot.billing)!,
                                const SizedBox(height: 14),
                              ],
                              const _SectionLabel(label: 'Workspace'),
                              AppSettingGroup(
                                children: [
                                  AppSettingTile(
                                    leading: const Icon(
                                      Icons.edit_outlined,
                                      size: 18,
                                      color: AppColors.softOrange,
                                    ),
                                    iconBgColor: AppColors.softOrangeLight,
                                    title: 'Profile & Shop',
                                    subtitle:
                                        '${snapshot.account.name} · ${snapshot.shop.name}',
                                    showArrow: true,
                                    onTap: _navigateToEditProfile,
                                  ),
                                  if ((authState.user?.shopAccesses.length ??
                                          0) >
                                      1)
                                    AppSettingTile(
                                      leading: const Icon(
                                        Icons.storefront_outlined,
                                        size: 18,
                                        color: AppColors.textMid,
                                      ),
                                      iconBgColor: AppColors.purpleLight,
                                      title: 'Switch Shop',
                                      subtitle:
                                          'Current: ${snapshot.shop.name}',
                                      showArrow: true,
                                      onTap: () => context.push(
                                        Uri(
                                          path: AppRoutePaths.shopSelection,
                                          queryParameters: <String, String>{
                                            'from': AppRoutePaths.settings,
                                          },
                                        ).toString(),
                                      ),
                                    ),
                                  AppSettingTile(
                                    leading: const Icon(
                                      Icons.language_rounded,
                                      size: 18,
                                      color: AppColors.teal,
                                    ),
                                    iconBgColor: AppColors.tealLight,
                                    title: 'App Language',
                                    subtitle:
                                        'Saved to your account and device',
                                    trailingValue: _formatLocale(
                                      snapshot.account.locale,
                                    ),
                                    showArrow: true,
                                    onTap: _navigateToEditProfile,
                                  ),
                                  AppSettingTile(
                                    leading: const Icon(
                                      Icons.schedule_rounded,
                                      size: 18,
                                      color: Color(0xFFB45309),
                                    ),
                                    iconBgColor: AppColors.yellowLight,
                                    title: 'Timezone',
                                    subtitle: 'Order and summary timestamps',
                                    trailingValue: snapshot.shop.timezone,
                                    showArrow: true,
                                    onTap: _navigateToEditProfile,
                                  ),
                                ],
                              ),
                              const _SectionLabel(label: 'Account'),
                              AppSettingGroup(
                                children: [
                                  AppSettingTile(
                                    leading: const Icon(
                                      Icons.person_outline_rounded,
                                      size: 18,
                                      color: AppColors.teal,
                                    ),
                                    iconBgColor: AppColors.tealLight,
                                    title: snapshot.account.name,
                                    subtitle: snapshot.account.isEmailVerified
                                        ? 'Email verified'
                                        : 'Email verification pending',
                                    showArrow: true,
                                    onTap: _navigateToEditProfile,
                                  ),
                                  AppSettingTile(
                                    leading: const Icon(
                                      Icons.mail_outline_rounded,
                                      size: 18,
                                      color: AppColors.softOrange,
                                    ),
                                    iconBgColor: AppColors.softOrangeLight,
                                    title:
                                        snapshot.account.email ??
                                        'No email set',
                                    subtitle: 'Primary sign-in identifier',
                                    showArrow: true,
                                    onTap: _navigateToEditProfile,
                                  ),
                                  AppSettingTile(
                                    leading: const Icon(
                                      Icons.call_outlined,
                                      size: 18,
                                      color: Color(0xFF15803D),
                                    ),
                                    iconBgColor: AppColors.greenLight,
                                    title:
                                        snapshot.account.phone ??
                                        'No phone set',
                                    subtitle: 'Optional contact number',
                                    showArrow: true,
                                    onTap: _navigateToEditProfile,
                                  ),
                                ],
                              ),
                              const _SectionLabel(label: 'Billing'),
                              AppSettingGroup(
                                children: [
                                  AppSettingTile(
                                    leading: const Icon(
                                      Icons.workspace_premium_outlined,
                                      size: 18,
                                      color: Color(0xFFB45309),
                                    ),
                                    iconBgColor: AppColors.yellowLight,
                                    title:
                                        snapshot.billing.planName ??
                                        'No active plan',
                                    subtitle: _formatBillingPeriod(
                                      snapshot.billing.billingPeriod,
                                    ),
                                  ),
                                  AppSettingTile(
                                    leading: const Icon(
                                      Icons.receipt_long_outlined,
                                      size: 18,
                                      color: AppColors.textMid,
                                    ),
                                    iconBgColor: AppColors.purpleLight,
                                    title: _formatBillingStatus(
                                      snapshot.billing.status,
                                    ),
                                    subtitle: _formatBillingSubtitle(
                                      snapshot.billing,
                                    ),
                                  ),
                                  AppSettingTile(
                                    leading: const Icon(
                                      Icons.payments_outlined,
                                      size: 18,
                                      color: AppColors.softOrange,
                                    ),
                                    iconBgColor: AppColors.softOrangeLight,
                                    title: 'Outstanding balance',
                                    subtitle:
                                        snapshot.billing.outstandingBalance <= 0
                                        ? 'All invoices are settled'
                                        : 'Payment needed to keep the shop active',
                                    trailingValue:
                                        '${_formatAmount(snapshot.billing.outstandingBalance)} MMK',
                                  ),
                                ],
                              ),
                              const _SectionLabel(label: 'Notifications'),
                              _buildNotificationSettingsGroup(),
                              const SizedBox(height: 8),
                              AppSettingGroup(
                                marginBottom: 0,
                                children: [
                                  AppSettingTile(
                                    title: 'Log Out',
                                    titleColor: const Color(0xFFEF4444),
                                    leading: const Icon(
                                      Icons.logout_rounded,
                                      size: 18,
                                      color: Color(0xFFEF4444),
                                    ),
                                    onTap: () {
                                      getIt<AuthBloc>().add(
                                        const AuthLogoutRequested(),
                                      );
                                    },
                                  ),
                                ],
                              ),
                            ]),
                          ),
                        ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildNotificationSettingsGroup() {
    return BlocBuilder<
      NotificationPreferencesBloc,
      NotificationPreferencesState
    >(
      bloc: getIt<NotificationPreferencesBloc>(),
      builder: (context, state) {
        final orderPreference = _preferenceOrFallback(
          state,
          category: 'order_activity',
          label: 'Order Reminders',
          description: 'New and pending order alerts',
          enabledByDefault: true,
        );
        final summaryPreference = _preferenceOrFallback(
          state,
          category: 'daily_summary',
          label: 'Daily Summary',
          description: 'End-of-day report and recap',
          enabledByDefault: true,
        );
        final promoPreference = _preferenceOrFallback(
          state,
          category: 'promotional_tips',
          label: 'Product Updates',
          description: 'Feature news and selling tips',
          enabledByDefault: false,
        );

        return AppSettingGroup(
          children: [
            _buildNotificationPreferenceTile(
              state: state,
              category: orderPreference.category,
              icon: const Icon(
                Icons.notifications_none_rounded,
                size: 18,
                color: AppColors.softOrange,
              ),
              iconBgColor: AppColors.softOrangeLight,
              title: orderPreference.label,
              subtitle:
                  '${orderPreference.description ?? 'Order activity'} · In-app + email',
              enabled:
                  orderPreference.inAppEnabled && orderPreference.emailEnabled,
            ),
            _buildNotificationPreferenceTile(
              state: state,
              category: summaryPreference.category,
              icon: const Icon(
                Icons.bar_chart_rounded,
                size: 18,
                color: AppColors.textMid,
              ),
              iconBgColor: AppColors.purpleLight,
              title: summaryPreference.label,
              subtitle:
                  '${summaryPreference.description ?? 'Daily summary'} · In-app + email',
              enabled:
                  summaryPreference.inAppEnabled &&
                  summaryPreference.emailEnabled,
            ),
            _buildNotificationPreferenceTile(
              state: state,
              category: promoPreference.category,
              icon: const Icon(
                Icons.lightbulb_outline_rounded,
                size: 18,
                color: AppColors.teal,
              ),
              iconBgColor: AppColors.tealLight,
              title: promoPreference.label,
              subtitle:
                  '${promoPreference.description ?? 'Tips and updates'} · In-app + email',
              enabled:
                  promoPreference.inAppEnabled && promoPreference.emailEnabled,
            ),
          ],
        );
      },
    );
  }

  Widget _buildNotificationPreferenceTile({
    required NotificationPreferencesState state,
    required String category,
    required Widget icon,
    required Color iconBgColor,
    required String title,
    required String subtitle,
    required bool enabled,
  }) {
    final isUpdating = state.updatingCategories.contains(category);

    return AppSettingTile(
      leading: icon,
      iconBgColor: iconBgColor,
      title: title,
      subtitle: subtitle,
      trailingWidget: AppToggle(
        value: enabled,
        onChanged: isUpdating
            ? null
            : (value) {
                getIt<NotificationPreferencesBloc>().add(
                  NotificationPreferencesToggleRequested(
                    category: category,
                    enabled: value,
                  ),
                );
              },
      ),
    );
  }

  NotificationPreference _preferenceOrFallback(
    NotificationPreferencesState state, {
    required String category,
    required String label,
    required String description,
    required bool enabledByDefault,
  }) {
    return state.preferenceFor(category) ??
        NotificationPreference(
          category: category,
          label: label,
          description: description,
          inAppEnabled: enabledByDefault,
          emailEnabled: enabledByDefault,
          updatedAt: null,
        );
  }

  Widget? _buildBillingBanner(SettingsBillingOverview billing) {
    if (billing.isTrialing) {
      final endAt = billing.currentPeriodEnd;
      return AppAlertBanner(
        title: 'Free trial is active',
        message: endAt == null
            ? 'You can continue using the shop while the trial is active.'
            : 'Trial ends in ${_formatDaysLeft(endAt)}.',
        icon: const Icon(
          Icons.hourglass_bottom_rounded,
          size: 20,
          color: Color(0xFF92400E),
        ),
      );
    }

    if (billing.overdueInvoiceCount > 0 || billing.outstandingBalance > 0) {
      return AppAlertBanner(
        title: 'Billing needs attention',
        message:
            '${billing.overdueInvoiceCount} overdue invoice(s) · ${_formatAmount(billing.outstandingBalance)} MMK outstanding.',
        icon: const Icon(
          Icons.error_outline_rounded,
          size: 20,
          color: Color(0xFFB91C1C),
        ),
        backgroundColor: const Color(0xFFFEE2E2),
        borderColor: const Color(0xFFFECACA),
        titleColor: const Color(0xFFB91C1C),
        messageColor: const Color(0xFF991B1B),
      );
    }

    return null;
  }

  String _formatLocale(String locale) {
    switch (locale.trim().toLowerCase()) {
      case 'en':
        return 'English';
      case 'my':
        return 'မြန်မာ';
      default:
        return locale;
    }
  }

  String _formatAmount(int? value) {
    return NumberFormat.decimalPattern().format(value ?? 0);
  }

  String _formatDaysLeft(DateTime endAt) {
    final today = DateTime.now();
    final difference = endAt.difference(today).inDays;

    if (difference <= 0) {
      return 'today';
    }

    if (difference == 1) {
      return '1 day';
    }

    return '$difference days';
  }

  String _formatBillingPeriod(String? billingPeriod) {
    switch ((billingPeriod ?? '').trim().toLowerCase()) {
      case 'monthly':
        return 'Billed monthly';
      case 'yearly':
        return 'Billed yearly';
      case 'trial':
        return 'Trial period';
      default:
        return 'Billing cadence unavailable';
    }
  }

  String _formatBillingStatus(String? status) {
    final normalized = (status ?? '').trim().toLowerCase();
    if (normalized.isEmpty) {
      return 'No subscription status';
    }

    return normalized
        .split('_')
        .map((part) {
          if (part.isEmpty) {
            return part;
          }

          return '${part[0].toUpperCase()}${part.substring(1)}';
        })
        .join(' ');
  }

  String _formatBillingSubtitle(SettingsBillingOverview billing) {
    if (billing.nextDueAt != null) {
      return 'Next billing: ${DateFormat('MMM d, y').format(billing.nextDueAt!)}';
    }

    if (billing.currentPeriodEnd != null) {
      return 'Current period ends ${DateFormat('MMM d, y').format(billing.currentPeriodEnd!)}';
    }

    return 'No due date scheduled';
  }
}

class _SettingsHero extends StatelessWidget {
  const _SettingsHero({
    required this.shopName,
    required this.timezone,
    required this.ownerName,
    required this.ownerEmail,
    required this.onEditPressed,
  });

  final String shopName;
  final String timezone;
  final String? ownerName;
  final String? ownerEmail;
  final VoidCallback onEditPressed;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 20,
        left: 20,
        right: 20,
        bottom: 22,
      ),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1A1A2E), Color(0xFF2C2C50)],
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: AppColors.softOrange,
              borderRadius: BorderRadius.circular(18),
            ),
            alignment: Alignment.center,
            child: Text(
              shopName.isEmpty ? 'S' : shopName[0].toUpperCase(),
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  shopName,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '$timezone · ${ownerName ?? 'Account owner'}',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Colors.white70,
                  ),
                ),
                if ((ownerEmail ?? '').trim().isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    ownerEmail!,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Colors.white60,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 12),
          AppButton(
            text: 'Edit',
            variant: AppButtonVariant.secondary,
            onPressed: onEditPressed,
          ),
        ],
      ),
    );
  }
}

class _BillingPlanCard extends StatelessWidget {
  const _BillingPlanCard({required this.billing, required this.shopName});

  final SettingsBillingOverview billing;
  final String shopName;

  @override
  Widget build(BuildContext context) {
    final planName =
        billing.planName ??
        (billing.isTrialing ? 'Free Trial' : 'No active plan');
    final status = _formatStatus(billing.status);
    final secondaryText = billing.isTrialing
        ? _trialSecondaryText(billing)
        : _subscriptionSecondaryText(billing);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: const LinearGradient(
          colors: [AppColors.softOrange, Color(0xFFFF8C5A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Current Plan'.toUpperCase(),
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              color: Colors.white70,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            planName,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            secondaryText,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.white70,
            ),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _PlanPill(label: status),
              _PlanPill(
                label:
                    '${NumberFormat.decimalPattern().format(billing.planPrice ?? 0)} ${billing.planCurrency ?? 'MMK'}',
              ),
              _PlanPill(label: shopName),
            ],
          ),
        ],
      ),
    );
  }

  String _formatStatus(String? value) {
    final normalized = (value ?? '').trim().toLowerCase();
    if (normalized.isEmpty) {
      return 'Unknown';
    }

    return normalized
        .split('_')
        .map(
          (part) => part.isEmpty
              ? part
              : '${part[0].toUpperCase()}${part.substring(1)}',
        )
        .join(' ');
  }

  String _trialSecondaryText(SettingsBillingOverview billing) {
    if (billing.currentPeriodEnd == null) {
      return 'Trial access is active for this shop.';
    }

    return 'Trial ends ${DateFormat('MMM d, y').format(billing.currentPeriodEnd!)}';
  }

  String _subscriptionSecondaryText(SettingsBillingOverview billing) {
    if (billing.nextDueAt != null) {
      return 'Next billing on ${DateFormat('MMM d, y').format(billing.nextDueAt!)}';
    }

    if (billing.currentPeriodEnd != null) {
      return 'Current period ends ${DateFormat('MMM d, y').format(billing.currentPeriodEnd!)}';
    }

    return 'Billing details synced from the current shop subscription.';
  }
}

class _PlanPill extends StatelessWidget {
  const _PlanPill({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          color: Colors.white,
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 2, bottom: 8, top: 4),
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
