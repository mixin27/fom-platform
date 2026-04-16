---
name: dart-and-flutter
description: Dart/Flutter, BLoC, Clean Arch rules.
---
# Rules
- **Arch**: Clean Architecture (data, domain, presentation). [See rules](./rules/flutter_guidelines.md#1-clean-architecture--layers).
- **State**: BLoC + Equatable. [See rules](./rules/flutter_guidelines.md#2-state-management-bloc).
- **Repo**: Modular internal packages. [See rules](./rules/flutter_guidelines.md#3-modular-workspace-monorepo).
- **UI**: `app_ui_kit` only, no raw Material widgets. [See rules](./rules/flutter_guidelines.md#4-ui-kit--design-system).
- **Imports**: Absolute (`package:pkg/...`). No cross-feature presentation imports.
- **Code**: Use `const` constructors everywhere.
- **Codegen**: Use `./scripts/codegen_all.sh` instead of manual `build_runner`.
