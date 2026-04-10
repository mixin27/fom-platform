# Monorepo Scripts & Automation

The project includes a robust set of shell scripts in `apps/mobile/scripts/` to automate common tasks across the modular workspace.

## Scaffolding

### 1. `create_feature.sh`
Generates a new feature module in `lib/features/` with Clean Architecture layers.
- **Usage**: `./scripts/create_feature.sh --name <snake_case_plural> [options]`
- **Options**:
  - `--name`: Feature folder name (required).
  - `--entity`: Custom entity name (optional).
  - `--no-tests`: Skip test generation.
  - `--print-di-snippet`: Show DI registration instructions.
  - `--print-router-snippet`: Show GoRouter registration snippet.

### 2. `create_package.sh`
Creates a new internal package in `apps/mobile/packages/`.
- **Usage**: `./scripts/create_package.sh --name <snake_case> [options]`
- **Options**:
  - `--name`: Package name (required).
  - `--kind`: `dart` (default) or `flutter`.
  - `--description`: Package description.

## Workspace Commands

### 3. `workspace_exec.sh`
Executes any arbitrary command in every workspace package.
- **Usage**: `./scripts/workspace_exec.sh [--with-root] -- <command> [args...]`
- **Example**: `./scripts/workspace_exec.sh -- flutter pub get`

### 4. `codegen_all.sh`
Runs `build_runner` in every package that has a `build_runner` dependency.
- **Usage**: `./scripts/codegen_all.sh`

### 5. `pub_get_all.sh` / `clean_all.sh`
Runs `flutter pub get` or `flutter clean` across the entire workspace.

## Code Quality & Testing

### 6. `analyze_all.sh` / `format_all.sh`
Runs static analysis or code formatting across all packages.

### 7. `test_all.sh`
Runs all unit and widget tests in the workspace and generates a combined coverage report if needed.

### 8. `check_all.sh`
A "pre-submit" script that runs formatting, analysis, and tests for the whole workspace.

## Dependency Management

### 9. `deps_upgrade.sh` / `deps_outdated.sh`
Upgrades or checks for outdated dependencies across all internal packages simultaneously.

## Environment & Setup

### 10. `setup_dev.sh` / `env_init.sh`
Initializes the developer environment, installs necessary tools, and sets up `.env` files from examples.

### 11. `install_git_hooks.sh`
Configures local git hooks (e.g., pre-commit checks) to ensure code quality before pushing.

---

## Best Practices for Agents
- **Prefer Scripts over Manual CLI**: Always use these scripts instead of running `flutter pub get` or `build_runner` manually in individual directories. They handle workspace consistency automatically.
- **Check Environment First**: Use `./scripts/check_env.sh` before starting heavy tasks to ensure the local environment is correctly configured.
