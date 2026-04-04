#!/usr/bin/env bash
set -euo pipefail

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/_workspace.sh"

usage() {
  cat <<'USAGE'
Usage:
  ./scripts/check_env.sh [--examples|--all]

Options:
  --examples  Check *.example env templates instead of local env files.
  --all       Check both local env files and *.example templates.
  --help, -h  Show this help.

Checks:
  - LOG_LEVEL is present and valid for each flavor env file.

Examples:
  ./scripts/check_env.sh
  ./scripts/check_env.sh --examples
  ./scripts/check_env.sh --all
USAGE
}

mode="env"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --examples)
      mode="examples"
      shift
      ;;
    --all)
      mode="all"
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

root="$(workspace_root)"
fail=0

check_file() {
  local path="$1"
  if [[ ! -f "${path}" ]]; then
    echo "Skipping missing file: ${path}"
    return 0
  fi

  local line
  line="$(grep -E '^LOG_LEVEL=' "${path}" || true)"
  if [[ -z "${line}" ]]; then
    echo "Missing LOG_LEVEL in ${path}" >&2
    fail=1
    return 0
  fi

  local value="${line#LOG_LEVEL=}"
  value="$(echo "${value}" | tr '[:upper:]' '[:lower:]' | xargs)"
  if [[ -z "${value}" ]]; then
    echo "LOG_LEVEL is empty in ${path}" >&2
    fail=1
    return 0
  fi

  case "${value}" in
    verbose|debug|info|warning|error|critical|off|none|disable|disabled|fatal|warn|err|trace)
      ;;
    *)
      echo "LOG_LEVEL has invalid value '${value}' in ${path}" >&2
      fail=1
      ;;
  esac
}

check_set() {
  local suffix="$1"
  check_file "${root}/.env.development${suffix}"
  check_file "${root}/.env.staging${suffix}"
  check_file "${root}/.env.production${suffix}"
}

if [[ "${mode}" == "env" ]]; then
  check_set ""
elif [[ "${mode}" == "examples" ]]; then
  check_set ".example"
else
  check_set ""
  check_set ".example"
fi

if [[ ${fail} -ne 0 ]]; then
  exit 1
fi

echo "Env check passed."
