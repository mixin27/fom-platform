# app_logger

Reusable app-wide logger built on top of `talker`.

## Includes

- `AppLogger`
- `LogContext`
- `LoggerMixin`
- `ScopedLogger`

## Usage

```dart
import 'package:app_logger/app_logger.dart';

final logger = AppLogger(prefix: '[MyApp]');
logger.info('App started');
logger.error('Request failed', error: exception, stackTrace: stackTrace);
```

```dart
class CampaignRepository with LoggerMixin {
  @override
  final AppLogger logger;

  @override
  LogContext get logContext => const LogContext('CampaignRepo');

  CampaignRepository(this.logger);

  void load() {
    log.info('loading campaigns');
  }
}
```
