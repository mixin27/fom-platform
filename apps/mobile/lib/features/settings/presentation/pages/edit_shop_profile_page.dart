import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../../app/config/app_locale_controller.dart';
import '../../../../app/di/injection_container.dart';
import '../../../auth/feature_auth.dart';
import '../../feature_settings.dart';

class EditShopProfilePage extends StatefulWidget {
  const EditShopProfilePage({super.key});

  @override
  State<EditShopProfilePage> createState() => _EditShopProfilePageState();
}

class _EditShopProfilePageState extends State<EditShopProfilePage> {
  final _accountFormKey = GlobalKey<FormState>();
  final _shopFormKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _shopNameController = TextEditingController();
  final _timezoneController = TextEditingController();

  String _selectedLocale = 'my';
  String? _shopId;
  SettingsBillingOverview? _billing;
  String? _pageError;
  String? _accountError;
  String? _shopError;
  bool _isLoading = true;
  bool _isSavingAccount = false;
  bool _isSavingShop = false;

  @override
  void initState() {
    super.initState();
    final activeShopId = getIt<AuthBloc>().state.activeShop?.shopId;
    final cachedSettings = getIt<SettingsBloc>().state;

    if (activeShopId != null &&
        cachedSettings.shopId == activeShopId &&
        cachedSettings.snapshot != null) {
      _applySnapshot(cachedSettings.snapshot!);
      _isLoading = false;
    }

    _loadSnapshot(forceRefresh: cachedSettings.snapshot == null);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _shopNameController.dispose();
    _timezoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            _buildHeader(context),
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : RefreshIndicator(
                      color: AppColors.softOrange,
                      onRefresh: () => _loadSnapshot(forceRefresh: true),
                      child: SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.fromLTRB(16, 18, 16, 100),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            if ((_pageError ?? '').trim().isNotEmpty) ...[
                              AppAlertBanner(
                                title: 'Could not load settings',
                                message: _pageError,
                                icon: const Icon(
                                  Icons.error_outline_rounded,
                                  size: 20,
                                  color: Color(0xFFB91C1C),
                                ),
                                backgroundColor: const Color(0xFFFEE2E2),
                                borderColor: const Color(0xFFFECACA),
                                titleColor: const Color(0xFFB91C1C),
                                messageColor: const Color(0xFF991B1B),
                              ),
                              const SizedBox(height: 14),
                            ],
                            _buildAccountSection(),
                            const SizedBox(height: 14),
                            _buildShopSection(),
                            const SizedBox(height: 14),
                            if (_billing != null) _buildBillingCard(_billing!),
                          ],
                        ),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
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
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Profile & Shop',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: AppColors.textDark,
                  ),
                ),
                Text(
                  'Update account details, language, and active shop settings.',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textLight,
                  ),
                ),
              ],
            ),
          ),
          AppButton(
            text: 'Refresh',
            variant: AppButtonVariant.secondary,
            onPressed: () => _loadSnapshot(forceRefresh: true),
          ),
        ],
      ),
    );
  }

  Widget _buildAccountSection() {
    return _SettingsCard(
      icon: Icons.person_outline_rounded,
      iconColor: AppColors.teal,
      iconBackgroundColor: AppColors.tealLight,
      title: 'Account profile',
      subtitle: 'This controls your sign-in profile and app language.',
      child: Form(
        key: _accountFormKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if ((_accountError ?? '').trim().isNotEmpty) ...[
              AppAlertBanner(
                title: 'Could not save account profile',
                message: _accountError,
                icon: const Icon(
                  Icons.error_outline_rounded,
                  size: 20,
                  color: Color(0xFFB91C1C),
                ),
                backgroundColor: const Color(0xFFFEE2E2),
                borderColor: const Color(0xFFFECACA),
                titleColor: const Color(0xFFB91C1C),
                messageColor: const Color(0xFF991B1B),
              ),
              const SizedBox(height: 14),
            ],
            AppTextField(
              label: 'Name',
              controller: _nameController,
              hintText: 'Ma Aye',
              prefixIcon: const Icon(
                Icons.person_outline_rounded,
                size: 18,
                color: AppColors.textMid,
              ),
              textInputAction: TextInputAction.next,
              validator: (value) {
                final normalized = value?.trim() ?? '';
                if (normalized.length < 2) {
                  return 'Enter your name';
                }

                return null;
              },
            ),
            const SizedBox(height: 14),
            AppTextField(
              label: 'Email',
              controller: _emailController,
              hintText: 'owner@example.com',
              prefixIcon: const Icon(
                Icons.mail_outline_rounded,
                size: 18,
                color: AppColors.textMid,
              ),
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              validator: (value) {
                final normalized = value?.trim() ?? '';
                if (normalized.isEmpty) {
                  return null;
                }

                final emailPattern = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
                if (!emailPattern.hasMatch(normalized)) {
                  return 'Enter a valid email address';
                }

                return null;
              },
            ),
            const SizedBox(height: 14),
            AppTextField(
              label: 'Phone',
              controller: _phoneController,
              hintText: '09 7812 3456',
              prefixIcon: const Icon(
                Icons.call_outlined,
                size: 18,
                color: AppColors.textMid,
              ),
              keyboardType: TextInputType.phone,
              textInputAction: TextInputAction.done,
              validator: (value) {
                final normalized = value?.trim() ?? '';
                if (normalized.isEmpty) {
                  return null;
                }

                if (normalized.length < 6) {
                  return 'Enter a valid phone number';
                }

                return null;
              },
            ),
            const SizedBox(height: 16),
            Text(
              'App Language',
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: AppColors.textDark,
                fontWeight: FontWeight.w800,
                fontSize: 12,
                letterSpacing: 0.06,
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _LocaleOption(
                    label: 'English',
                    icon: Icons.language_rounded,
                    isSelected: _selectedLocale == 'en',
                    onTap: () => setState(() => _selectedLocale = 'en'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _LocaleOption(
                    label: 'မြန်မာ',
                    icon: Icons.translate_rounded,
                    isSelected: _selectedLocale == 'my',
                    onTap: () => setState(() => _selectedLocale = 'my'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            AppButton(
              text: 'Save Account',
              isLoading: _isSavingAccount,
              onPressed: _isSavingShop ? null : _saveAccount,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShopSection() {
    return _SettingsCard(
      icon: Icons.storefront_outlined,
      iconColor: AppColors.softOrange,
      iconBackgroundColor: AppColors.softOrangeLight,
      title: 'Current shop',
      subtitle: 'Changes here apply only to the currently selected shop.',
      child: Form(
        key: _shopFormKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if ((_shopError ?? '').trim().isNotEmpty) ...[
              AppAlertBanner(
                title: 'Could not save shop settings',
                message: _shopError,
                icon: const Icon(
                  Icons.error_outline_rounded,
                  size: 20,
                  color: Color(0xFFB91C1C),
                ),
                backgroundColor: const Color(0xFFFEE2E2),
                borderColor: const Color(0xFFFECACA),
                titleColor: const Color(0xFFB91C1C),
                messageColor: const Color(0xFF991B1B),
              ),
              const SizedBox(height: 14),
            ],
            AppTextField(
              label: 'Shop Name',
              controller: _shopNameController,
              hintText: 'Ma Aye Shop',
              prefixIcon: const Icon(
                Icons.store_mall_directory_outlined,
                size: 18,
                color: AppColors.textMid,
              ),
              textInputAction: TextInputAction.next,
              validator: (value) {
                final normalized = value?.trim() ?? '';
                if (normalized.length < 2) {
                  return 'Enter a shop name';
                }

                return null;
              },
            ),
            const SizedBox(height: 14),
            AppTextField(
              label: 'Timezone',
              controller: _timezoneController,
              hintText: 'Asia/Yangon',
              prefixIcon: const Icon(
                Icons.schedule_rounded,
                size: 18,
                color: AppColors.textMid,
              ),
              textInputAction: TextInputAction.done,
              validator: (value) {
                final normalized = value?.trim() ?? '';
                if (normalized.isEmpty || !normalized.contains('/')) {
                  return 'Enter a valid IANA timezone';
                }

                return null;
              },
            ),
            const SizedBox(height: 14),
            const AppAlertBanner(
              title: 'Subscription stays with this shop',
              message:
                  'Switching workspace changes only the active shop context. Billing remains one subscription per shop.',
              icon: Icon(
                Icons.info_outline_rounded,
                size: 20,
                color: Color(0xFF0F766E),
              ),
              backgroundColor: Color(0xFFECFEFF),
              borderColor: Color(0xFFA5F3FC),
              titleColor: Color(0xFF0F766E),
              messageColor: Color(0xFF155E75),
            ),
            const SizedBox(height: 18),
            AppButton(
              text: 'Save Shop',
              isLoading: _isSavingShop,
              onPressed: _isSavingAccount ? null : _saveShop,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBillingCard(SettingsBillingOverview billing) {
    return _SettingsCard(
      icon: Icons.receipt_long_outlined,
      iconColor: const Color(0xFFB45309),
      iconBackgroundColor: AppColors.yellowLight,
      title: 'Billing overview',
      subtitle: 'Read-only subscription summary for the active shop.',
      child: Column(
        children: [
          _BillingRow(
            label: 'Plan',
            value: billing.planName ?? 'No active plan',
          ),
          _BillingRow(label: 'Status', value: _formatStatus(billing.status)),
          _BillingRow(
            label: 'Current period',
            value: _formatPeriod(
              startAt: billing.currentPeriodStart,
              endAt: billing.currentPeriodEnd,
            ),
          ),
          _BillingRow(
            label: 'Next due',
            value: billing.nextDueAt == null
                ? '-'
                : DateFormat('MMM d, y').format(billing.nextDueAt!),
          ),
          _BillingRow(
            label: 'Outstanding',
            value:
                '${NumberFormat.decimalPattern().format(billing.outstandingBalance)} MMK',
            isHighlighted: billing.outstandingBalance > 0,
          ),
        ],
      ),
    );
  }

  Future<void> _loadSnapshot({required bool forceRefresh}) async {
    final activeShopId = getIt<AuthBloc>().state.activeShop?.shopId;
    if ((activeShopId ?? '').trim().isEmpty) {
      if (!mounted) {
        return;
      }

      setState(() {
        _isLoading = false;
        _pageError = 'Select a shop before editing profile settings.';
      });
      return;
    }

    if (!forceRefresh &&
        _shopId == activeShopId &&
        (_nameController.text.trim().isNotEmpty ||
            _shopNameController.text.trim().isNotEmpty)) {
      return;
    }

    setState(() {
      _isLoading = true;
      _pageError = null;
    });

    final result = await getIt<FetchSettingsSnapshotUseCase>().call(
      FetchSettingsSnapshotParams(shopId: activeShopId!),
    );

    if (!mounted) {
      return;
    }

    final failure = result.failureOrNull;
    if (failure != null) {
      setState(() {
        _isLoading = false;
        _pageError = failure.message;
      });
      return;
    }

    final snapshot = result.dataOrNull;
    if (snapshot == null) {
      setState(() {
        _isLoading = false;
        _pageError = 'Settings did not return a valid snapshot.';
      });
      return;
    }

    setState(() {
      _applySnapshot(snapshot);
      _isLoading = false;
    });
  }

  Future<void> _saveAccount() async {
    final formState = _accountFormKey.currentState;
    if (formState == null || !formState.validate()) {
      return;
    }

    if ((_shopId ?? '').trim().isEmpty) {
      setState(() {
        _accountError = 'Select a shop before saving account changes.';
      });
      return;
    }

    setState(() {
      _isSavingAccount = true;
      _accountError = null;
    });

    final result = await getIt<UpdateSettingsAccountUseCase>().call(
      UpdateSettingsAccountParams(
        shopId: _shopId!,
        draft: SettingsAccountDraft(
          name: _nameController.text.trim(),
          email: _normalizeOptional(_emailController.text),
          phone: _normalizeOptional(_phoneController.text),
          locale: _selectedLocale,
        ),
      ),
    );

    if (!mounted) {
      return;
    }

    final failure = result.failureOrNull;
    if (failure != null) {
      setState(() {
        _isSavingAccount = false;
        _accountError = failure.message;
      });
      return;
    }

    final snapshot = result.dataOrNull;
    if (snapshot == null) {
      setState(() {
        _isSavingAccount = false;
        _accountError = 'Account update did not return fresh settings data.';
      });
      return;
    }

    await getIt<AppLocaleController>().setLocaleCode(snapshot.account.locale);
    if (!mounted) {
      return;
    }
    getIt<AuthBloc>().add(const AuthSessionRefreshRequested());
    getIt<SettingsBloc>().add(
      SettingsStarted(shopId: snapshot.shop.id, forceRefresh: true),
    );

    setState(() {
      _applySnapshot(snapshot);
      _isSavingAccount = false;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Account profile updated.'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _saveShop() async {
    final formState = _shopFormKey.currentState;
    if (formState == null || !formState.validate()) {
      return;
    }

    if ((_shopId ?? '').trim().isEmpty) {
      setState(() {
        _shopError = 'Select a shop before saving shop changes.';
      });
      return;
    }

    setState(() {
      _isSavingShop = true;
      _shopError = null;
    });

    final result = await getIt<UpdateSettingsShopProfileUseCase>().call(
      UpdateSettingsShopProfileParams(
        shopId: _shopId!,
        draft: SettingsShopProfileDraft(
          name: _shopNameController.text.trim(),
          timezone: _timezoneController.text.trim(),
        ),
      ),
    );

    if (!mounted) {
      return;
    }

    final failure = result.failureOrNull;
    if (failure != null) {
      setState(() {
        _isSavingShop = false;
        _shopError = failure.message;
      });
      return;
    }

    final snapshot = result.dataOrNull;
    if (snapshot == null) {
      setState(() {
        _isSavingShop = false;
        _shopError = 'Shop update did not return fresh settings data.';
      });
      return;
    }

    getIt<AuthBloc>().add(const AuthSessionRefreshRequested());
    getIt<SettingsBloc>().add(
      SettingsStarted(shopId: snapshot.shop.id, forceRefresh: true),
    );

    setState(() {
      _applySnapshot(snapshot);
      _isSavingShop = false;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Shop settings updated.'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _applySnapshot(SettingsSnapshot snapshot) {
    _shopId = snapshot.shop.id;
    _billing = snapshot.billing;
    _selectedLocale = snapshot.account.locale;
    _nameController.text = snapshot.account.name;
    _emailController.text = snapshot.account.email ?? '';
    _phoneController.text = snapshot.account.phone ?? '';
    _shopNameController.text = snapshot.shop.name;
    _timezoneController.text = snapshot.shop.timezone;
    _pageError = null;
    _accountError = null;
    _shopError = null;
  }

  String? _normalizeOptional(String value) {
    final normalized = value.trim();
    if (normalized.isEmpty) {
      return null;
    }

    return normalized;
  }

  String _formatStatus(String? value) {
    final normalized = (value ?? '').trim().toLowerCase();
    if (normalized.isEmpty) {
      return '-';
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

  String _formatPeriod({DateTime? startAt, DateTime? endAt}) {
    if (startAt == null && endAt == null) {
      return '-';
    }

    final startText = startAt == null
        ? '?'
        : DateFormat('MMM d, y').format(startAt);
    final endText = endAt == null ? '?' : DateFormat('MMM d, y').format(endAt);
    return '$startText → $endText';
  }
}

class _SettingsCard extends StatelessWidget {
  const _SettingsCard({
    required this.icon,
    required this.iconColor,
    required this.iconBackgroundColor,
    required this.title,
    required this.subtitle,
    required this.child,
  });

  final IconData icon;
  final Color iconColor;
  final Color iconBackgroundColor;
  final String title;
  final String subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: iconBackgroundColor,
                  borderRadius: BorderRadius.circular(14),
                ),
                alignment: Alignment.center,
                child: Icon(icon, size: 20, color: iconColor),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        color: AppColors.textDark,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textLight,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          child,
        ],
      ),
    );
  }
}

class _LocaleOption extends StatelessWidget {
  const _LocaleOption({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.tealLight : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? AppColors.teal : AppColors.border,
            width: 1.5,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 18,
              color: isSelected ? AppColors.teal : AppColors.textMid,
            ),
            const SizedBox(width: 8),
            Flexible(
              child: Text(
                label,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: isSelected ? AppColors.teal : AppColors.textMid,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BillingRow extends StatelessWidget {
  const _BillingRow({
    required this.label,
    required this.value,
    this.isHighlighted = false,
  });

  final String label;
  final String value;
  final bool isHighlighted;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.textLight,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: isHighlighted
                    ? const Color(0xFFB91C1C)
                    : AppColors.textDark,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
