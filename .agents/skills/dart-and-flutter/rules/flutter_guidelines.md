# Flutter & Dart Project Guidelines

## 1. Clean Architecture & Layers
Project code in `lib/features/` follows these layers:
- `data/`: Repositories, Data Sources, and Models (DTOs with `fromJson`/`toJson`).
- `domain/`: Entities (clean objects) and Use Cases.
- `presentation/`: BLoCs, Pages, and Widgets.
- `di/`: Dependency injection via `GetIt`.

**Rules**:
- Entities (Domain) must NOT depend on serialization libraries.
- Features communication happens via Domain Repositories.
- NEVER import a presentation widget from another feature.

## 2. State Management (BLoC)
Standard structure: `something_bloc.dart`, `something_event.dart`, `something_state.dart`.
- **Equatable**: ALL States and Events must extend `Equatable`.
- **Naming**: Events = `<Verb><Noun>Event`; States = `<Noun><Status>State`.
- **Immutability**: Always use `copyWith` to copy states.

## 3. Modular Workspace (Monorepo)
Infrastructure code resides in `apps/mobile/packages/` (e.g., `app_ui_kit`, `app_network`).
- **Imports**: Use absolute package imports: `package:app_ui_kit/app_ui_kit.dart`.
- **Boundaries**: Packages must NOT depend on `lib/features/`.

## 4. UI Kit & Design System
**DO NOT use raw Material/Cupertino widgets.** Use `app_ui_kit` components:
- `AppButton` instead of `ElevatedButton`.
- `AppTextField` instead of `TextField`.
- `Gap` instead of `SizedBox` for spacing.
- Use `context.theme.colors` for semantic styling.

## 5. Automation Scripts
Execute from `apps/mobile/`:
- **New Feature**: `./scripts/create_feature.sh --name feature_name`
- **Codegen**: `./scripts/codegen_all.sh`
- **Exec in all**: `./scripts/workspace_exec.sh -- flutter test`
