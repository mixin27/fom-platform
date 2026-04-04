#!/usr/bin/env bash
set -euo pipefail

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/_workspace.sh"

usage() {
  cat <<'USAGE'
Usage:
  ./scripts/test_all.sh [--skip-root] [--skip-packages]
USAGE
}

run_root=1
run_packages=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-root)
      run_root=0
      shift
      ;;
    --skip-packages)
      run_packages=0
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

if [[ ${run_root} -eq 1 ]]; then
  run_in_directory "${root}" flutter test
fi

if [[ ${run_packages} -eq 1 ]]; then
  while IFS= read -r member; do
    package_dir="${root}/${member}"
    if package_has_tests "${package_dir}"; then
      run_in_directory "${package_dir}" flutter test
    else
      echo ">>> ${member}: no test files found, skipping"
    fi
  done < <(workspace_members)
fi
