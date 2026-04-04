#!/usr/bin/env bash
set -euo pipefail

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/_workspace.sh"

usage() {
  cat <<'USAGE'
Usage:
  ./scripts/deps_upgrade.sh [options]

Options:
  --major             Use `--major-versions` for each package.
  --dry-run, -n       Preview dependency resolution changes only.
  --tighten           Also tighten lower bounds to resolved versions.
  --skip-root         Skip root package upgrade.
  --skip-packages     Skip workspace package upgrades.
  --help, -h          Show this help.

Examples:
  ./scripts/deps_upgrade.sh
  ./scripts/deps_upgrade.sh --major
  ./scripts/deps_upgrade.sh --major --dry-run
USAGE
}

run_root=1
run_packages=1
major=0
dry_run=0
tighten=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --major)
      major=1
      shift
      ;;
    --dry-run|-n)
      dry_run=1
      shift
      ;;
    --tighten)
      tighten=1
      shift
      ;;
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

upgrade_args=()
if [[ ${major} -eq 1 ]]; then
  upgrade_args+=(--major-versions)
fi
if [[ ${dry_run} -eq 1 ]]; then
  upgrade_args+=(--dry-run)
fi
if [[ ${tighten} -eq 1 ]]; then
  upgrade_args+=(--tighten)
fi

root="$(workspace_root)"

if [[ ${run_root} -eq 1 ]]; then
  run_in_directory "${root}" flutter pub upgrade "${upgrade_args[@]}"
fi

if [[ ${run_packages} -eq 1 ]]; then
  while IFS= read -r member; do
    run_in_directory "${root}/${member}" flutter pub upgrade "${upgrade_args[@]}"
  done < <(workspace_members)
fi
