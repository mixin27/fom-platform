# Modular Workspace & Monorepo Rules

This project uses a modular "Workspace" structure within `apps/mobile/packages` to separate infrastructure concerns from feature code.

## Package Structure

The `apps/mobile/packages` directory contains domain-agnostic packages:
- `app_core`: Common utilities, extensions, and base classes.
- `app_ui_kit`: Design system and reusable widgets.
- `app_network`: Dio configuration and networking interceptors.
- `app_database`: Drift database definitions.
- `app_logger`: Centralized logging service (Talker).

## Workspace Management

The root `apps/mobile/pubspec.yaml` uses the `workspace` key to manage these packages.

### 1. Adding a New Package
To add a new internal package:
1. Create the directory in `apps/mobile/packages/<name>`.
2. Add a `pubspec.yaml` to the new package.
3. List the new package in the root `pubspec.yaml` under `workspace`.
4. Run `flutter pub get` in the root.

### 2. Dependency Rules
- **Infrastructure to Core**: Infrastructure packages (network, storage) can depend on `app_core`.
- **Features to Packages**: Features in `lib/features` can depend on any package in `packages/`.
- **No Package to Feature Dependency**: Packages in `packages/` should NEVER depend on code in `lib/features/`.

## Import Standards

Always use **Absolute Package Imports** for internal workspace packages.

### Correct:
```dart
import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:app_core/app_core.dart';
```

### Incorrect:
```dart
import '../../packages/app_ui_kit/lib/app_ui_kit.dart'; // Relative path
import 'package:fom_mobile/packages/app_ui_kit/lib/app_ui_kit.dart'; // Deep import
```

## Pubspec Consistency

Keep the `environment` SDK version consistent across all workspace packages to avoid dependency resolution conflicts.

```yaml
environment:
  sdk: ^3.11.4
```
