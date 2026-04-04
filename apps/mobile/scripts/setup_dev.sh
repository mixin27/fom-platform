#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/.." && pwd)"

usage() {
  cat <<'USAGE'
Usage:
  ./scripts/setup_dev.sh [options]

Options:
  --environment, -e <development|staging|production>
                    Env template for first-time .env init. Default: development.
  --force-env       Overwrite existing .env when initializing env file.
  --skip-env-init   Skip .env initialization step.
  --skip-codegen    Skip running workspace code generation.
  --with-ios-pods   Run `pod install` in ios/ after workspace setup.
  --help, -h        Show this help.

Examples:
  ./scripts/setup_dev.sh
  ./scripts/setup_dev.sh -e staging
  ./scripts/setup_dev.sh --with-ios-pods
  ./scripts/setup_dev.sh -e production --force-env --with-ios-pods
USAGE
}

environment="development"
force_env=0
skip_env_init=0
skip_codegen=0
with_ios_pods=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --environment|-e)
      environment="${2:-}"
      shift 2
      ;;
    --force-env)
      force_env=1
      shift
      ;;
    --skip-env-init)
      skip_env_init=1
      shift
      ;;
    --skip-codegen)
      skip_codegen=1
      shift
      ;;
    --with-ios-pods)
      with_ios_pods=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

case "${environment}" in
  development|staging|production)
    ;;
  *)
    echo "Invalid environment: ${environment}. Use development, staging, or production." >&2
    exit 1
    ;;
esac

"${script_dir}/pub_get_all.sh"
"${script_dir}/install_git_hooks.sh"

if [[ ${skip_env_init} -eq 0 ]]; then
  if [[ ${force_env} -eq 1 || ! -f "${repo_root}/.env" ]]; then
    env_args=(--environment "${environment}")
    if [[ ${force_env} -eq 1 ]]; then
      env_args+=(--force)
    fi
    "${script_dir}/env_init.sh" "${env_args[@]}"
  else
    echo ".env already exists, skipping env initialization."
  fi
fi

if [[ ${skip_codegen} -eq 0 ]]; then
  "${script_dir}/codegen_all.sh"
fi

if [[ ${with_ios_pods} -eq 1 ]]; then
  if ! command -v pod >/dev/null 2>&1; then
    echo "CocoaPods (pod) is not installed or not in PATH." >&2
    exit 1
  fi

  (
    cd "${repo_root}/ios"
    echo ">>> ios: pod install"
    pod install
  )
fi

echo "Development setup complete."
