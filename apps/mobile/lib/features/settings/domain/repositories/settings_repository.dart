import 'package:app_core/app_core.dart';

import '../entities/settings_account_draft.dart';
import '../entities/settings_shop_profile_draft.dart';
import '../entities/settings_snapshot.dart';

abstract class SettingsRepository {
  Future<Result<SettingsSnapshot>> fetchSettingsSnapshot({
    required String shopId,
  });

  Future<Result<SettingsSnapshot>> updateAccountProfile({
    required String shopId,
    required SettingsAccountDraft draft,
  });

  Future<Result<SettingsSnapshot>> updateShopProfile({
    required String shopId,
    required SettingsShopProfileDraft draft,
  });
}
