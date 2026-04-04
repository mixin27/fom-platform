#!/usr/bin/env bash
set -euo pipefail

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/_workspace.sh"

usage() {
  cat <<'USAGE'
Usage:
  ./scripts/workspace_exec.sh [--with-root] -- <command> [args...]

Examples:
  ./scripts/workspace_exec.sh -- flutter pub get
  ./scripts/workspace_exec.sh --with-root -- flutter analyze
  ./scripts/workspace_exec.sh -- dart test
USAGE
}

include_root=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --with-root)
      include_root=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    --)
      shift
      break
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ $# -eq 0 ]]; then
  echo "Missing command." >&2
  usage
  exit 1
fi

command=("$@")
root="$(workspace_root)"

if [[ ${include_root} -eq 1 ]]; then
  run_in_directory "${root}" "${command[@]}"
fi

while IFS= read -r member; do
  run_in_directory "${root}/${member}" "${command[@]}"
done < <(workspace_members)
