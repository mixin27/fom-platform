#!/usr/bin/env bash
set -euo pipefail

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/_workspace.sh"

usage() {
  cat <<'USAGE'
Usage:
  ./scripts/deps_outdated.sh [options]

Options:
  --skip-root         Skip root package scan.
  --skip-packages     Skip workspace package scans.
  --transitive        Include transitive dependencies.
  --show-all          Include dependencies that are already up to date.
  --prereleases       Include pre-release versions.
  --no-dev            Exclude dev dependencies.
  --help, -h          Show this help.

Examples:
  ./scripts/deps_outdated.sh
  ./scripts/deps_outdated.sh --transitive --show-all
  ./scripts/deps_outdated.sh --skip-root
USAGE
}

run_root=1
run_packages=1
include_transitive=0
show_all=0
include_prereleases=0
include_dev=1

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
    --transitive)
      include_transitive=1
      shift
      ;;
    --show-all)
      show_all=1
      shift
      ;;
    --prereleases)
      include_prereleases=1
      shift
      ;;
    --no-dev)
      include_dev=0
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

outdated_args=()
if [[ ${include_transitive} -eq 0 ]]; then
  outdated_args+=(--no-transitive)
fi
if [[ ${show_all} -eq 1 ]]; then
  outdated_args+=(--show-all)
fi
if [[ ${include_prereleases} -eq 1 ]]; then
  outdated_args+=(--prereleases)
fi
if [[ ${include_dev} -eq 0 ]]; then
  outdated_args+=(--no-dev-dependencies)
fi

root="$(workspace_root)"

if [[ ${run_root} -eq 1 ]]; then
  run_in_directory "${root}" flutter pub outdated "${outdated_args[@]}"
fi

if [[ ${run_packages} -eq 1 ]]; then
  while IFS= read -r member; do
    run_in_directory "${root}/${member}" flutter pub outdated "${outdated_args[@]}"
  done < <(workspace_members)
fi
