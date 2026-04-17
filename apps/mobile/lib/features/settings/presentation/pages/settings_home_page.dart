import 'package:app_localizations/app_localizations.dart';
import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../app/config/app_locale_controller.dart';
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
  static final Uri _supportWebsiteUri = Uri.parse('https://getfom.com');

  @override
  void initState() {
    super.initState();
    getIt<NotificationPreferencesBloc>().add(
      const NotificationPreferencesStarted(),
    );
    if (_canManageShopSettings(getIt<AuthBloc>().state)) {
      _loadSettings();
    }
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

  bool _canManageShopSettings(AuthState authState) {
    return authState.activeShop?.permissions.contains('shops.write') ?? false;
  }

  String _currentLocaleCode(AuthState authState, SettingsSnapshot? snapshot) {
    final controllerLocale = getIt<AppLocaleController>().locale?.languageCode;
    if ((controllerLocale ?? '').trim().isNotEmpty) {
      return controllerLocale!.trim().toLowerCase();
    }

    final snapshotLocale = snapshot?.account.locale.trim();
    if ((snapshotLocale ?? '').isNotEmpty) {
      return snapshotLocale!.toLowerCase();
    }

    final authLocale = authState.user?.locale.trim();
    if ((authLocale ?? '').isNotEmpty) {
      return authLocale!.toLowerCase();
    }

    return 'my';
  }

  Future<void> _showLanguageSheet(String currentLocaleCode) async {
    final selectedLocaleCode = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        final l10n = sheetContext.l10n;

        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
          child: SafeArea(
            top: false,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.settingsLanguageSheetTitle,
                  style: Theme.of(sheetContext).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w900,
                    color: AppColors.textDark,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  l10n.settingsLanguageSheetSubtitle,
                  style: Theme.of(sheetContext).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textMid,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Expanded(
                      child: AppSelectionOption(
                        icon: const Icon(Icons.language_rounded),
                        label: l10n.languageEnglish,
                        subtitle: 'English',
                        isSelected: currentLocaleCode == 'en',
                        onTap: () => Navigator.of(sheetContext).pop('en'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: AppSelectionOption(
                        icon: const Icon(Icons.translate_rounded),
                        label: l10n.languageMyanmar,
                        subtitle: 'မြန်မာ',
                        isSelected: currentLocaleCode == 'my',
                        onTap: () => Navigator.of(sheetContext).pop('my'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );

    final normalizedLocaleCode = selectedLocaleCode?.trim().toLowerCase();
    if ((normalizedLocaleCode ?? '').isEmpty ||
        normalizedLocaleCode == currentLocaleCode) {
      return;
    }

    await getIt<AppLocaleController>().setLocaleCode(
      normalizedLocaleCode == 'en' ? 'en' : 'my',
    );
    if (mounted) {
      setState(() {});
    }
  }

  Future<void> _launchSupportWebsite() async {
    final l10n = context.l10n;

    try {
      final launched = await launchUrl(
        _supportWebsiteUri,
        mode: LaunchMode.externalApplication,
      );

      if (launched || !mounted) {
        return;
      }
    } catch (_) {
      if (!mounted) {
        return;
      }
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(l10n.settingsSupportOpenError),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return MultiBlocListener(
      listeners: [
        BlocListener<AuthBloc, AuthState>(
          bloc: getIt<AuthBloc>(),
          listenWhen: (previous, current) {
            return previous.activeShopId != current.activeShopId;
          },
          listener: (context, state) {
            if (_canManageShopSettings(state)) {
              _loadSettings(forceRefresh: true);
            }
          },
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
          final canManageShopSettings = _canManageShopSettings(authState);
          if (activeShop == null) {
            return Scaffold(
              backgroundColor: AppColors.background,
              body: SafeArea(
                child: AppEmptyState(
                  icon: const Icon(Icons.storefront_outlined),
                  title: l10n.settingsNoActiveShopTitle,
                  message: l10n.settingsNoActiveShopMessage,
                  action: AppButton(
                    text: l10n.chooseShop,
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

          if (!canManageShopSettings) {
            final localeCode = _currentLocaleCode(authState, null);

            return Scaffold(
              backgroundColor: AppColors.background,
              body: SafeArea(
                child: RefreshIndicator(
                  color: AppColors.softOrange,
                  onRefresh: () async {
                    getIt<NotificationPreferencesBloc>().add(
                      const NotificationPreferencesStarted(),
                    );
                  },
                  child: CustomScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    slivers: [
                      SliverToBoxAdapter(
                        child: _SettingsHero(
                          shopName: activeShop.shopName,
                          timezone: activeShop.timezone,
                          ownerName: authState.user?.name,
                          ownerEmail: authState.user?.email,
                        ),
                      ),
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 92),
                        sliver: SliverList(
                          delegate: SliverChildListDelegate([
                            _SectionLabel(label: l10n.settingsSectionAccount),
                            AppSettingGroup(
                              children: [
                                AppSettingTile(
                                  leading: const Icon(
                                    Icons.person_outline_rounded,
                                    size: 18,
                                    color: AppColors.teal,
                                  ),
                                  iconBgColor: AppColors.tealLight,
                                  title:
                                      authState.user?.name ??
                                      l10n.settingsSignedInAccountTitle,
                                  subtitle:
                                      authState.user?.email ??
                                      authState.user?.phone ??
                                      l10n.shopSelectionNoContact,
                                ),
                                AppSettingTile(
                                  leading: const Icon(
                                    Icons.storefront_outlined,
                                    size: 18,
                                    color: AppColors.softOrange,
                                  ),
                                  iconBgColor: AppColors.softOrangeLight,
                                  title: l10n.settingsCurrentShopTitle,
                                  subtitle: activeShop.shopName,
                                ),
                                AppSettingTile(
                                  leading: const Icon(
                                    Icons.verified_user_outlined,
                                    size: 18,
                                    color: AppColors.textMid,
                                  ),
                                  iconBgColor: AppColors.purpleLight,
                                  title: l10n.settingsCurrentRoleTitle,
                                  subtitle: _formatRoleLabel(
                                    authState.activeShop?.role,
                                    l10n,
                                  ),
                                ),
                                AppSettingTile(
                                  leading: const Icon(
                                    Icons.language_rounded,
                                    size: 18,
                                    color: AppColors.teal,
                                  ),
                                  iconBgColor: AppColors.tealLight,
                                  title: l10n.settingsAppLanguageTitle,
                                  subtitle: l10n.settingsAppLanguageSubtitle,
                                  trailingValue: _formatLocale(
                                    localeCode,
                                    l10n,
                                  ),
                                  showArrow: true,
                                  onTap: () => _showLanguageSheet(localeCode),
                                ),
                                if ((authState.user?.shopAccesses.length ?? 0) >
                                    1)
                                  AppSettingTile(
                                    leading: const Icon(
                                      Icons.storefront_outlined,
                                      size: 18,
                                      color: AppColors.textMid,
                                    ),
                                    iconBgColor: AppColors.purpleLight,
                                    title: l10n.settingsSwitchShopTitle,
                                    subtitle: l10n.settingsSwitchShopSubtitle(
                                      activeShop.shopName,
                                    ),
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
                              ],
                            ),
                            _SectionLabel(label: l10n.settingsSectionTools),
                            AppSettingGroup(
                              children: [
                                AppSettingTile(
                                  leading: const Icon(
                                    Icons.download_rounded,
                                    size: 18,
                                    color: AppColors.softOrange,
                                  ),
                                  iconBgColor: AppColors.softOrangeLight,
                                  title: l10n.settingsDataExportsTitle,
                                  subtitle: l10n.settingsDataExportsSubtitle,
                                  showArrow: true,
                                  onTap: () => context.push(
                                    AppRoutePaths.settingsExports,
                                  ),
                                ),
                              ],
                            ),
                            _SectionLabel(
                              label: l10n.settingsSectionNotifications,
                            ),
                            _buildNotificationSettingsGroup(context),
                            const SizedBox(height: 8),
                            AppSettingGroup(
                              marginBottom: 0,
                              children: [
                                AppSettingTile(
                                  title: l10n.signOut,
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
                          actionLabel: l10n.settingsEditAction,
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
                            title: l10n.settingsUnavailableTitle,
                            message: l10n.settingsUnavailableMessage,
                            action: AppButton(
                              text: l10n.retry,
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
                              if (_buildBillingBanner(
                                    context,
                                    snapshot.billing,
                                  ) !=
                                  null) ...[
                                _buildBillingBanner(context, snapshot.billing)!,
                                const SizedBox(height: 14),
                              ],
                              _SectionLabel(
                                label: l10n.settingsSectionWorkspace,
                              ),
                              AppSettingGroup(
                                children: [
                                  AppSettingTile(
                                    leading: const Icon(
                                      Icons.edit_outlined,
                                      size: 18,
                                      color: AppColors.softOrange,
                                    ),
                                    iconBgColor: AppColors.softOrangeLight,
                                    title: l10n.settingsProfileAndShopTitle,
                                    subtitle: l10n
                                        .settingsProfileAndShopSubtitle(
                                          snapshot.account.name,
                                          snapshot.shop.name,
                                        ),
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
                                      title: l10n.settingsSwitchShopTitle,
                                      subtitle: l10n.settingsSwitchShopSubtitle(
                                        snapshot.shop.name,
                                      ),
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
                                    title: l10n.settingsAppLanguageTitle,
                                    subtitle: l10n.settingsAppLanguageSubtitle,
                                    trailingValue: _formatLocale(
                                      _currentLocaleCode(authState, snapshot),
                                      l10n,
                                    ),
                                    showArrow: true,
                                    onTap: () => _showLanguageSheet(
                                      _currentLocaleCode(authState, snapshot),
                                    ),
                                  ),
                                  AppSettingTile(
                                    leading: const Icon(
                                      Icons.schedule_rounded,
                                      size: 18,
                                      color: Color(0xFFB45309),
                                    ),
                                    iconBgColor: AppColors.yellowLight,
                                    title: l10n.settingsTimezoneTitle,
                                    subtitle: l10n.settingsTimezoneSubtitle,
                                    trailingValue: snapshot.shop.timezone,
                                    showArrow: true,
                                    onTap: _navigateToEditProfile,
                                  ),
                                  AppSettingTile(
                                    leading: const Icon(
                                      Icons.download_rounded,
                                      size: 18,
                                      color: AppColors.softOrange,
                                    ),
                                    iconBgColor: AppColors.softOrangeLight,
                                    title: l10n.settingsDataExportsTitle,
                                    subtitle: l10n.settingsDataExportsSubtitle,
                                    showArrow: true,
                                    onTap: () => context.push(
                                      AppRoutePaths.settingsExports,
                                    ),
                                  ),
                                ],
                              ),
                              _SectionLabel(label: l10n.settingsSectionAccount),
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
                                        ? l10n.settingsAccountEmailVerified
                                        : l10n.settingsAccountEmailPending,
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
                                        l10n.settingsNoEmailSet,
                                    subtitle:
                                        l10n.settingsPrimarySignInIdentifier,
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
                                        l10n.settingsNoPhoneSet,
                                    subtitle:
                                        l10n.settingsOptionalContactNumber,
                                    showArrow: true,
                                    onTap: _navigateToEditProfile,
                                  ),
                                ],
                              ),
                              _SectionLabel(label: l10n.settingsSectionBilling),
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
                                        l10n.settingsBillingNoActivePlan,
                                    subtitle: _formatBillingPeriod(
                                      snapshot.billing.billingPeriod,
                                      l10n,
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
                                      l10n,
                                    ),
                                    subtitle: _formatBillingSubtitle(
                                      snapshot.billing,
                                      l10n,
                                    ),
                                  ),
                                  AppSettingTile(
                                    leading: const Icon(
                                      Icons.payments_outlined,
                                      size: 18,
                                      color: AppColors.softOrange,
                                    ),
                                    iconBgColor: AppColors.softOrangeLight,
                                    title: l10n
                                        .settingsBillingOutstandingBalanceTitle,
                                    subtitle:
                                        snapshot.billing.outstandingBalance <= 0
                                        ? l10n.settingsBillingAllSettled
                                        : l10n.settingsBillingPaymentNeeded,
                                    trailingValue:
                                        '${_formatAmount(snapshot.billing.outstandingBalance)} MMK',
                                  ),
                                  AppSettingTile(
                                    leading: const Icon(
                                      Icons.open_in_browser_rounded,
                                      size: 18,
                                      color: AppColors.teal,
                                    ),
                                    iconBgColor: AppColors.tealLight,
                                    title: l10n.settingsBillingPaymentHelpTitle,
                                    subtitle:
                                        l10n.settingsBillingPaymentHelpSubtitle,
                                    showArrow: true,
                                    onTap: _launchSupportWebsite,
                                  ),
                                ],
                              ),
                              _SectionLabel(
                                label: l10n.settingsSectionNotifications,
                              ),
                              _buildNotificationSettingsGroup(context),
                              const SizedBox(height: 8),
                              AppSettingGroup(
                                marginBottom: 0,
                                children: [
                                  AppSettingTile(
                                    title: l10n.signOut,
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

  Widget _buildNotificationSettingsGroup(BuildContext context) {
    final l10n = context.l10n;

    return BlocBuilder<
      NotificationPreferencesBloc,
      NotificationPreferencesState
    >(
      bloc: getIt<NotificationPreferencesBloc>(),
      builder: (context, state) {
        final orderPreference = _preferenceOrFallback(
          state,
          category: 'order_activity',
          label: l10n.notificationsOrderReminders,
          description: l10n.notificationsOrderRemindersDesc,
          enabledByDefault: true,
        );
        final summaryPreference = _preferenceOrFallback(
          state,
          category: 'daily_summary',
          label: l10n.notificationsDailySummary,
          description: l10n.notificationsDailySummaryDesc,
          enabledByDefault: true,
        );
        final promoPreference = _preferenceOrFallback(
          state,
          category: 'promotional_tips',
          label: l10n.notificationsProductUpdates,
          description: l10n.notificationsProductUpdatesDesc,
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
                  '${orderPreference.description ?? l10n.notificationsOrderRemindersDesc} · ${l10n.notificationsChannelInAppEmail}',
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
                  '${summaryPreference.description ?? l10n.notificationsDailySummaryDesc} · ${l10n.notificationsChannelInAppEmail}',
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
                  '${promoPreference.description ?? l10n.notificationsProductUpdatesDesc} · ${l10n.notificationsChannelInAppEmail}',
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

  Widget? _buildBillingBanner(
    BuildContext context,
    SettingsBillingOverview billing,
  ) {
    final l10n = context.l10n;

    if (billing.isTrialing) {
      final endAt = billing.currentPeriodEnd;
      return AppAlertBanner(
        title: l10n.settingsBillingTrialActiveTitle,
        message: endAt == null
            ? l10n.settingsBillingTrialActiveMessage
            : l10n.settingsBillingTrialEndsIn(_formatDaysLeft(endAt, l10n)),
        icon: const Icon(
          Icons.hourglass_bottom_rounded,
          size: 20,
          color: Color(0xFF92400E),
        ),
      );
    }

    if (billing.overdueInvoiceCount > 0 || billing.outstandingBalance > 0) {
      return AppAlertBanner(
        title: l10n.settingsBillingNeedsAttentionTitle,
        message: l10n.settingsBillingNeedsAttentionMessage(
          billing.overdueInvoiceCount,
          _formatAmount(billing.outstandingBalance),
        ),
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

  String _formatLocale(String locale, AppLocalizations l10n) {
    switch (locale.trim().toLowerCase()) {
      case 'en':
        return l10n.languageEnglish;
      case 'my':
        return l10n.languageMyanmar;
      default:
        return locale;
    }
  }

  String _formatAmount(int? value) {
    return NumberFormat.decimalPattern().format(value ?? 0);
  }

  String _formatDaysLeft(DateTime endAt, AppLocalizations l10n) {
    final today = DateTime.now();
    final difference = endAt.difference(today).inDays;

    if (difference <= 0) {
      return l10n.settingsBillingToday;
    }

    if (difference == 1) {
      return l10n.settingsBillingOneDay;
    }

    return l10n.settingsBillingManyDays(difference);
  }

  String _formatBillingPeriod(String? billingPeriod, AppLocalizations l10n) {
    switch ((billingPeriod ?? '').trim().toLowerCase()) {
      case 'monthly':
        return l10n.settingsBillingPeriodMonthly;
      case 'yearly':
        return l10n.settingsBillingPeriodYearly;
      case 'trial':
        return l10n.settingsBillingPeriodTrial;
      default:
        return l10n.settingsBillingPeriodUnavailable;
    }
  }

  String _formatBillingStatus(String? status, AppLocalizations l10n) {
    final normalized = (status ?? '').trim().toLowerCase();
    if (normalized.isEmpty) {
      return l10n.settingsBillingStatusUnavailable;
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

  String _formatBillingSubtitle(
    SettingsBillingOverview billing,
    AppLocalizations l10n,
  ) {
    if (billing.nextDueAt != null) {
      return l10n.settingsBillingNextBilling(
        DateFormat('MMM d, y').format(billing.nextDueAt!),
      );
    }

    if (billing.currentPeriodEnd != null) {
      return l10n.settingsBillingCurrentPeriodEnds(
        DateFormat('MMM d, y').format(billing.currentPeriodEnd!),
      );
    }

    return l10n.settingsBillingNoDueDate;
  }

  String _formatRoleLabel(String? roleCode, AppLocalizations l10n) {
    final normalized = (roleCode ?? '').trim().toLowerCase();

    switch (normalized) {
      case 'owner':
        return l10n.roleOwner;
      case 'staff':
        return l10n.roleStaff;
      default:
        return normalized.isEmpty ? l10n.roleUnknown : normalized;
    }
  }
}

class _SettingsHero extends StatelessWidget {
  const _SettingsHero({
    required this.shopName,
    required this.timezone,
    required this.ownerName,
    required this.ownerEmail,
    this.actionLabel,
    this.onEditPressed,
  });

  final String shopName;
  final String timezone;
  final String? ownerName;
  final String? ownerEmail;
  final String? actionLabel;
  final VoidCallback? onEditPressed;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

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
                  '$timezone · ${ownerName ?? l10n.settingsAccountOwnerFallback}',
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
          if (onEditPressed != null) ...[
            const SizedBox(width: 12),
            AppButton(
              text: actionLabel ?? l10n.settingsEditAction,
              variant: AppButtonVariant.secondary,
              onPressed: onEditPressed,
            ),
          ],
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
    final l10n = context.l10n;
    final planName =
        billing.planName ??
        (billing.isTrialing
            ? l10n.settingsPlanFreeTrial
            : l10n.settingsBillingNoActivePlan);
    final status = _formatStatus(billing.status, l10n);
    final secondaryText = billing.isTrialing
        ? _trialSecondaryText(billing, l10n)
        : _subscriptionSecondaryText(billing, l10n);

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
            l10n.settingsPlanCurrentPlan.toUpperCase(),
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

  String _formatStatus(String? value, AppLocalizations l10n) {
    final normalized = (value ?? '').trim().toLowerCase();
    if (normalized.isEmpty) {
      return l10n.settingsPlanUnknownStatus;
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

  String _trialSecondaryText(
    SettingsBillingOverview billing,
    AppLocalizations l10n,
  ) {
    if (billing.currentPeriodEnd == null) {
      return l10n.settingsPlanTrialActive;
    }

    return l10n.settingsPlanTrialEndsOn(
      DateFormat('MMM d, y').format(billing.currentPeriodEnd!),
    );
  }

  String _subscriptionSecondaryText(
    SettingsBillingOverview billing,
    AppLocalizations l10n,
  ) {
    if (billing.nextDueAt != null) {
      return l10n.settingsPlanNextBillingOn(
        DateFormat('MMM d, y').format(billing.nextDueAt!),
      );
    }

    if (billing.currentPeriodEnd != null) {
      return l10n.settingsPlanCurrentPeriodEndsOn(
        DateFormat('MMM d, y').format(billing.currentPeriodEnd!),
      );
    }

    return l10n.settingsPlanSubscriptionSynced;
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
