---
name: dart-and-flutter
description: |
  Dart and Flutter development guidance. Triggers on: flutter, dart, pubspec.yaml, bloc, or mobile app features.
  
  Use when user: creates features, builds UI, or manages state in the Flutter app.
---

# Dart and Flutter Skill

Expert-level Flutter development using Clean Architecture and BLoC.

## Quick Reference

| Task | Rule |
| :--- | :--- |
| **Architecture** | Follow Clean Architecture (data, domain, presentation). See [guidelines](./rules/flutter_guidelines.md#1-clean-architecture--layers). |
| **State** | Use BLoC + Equatable. See [guidelines](./rules/flutter_guidelines.md#2-state-management-bloc). |
| **Workspace** | Use internal packages for cross-cutting concerns. See [guidelines](./rules/flutter_guidelines.md#3-modular-workspace-monorepo). |
| **UI** | Use \`app_ui_kit\` components. No raw Material widgets. See [guidelines](./rules/flutter_guidelines.md#4-ui-kit--design-system). |
| **Scripts** | Use \`./scripts/\` for automation. See [guidelines](./rules/flutter_guidelines.md#5-automation-scripts). |

## Core Principles

1.  **Strict Boundaries**: No cross-feature presentation imports.
2.  **Absolute Imports**: Always use \`package:pkg_name/...\` for internal packages.
3.  **Const Everything**: Use \`const\` constructors wherever possible.
4.  **Codegen**: Favor \`./scripts/codegen_all.sh\` for build_runner tasks.
