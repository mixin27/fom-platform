---
name: dart-and-flutter
description: |
  Comprehensive guidance for Dart and Flutter development. 
  Triggers on: .dart files, pubspec.yaml, flutter, bloc, widget, dart package, mobile app.
  
  Use when user: creates features, implements state management, builds UI components, 
  or manages the modular flutter workspace.
---

# Dart and Flutter Skill

Expert-level development for modern Flutter applications. This skill focuses on maintaining a robust, modular, and performant codebase using Clean Architecture and the BLoC pattern.

## Workflow

### 1. Creating a New Feature
When asked to create a new feature (e.g., "Add a shopping cart feature"), follow this workflow:

1.  **Analyze**: Determine if it should be an internal package or a feature in `lib/features/`.
2.  **Scaffold**: Use Clean Architecture layers:
    - `data/`: Repositories, Data Sources, and DTOs.
    - `domain/`: Entities and Use Cases.
    - `presentation/`: BLoCs, Pages, and Widgets.
    - `di/`: Dependency injection via `get_it`.
3.  **Implement**: Follow the detailed rules in [rules/feature.md](./rules/feature.md).
4.  **Verify**: Run `flutter analyze` to ensure no linting violations.

### 2. State Management (BLoC)
When implementing state, always use `Bloc` (prefer over `Cubit` for complex logic).
- Follow the rules in [rules/bloc.md](./rules/bloc.md).
- Use `equatable` for state comparison.

### 3. UI Development
**DO NOT use raw Material/Cupertino widgets for core UI.**
- Always check `packages/app_ui_kit` first.
- Use `AppButton`, `AppTextField`, etc.
- See individual component rules in [rules/ui-kit.md](./rules/ui-kit.md).

## Critical Rules

### Architecture & Boundaries
- **No Cross-Feature Presentation Imports**: A feature's presentation layer should never import another feature's presentation widgets.
- **Service Locator**: Use `GetIt.I` for DI. Avoid manual constructor injection for global services.
- **Modular Imports**: Use absolute package imports for internal packages (e.g., `package:app_ui_kit/app_ui_kit.dart`).

### Performance
- **Const Constructors**: Use `const` wherever possible.
- **Re-renders**: Use `BlocBuilder`/`BlocSelector` narrowly to minimize expensive rebuilds.
- **Async Safety**: Always handle `Future` errors and use `Loading`/`Error` states in Blocs.

## Quick Reference

| Task | Rule File |
| :--- | :--- |
| Create Feature Structure | [rules/feature.md](./rules/feature.md) |
| Implement State/Events | [rules/bloc.md](./rules/bloc.md) |
| Build UI Components | [rules/ui-kit.md](./rules/ui-kit.md) |
| Workspace / Packages | [rules/monorepo.md](./rules/monorepo.md) |
| Monorepo Scripts / Automation | [rules/scripts.md](./rules/scripts.md) |
| Styling / Themes | [rules/styling.md](./rules/styling.md) |

## Automation & Scripts

The project uses a powerful automation layer in `apps/mobile/scripts/`. **Always favor these scripts** over manual CLI commands for consistency.

### Common Scenarios

- **New Feature**: `./scripts/create_feature.sh --name my_feature`
- **New Package**: `./scripts/create_package.sh --name app_service`
- **Regenerate Code**: `./scripts/codegen_all.sh`
- **Workspace-wide Command**: `./scripts/workspace_exec.sh -- flutter test`

See [rules/scripts.md](./rules/scripts.md) for the full command reference.

Use these commands via `Bash` within the `apps/mobile` directory:

```bash
# Analyze code
flutter analyze

# Generate code (Drift, AutoRoute, etc.)
dart run build_runner build --delete-conflicting-outputs

# Fix common lint issues
dart fix --apply
```
