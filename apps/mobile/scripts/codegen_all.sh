#!/usr/bin/env bash
set -euo pipefail

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/_workspace.sh"

usage() {
  cat <<'USAGE'
Usage:
  ./scripts/codegen_all.sh [--no-delete-conflicting-outputs]
USAGE
}

delete_outputs=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-delete-conflicting-outputs)
      delete_outputs=0
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
declare -a build_runner_args=(build)
if [[ ${delete_outputs} -eq 1 ]]; then
  build_runner_args+=(--delete-conflicting-outputs)
fi

if directory_has_build_runner "${root}"; then
  run_in_directory "${root}" dart run build_runner "${build_runner_args[@]}"
fi

while IFS= read -r member; do
  member_dir="${root}/${member}"
  if directory_has_build_runner "${member_dir}"; then
    run_in_directory "${member_dir}" dart run build_runner "${build_runner_args[@]}"
  fi
done < <(workspace_members)
