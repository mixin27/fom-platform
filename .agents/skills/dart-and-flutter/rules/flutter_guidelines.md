# Flutter & Dart Guidelines

- **Clean Architecture**: `data/` (Repositories/DTOs), `domain/` (Entities/Use Cases), `presentation/` (BLoCs/Widgets). Entities MUST NOT have serialization. No cross-feature presentation imports.
- **BLoC**: Structure: `_bloc`, `_event`, `_state`. Must extend `Equatable`. Use `copyWith` for immutability.
- **Monorepo**: Infrastructure lives in `apps/mobile/packages/`. Use absolute package imports (`package:app_ui_kit/...`). Packages cannot depend on `lib/features/`.
- **UI Kit**: NO raw Material/Cupertino. Use `app_ui_kit` (`AppButton`, `AppTextField`, `Gap`). Use `context.theme.colors` for semantics.
- **Scripts**: Execute from `apps/mobile/`. Use `./scripts/codegen_all.sh` for codegen, `./scripts/workspace_exec.sh` to run across packages, `./scripts/create_feature.sh` for scoping new features.
