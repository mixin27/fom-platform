import 'package:app_network/app_network.dart';

import '../../domain/entities/settings_account_draft.dart';
import '../../domain/entities/settings_shop_profile_draft.dart';
import '../models/settings_account_profile_model.dart';
import '../models/settings_billing_overview_model.dart';
import '../models/settings_shop_profile_model.dart';

abstract class SettingsRemoteDataSource {
  Future<SettingsAccountProfileModel> fetchCurrentAccount();

  Future<SettingsShopProfileModel> fetchShopProfile({required String shopId});

  Future<SettingsBillingOverviewModel> fetchBillingOverview({
    required String shopId,
  });

  Future<void> updateCurrentAccount({required SettingsAccountDraft draft});

  Future<void> updateShopProfile({
    required String shopId,
    required SettingsShopProfileDraft draft,
  });
}

class SettingsRemoteDataSourceImpl implements SettingsRemoteDataSource {
  SettingsRemoteDataSourceImpl(this._apiClient);

  final ApiClient _apiClient;

  @override
  Future<SettingsAccountProfileModel> fetchCurrentAccount() async {
    final payload = await _apiClient.getMap('/users/me');
    return SettingsAccountProfileModel.fromJson(payload);
  }

  @override
  Future<SettingsShopProfileModel> fetchShopProfile({
    required String shopId,
  }) async {
    final payload = await _apiClient.getMap('/shops/$shopId');
    return SettingsShopProfileModel.fromJson(payload);
  }

  @override
  Future<SettingsBillingOverviewModel> fetchBillingOverview({
    required String shopId,
  }) async {
    final payload = await _apiClient.getMap('/shops/$shopId/billing');
    return SettingsBillingOverviewModel.fromJson(payload);
  }

  @override
  Future<void> updateCurrentAccount({
    required SettingsAccountDraft draft,
  }) async {
    await _apiClient.patchMap(
      '/users/me',
      data: <String, dynamic>{
        'name': draft.name.trim(),
        'locale': draft.locale.trim(),
        if ((draft.email ?? '').trim().isNotEmpty) 'email': draft.email!.trim(),
        if ((draft.phone ?? '').trim().isNotEmpty) 'phone': draft.phone!.trim(),
      },
    );
  }

  @override
  Future<void> updateShopProfile({
    required String shopId,
    required SettingsShopProfileDraft draft,
  }) async {
    await _apiClient.patchMap(
      '/shops/$shopId',
      data: <String, dynamic>{
        'name': draft.name.trim(),
        'timezone': draft.timezone.trim(),
      },
    );
  }
}
