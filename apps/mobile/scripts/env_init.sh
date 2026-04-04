#!/usr/bin/env bash
set -euo pipefail

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/_workspace.sh"

usage() {
  cat <<'USAGE'
Usage:
  ./scripts/env_init.sh [--environment development|staging|production] [--force]

Options:
  --environment, -e   Environment template to copy. Default: development
  --force             Overwrite existing .env file.
  --help, -h          Show this help.

Examples:
  ./scripts/env_init.sh
  ./scripts/env_init.sh --environment staging
  ./scripts/env_init.sh -e production --force
USAGE
}

environment="development"
force=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --environment|-e)
      environment="${2:-}"
      shift 2
      ;;
    --force)
      force=1
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

root="$(workspace_root)"
source_template="${root}/.env.${environment}.example"
target_env="${root}/.env"

if [[ ! -f "${source_template}" ]]; then
  echo "Template not found: ${source_template}" >&2
  exit 1
fi

if [[ -f "${target_env}" && ${force} -ne 1 ]]; then
  echo ".env already exists. Use --force to overwrite." >&2
  exit 1
fi

cp "${source_template}" "${target_env}"

echo "Created .env from .env.${environment}.example"
echo "Next: run 'make codegen' after editing .env values."
