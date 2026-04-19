import 'dart:convert';

import 'package:app_storage/app_storage.dart';

abstract class AnnouncementsLocalDataSource {
  Future<Set<String>> readDismissedIds({required String scope});

  Future<void> dismissAnnouncement({
    required String scope,
    required String announcementId,
  });
}

class AnnouncementsLocalDataSourceImpl implements AnnouncementsLocalDataSource {
  AnnouncementsLocalDataSourceImpl(this._sharedPreferencesService);

  final SharedPreferencesService _sharedPreferencesService;

  static String _keyForScope(String scope) {
    return 'announcements.dismissed.${scope.trim()}';
  }

  @override
  Future<Set<String>> readDismissedIds({required String scope}) async {
    final rawValue = _sharedPreferencesService.getString(_keyForScope(scope));
    if ((rawValue ?? '').trim().isEmpty) {
      return <String>{};
    }

    try {
      final decoded = jsonDecode(rawValue!);
      if (decoded is! List) {
        return <String>{};
      }

      return decoded
          .map((dynamic item) => item.toString().trim())
          .where((item) => item.isNotEmpty)
          .toSet();
    } catch (_) {
      return <String>{};
    }
  }

  @override
  Future<void> dismissAnnouncement({
    required String scope,
    required String announcementId,
  }) async {
    final normalizedId = announcementId.trim();
    if (normalizedId.isEmpty) {
      return;
    }

    final dismissedIds = await readDismissedIds(scope: scope);
    dismissedIds.add(normalizedId);
    await _sharedPreferencesService.setString(
      _keyForScope(scope),
      jsonEncode(dismissedIds.toList(growable: false)),
    );
  }
}
