.PHONY: help pub-get analyze test check format format-check format-changed codegen clean workspace-list install-hooks env-init env-check setup-dev secret-scan deps-outdated deps-upgrade deps-upgrade-major prepare-firebase create-package create-feature create-feature-api

help:
	@echo "Available targets:"
	@echo "  make pub-get        - Resolve dependencies for root + workspace packages"
	@echo "  make analyze        - Run analyze for root + workspace packages"
	@echo "  make test           - Run tests for root + workspace packages"
	@echo "  make check          - Run pub-get + analyze + test"
	@echo "  make format         - Format all Dart files"
	@echo "  make format-check   - Check formatting (CI mode)"
	@echo "  make format-changed - Format changed/untracked Dart files"
	@echo "  make codegen        - Run build_runner where configured"
	@echo "  make clean          - Clean root + workspace packages"
	@echo "  make workspace-list - Print workspace members"
	@echo "  make install-hooks  - Configure repo git hooks (husky pre-push + commit-msg)"
	@echo "  make env-init       - Create .env from template (ENV=development|staging|production)"
	@echo "  make env-check      - Validate env files for LOG_LEVEL (see scripts/check_env.sh)"
	@echo "  make setup-dev      - First-time setup (deps + hooks + env init + codegen)"
	@echo "                        Options: ENV=development|staging|production FORCE_ENV=1 IOS_PODS=1 SKIP_CODEGEN=1 SKIP_ENV_INIT=1"
	@echo "  make secret-scan    - Scan for leaked secrets (set STAGED=1 for staged-only scan)"
	@echo "  make deps-outdated  - Check outdated dependencies across root + workspace packages"
	@echo "                        Options: TRANSITIVE=1 SHOW_ALL=1 PRERELEASES=1 NO_DEV=1"
	@echo "  make deps-upgrade   - Upgrade dependencies across root + workspace packages"
	@echo "                        Options: MAJOR=1 DRY_RUN=1 TIGHTEN=1 SKIP_ROOT=1 SKIP_PACKAGES=1"
	@echo "  make deps-upgrade-major - Shortcut for major upgrades across workspace"
	@echo "  make prepare-firebase - Prepare Firebase native config for a flavor (FLAVOR required)"
	@echo "  make create-package - Create a new workspace package (NAME required)"
	@echo "  make create-feature - Create a feature scaffold (NAME required, supports ENTITY/PRINT_DI/PRINT_ROUTER/NO_TESTS)"
	@echo "  make create-feature-api - Create a feature scaffold (NAME required, uses APIService + Bloc)"

pub-get:
	./scripts/pub_get_all.sh

analyze:
	./scripts/analyze_all.sh

test:
	./scripts/test_all.sh

check:
	./scripts/check_all.sh

format:
	./scripts/format_all.sh

format-check:
	./scripts/format_all.sh --check

format-changed:
	./scripts/format_all.sh --changed

codegen:
	./scripts/codegen_all.sh

clean:
	./scripts/clean_all.sh

workspace-list:
	./scripts/workspace_list.sh

install-hooks:
	./scripts/install_git_hooks.sh

env-init:
	./scripts/env_init.sh $(if $(ENV),--environment $(ENV),) $(if $(FORCE),--force,)

env-check:
	./scripts/check_env.sh

setup-dev:
	./scripts/setup_dev.sh $(if $(ENV),--environment $(ENV),) $(if $(FORCE_ENV),--force-env,) $(if $(SKIP_ENV_INIT),--skip-env-init,) $(if $(SKIP_CODEGEN),--skip-codegen,) $(if $(IOS_PODS),--with-ios-pods,)

secret-scan:
	./scripts/secret_scan.sh $(if $(STAGED),--staged,)

deps-outdated:
	./scripts/deps_outdated.sh $(if $(SKIP_ROOT),--skip-root,) $(if $(SKIP_PACKAGES),--skip-packages,) $(if $(TRANSITIVE),--transitive,) $(if $(SHOW_ALL),--show-all,) $(if $(PRERELEASES),--prereleases,) $(if $(NO_DEV),--no-dev,)

deps-upgrade:
	./scripts/deps_upgrade.sh $(if $(SKIP_ROOT),--skip-root,) $(if $(SKIP_PACKAGES),--skip-packages,) $(if $(MAJOR),--major,) $(if $(DRY_RUN),--dry-run,) $(if $(TIGHTEN),--tighten,)

deps-upgrade-major:
	./scripts/deps_upgrade.sh --major $(if $(DRY_RUN),--dry-run,) $(if $(TIGHTEN),--tighten,) $(if $(SKIP_ROOT),--skip-root,) $(if $(SKIP_PACKAGES),--skip-packages,)

prepare-firebase:
	@test -n "$(FLAVOR)" || (echo "Usage: make prepare-firebase FLAVOR=development|staging|production [PLATFORM=all|android|ios] [REQUIRED=1]" && exit 1)
	./scripts/prepare_firebase.sh --flavor $(FLAVOR) $(if $(PLATFORM),--platform $(PLATFORM),) $(if $(REQUIRED),--required,)

create-package:
	@test -n "$(NAME)" || (echo "Usage: make create-package NAME=app_feature [KIND=dart|flutter]" && exit 1)
	./scripts/create_package.sh --name $(NAME) $(if $(KIND),--kind $(KIND),)

create-feature:
	@test -n "$(NAME)" || (echo "Usage: make create-feature NAME=campaigns [ENTITY=Campaign] [PRINT_DI=1] [PRINT_ROUTER=1] [NO_TESTS=1]" && exit 1)
	./scripts/create_feature.sh --name $(NAME) $(if $(ENTITY),--entity $(ENTITY),) $(if $(PRINT_DI),--print-di-snippet,) $(if $(PRINT_ROUTER),--print-router-snippet,) $(if $(NO_TESTS),--no-tests,)

create-feature-api:
	@test -n "$(NAME)" || (echo "Usage: make create-feature-api NAME=campaigns [ENTITY=Campaign] [PRINT_DI=1] [PRINT_ROUTER=1] [NO_TESTS=1]" && exit 1)
	./scripts/create_feature_api_service.sh --name $(NAME) $(if $(ENTITY),--entity $(ENTITY),) $(if $(PRINT_DI),--print-di-snippet,) $(if $(PRINT_ROUTER),--print-router-snippet,) $(if $(NO_TESTS),--no-tests,)
