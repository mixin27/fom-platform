import 'package:equatable/equatable.dart';

import 'settings_account_profile.dart';
import 'settings_billing_overview.dart';
import 'settings_shop_profile.dart';

class SettingsSnapshot extends Equatable {
  const SettingsSnapshot({
    required this.account,
    required this.shop,
    required this.billing,
  });

  final SettingsAccountProfile account;
  final SettingsShopProfile shop;
  final SettingsBillingOverview billing;

  @override
  List<Object?> get props => <Object?>[account, shop, billing];
}
