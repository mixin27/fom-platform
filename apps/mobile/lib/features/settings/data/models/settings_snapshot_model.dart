import '../../domain/entities/settings_snapshot.dart';
import 'settings_account_profile_model.dart';
import 'settings_billing_overview_model.dart';
import 'settings_shop_profile_model.dart';

class SettingsSnapshotModel extends SettingsSnapshot {
  const SettingsSnapshotModel({
    required super.account,
    required super.shop,
    required super.billing,
  });

  factory SettingsSnapshotModel.create({
    required SettingsAccountProfileModel account,
    required SettingsShopProfileModel shop,
    required SettingsBillingOverviewModel billing,
  }) {
    return SettingsSnapshotModel(
      account: account,
      shop: shop,
      billing: billing,
    );
  }
}
