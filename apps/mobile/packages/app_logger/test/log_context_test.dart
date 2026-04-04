import 'package:app_logger/app_logger.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('LogContext', () {
    test('formats label without feature', () {
      const context = LogContext('CampaignRepo');

      expect(context.label, equals('[CampaignRepo]'));
      expect(
        context.format('sync failed'),
        equals('[CampaignRepo] sync failed'),
      );
    });

    test('formats label with feature', () {
      const context = LogContext('Repo', feature: 'Campaign');

      expect(context.label, equals('[Campaign/Repo]'));
      expect(context.format('loaded'), equals('[Campaign/Repo] loaded'));
    });
  });
}
