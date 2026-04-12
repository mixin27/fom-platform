import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/di/injection_container.dart';
import '../../../../app/router/app_route_paths.dart';
import '../../../auth/feature_auth.dart';
import '../../../notifications/feature_notifications.dart';

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
  }

  void _navigateToEditProfile() {
    context.push(AppRoutePaths.editProfile);
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<NotificationPreferencesBloc, NotificationPreferencesState>(
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
          SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
        );
        getIt<NotificationPreferencesBloc>().add(
          const NotificationPreferencesErrorDismissed(),
        );
      },
      child: BlocBuilder<AuthBloc, AuthState>(
        bloc: getIt<AuthBloc>(),
        builder: (context, authState) {
          final activeShop = authState.activeShop;
          final hasMultipleShops = (authState.user?.shopAccesses.length ?? 0) > 1;

          return Scaffold(
            backgroundColor: AppColors.background,
            body: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: _buildShopHeaderHero(activeShop?.shopName),
                ),
                SliverPadding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 16,
                  ),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
                      _buildPlanCard(),

                    // SHOP SETTINGS
                    const _SectionLabel(label: 'Shop Settings'),
                    AppSettingGroup(
                      children: [
                        if (hasMultipleShops)
                          AppSettingTile(
                            iconEmoji: '🏬',
                            iconBgColor: AppColors.purpleLight,
                            title: 'Switch Shop',
                            subtitle:
                                activeShop?.shopName ?? 'Choose active shop',
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
                          iconEmoji: '🏪',
                          iconBgColor: AppColors.softOrangeLight,
                          title: 'Shop Profile',
                          subtitle: 'Name, category, address',
                          showArrow: true,
                          onTap: _navigateToEditProfile,
                        ),
                        AppSettingTile(
                          iconEmoji: '🌐',
                          iconBgColor: AppColors.tealLight,
                          title: 'Language',
                          subtitle: 'ဘာသာစကား',
                          trailingValue: 'မြန်မာ + EN',
                          showArrow: true,
                          onTap: () {},
                        ),
                        AppSettingTile(
                          iconEmoji: '💰',
                          iconBgColor: AppColors.yellowLight,
                          title: 'Default Delivery Fee',
                          subtitle: 'Auto-fill when adding orders',
                          trailingValue: '3,000 MMK',
                          showArrow: true,
                          onTap: () {},
                        ),
                      ],
                    ),

                      // NOTIFICATIONS
                      const _SectionLabel(label: 'Notifications — အသိပေးချက်'),
                      _buildNotificationSettingsGroup(),

                    // DATA & PRIVACY
                    const _SectionLabel(label: 'Data & Privacy'),
                    AppSettingGroup(
                      children: [
                        AppSettingTile(
                          iconEmoji: '📤',
                          iconBgColor: AppColors.greenLight,
                          title: 'Export All Data',
                          subtitle: 'Download orders as Excel',
                          showArrow: true,
                          onTap: () {},
                        ),
                        AppSettingTile(
                          iconEmoji: '🔒',
                          iconBgColor: const Color(0xFFE8E8F0),
                          title: 'Change Password',
                          subtitle: 'Update your login credentials',
                          showArrow: true,
                          onTap: () {},
                        ),
                      ],
                    ),

                    // SUPPORT
                    const _SectionLabel(label: 'Support'),
                    AppSettingGroup(
                      children: [
                        AppSettingTile(
                          iconEmoji: '💬',
                          iconBgColor: AppColors.tealLight,
                          title: 'Contact Support',
                          subtitle: 'Message us on Facebook',
                          showArrow: true,
                          onTap: () {},
                        ),
                        AppSettingTile(
                          iconEmoji: '⭐',
                          iconBgColor: AppColors.yellowLight,
                          title: 'Rate the App',
                          subtitle: 'Help us grow',
                          showArrow: true,
                          onTap: () {},
                        ),
                      ],
                    ),

                    // LOG OUT
                    const SizedBox(height: 8),
                    AppSettingGroup(
                      marginBottom: 80,
                      children: [
                        AppSettingTile(
                          title: '🚪 Log Out',
                          titleColor: const Color(0xFFEF4444),
                          onTap: () {
                            getIt<AuthBloc>().add(const AuthLogoutRequested());
                          },
                        ),
                      ],
                    ),
                    ]),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildNotificationSettingsGroup() {
    return BlocBuilder<NotificationPreferencesBloc, NotificationPreferencesState>(
      bloc: getIt<NotificationPreferencesBloc>(),
      builder: (context, state) {
        final orderPreference = _preferenceOrFallback(
          state,
          category: "order_activity",
          label: "Order Reminders",
          description: "New and pending order alerts",
          enabledByDefault: true,
        );
        final summaryPreference = _preferenceOrFallback(
          state,
          category: "daily_summary",
          label: "Daily Summary",
          description: "End-of-day report and recap",
          enabledByDefault: true,
        );
        final promoPreference = _preferenceOrFallback(
          state,
          category: "promotional_tips",
          label: "Promotional Tips",
          description: "Selling tips and platform updates",
          enabledByDefault: false,
        );

        return AppSettingGroup(
          children: [
            _buildNotificationPreferenceTile(
              state: state,
              category: orderPreference.category,
              iconEmoji: "🔔",
              iconBgColor: AppColors.softOrangeLight,
              title: orderPreference.label,
              subtitle:
                  "${orderPreference.description ?? 'New order updates'} · In-app + email",
              enabled: orderPreference.inAppEnabled && orderPreference.emailEnabled,
            ),
            _buildNotificationPreferenceTile(
              state: state,
              category: summaryPreference.category,
              iconEmoji: "📊",
              iconBgColor: AppColors.purpleLight,
              title: summaryPreference.label,
              subtitle:
                  "${summaryPreference.description ?? 'Daily recap'} · In-app + email",
              enabled:
                  summaryPreference.inAppEnabled && summaryPreference.emailEnabled,
            ),
            _buildNotificationPreferenceTile(
              state: state,
              category: promoPreference.category,
              iconEmoji: "💬",
              iconBgColor: AppColors.tealLight,
              title: promoPreference.label,
              subtitle:
                  "${promoPreference.description ?? 'Product tips'} · In-app + email",
              enabled: promoPreference.inAppEnabled && promoPreference.emailEnabled,
            ),
          ],
        );
      },
    );
  }

  Widget _buildNotificationPreferenceTile({
    required NotificationPreferencesState state,
    required String category,
    required String iconEmoji,
    required Color iconBgColor,
    required String title,
    required String subtitle,
    required bool enabled,
  }) {
    final isUpdating = state.updatingCategories.contains(category);

    return AppSettingTile(
      iconEmoji: iconEmoji,
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

  Widget _buildShopHeaderHero(String? shopName) {
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
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            top: -60,
            right: -60,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.softOrange.withValues(alpha: 0.15),
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
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(
                          color: AppColors.softOrange,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.2),
                            width: 2,
                          ),
                        ),
                        alignment: Alignment.center,
                        child: const Text('👗', style: TextStyle(fontSize: 26)),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            shopName ?? 'My Shop',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Fashion · Yangon · 23 orders today',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Colors.white70,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  InkWell(
                    onTap: _navigateToEditProfile,
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.2),
                          width: 1.5,
                        ),
                      ),
                      child: const Text(
                        '✎ Edit',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Text('⏳', style: TextStyle(fontSize: 18)),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Free Trial Active',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                            ),
                          ),
                          Text(
                            'Upgrade to keep all your data',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: Colors.white70,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.softOrange,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        '5 days left',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPlanCard() {
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
      clipBehavior: Clip.antiAlias,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            top: -30,
            right: -20,
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.15),
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Current Plan'.toUpperCase(),
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  color: Colors.white70,
                  letterSpacing: 1.0,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Free Trial 🎉',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                '5 days remaining · Unlimited orders',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.white70,
                ),
              ),
              const SizedBox(height: 14),
              InkWell(
                onTap: () {},
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    'Upgrade — 5,000 MMK/mo →',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      color: AppColors.softOrange,
                    ),
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
          letterSpacing: 1.0,
        ),
      ),
    );
  }
}
