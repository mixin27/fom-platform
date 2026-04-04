#!/usr/bin/env bash
set -euo pipefail

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/_workspace.sh"

usage() {
  cat <<'USAGE'
Usage:
  ./scripts/format_all.sh [--changed] [--check]

Options:
  --changed   Format only changed and untracked Dart files.
  --check     Do not write changes; exit non-zero if formatting is needed.
USAGE
}

only_changed=0
check_only=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --changed)
      only_changed=1
      shift
      ;;
    --check)
      check_only=1
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

declare -a files

is_ignored_path() {
  local path="$1"
  case "${path}" in
    */.dart_tool/*|*/build/*|*/.symlinks/*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

if [[ ${only_changed} -eq 1 ]]; then
  while IFS= read -r rel_path; do
    [[ -z "${rel_path}" ]] && continue
    abs_path="${root}/${rel_path}"
    if [[ -f "${abs_path}" ]] && ! is_ignored_path "${abs_path}"; then
      files+=("${abs_path}")
    fi
  done < <(git -C "${root}" diff --name-only -- '*.dart')

  while IFS= read -r rel_path; do
    [[ -z "${rel_path}" ]] && continue
    abs_path="${root}/${rel_path}"
    if [[ -f "${abs_path}" ]] && ! is_ignored_path "${abs_path}"; then
      files+=("${abs_path}")
    fi
  done < <(git -C "${root}" ls-files --others --exclude-standard -- '*.dart')
else
  while IFS= read -r abs_path; do
    files+=("${abs_path}")
  done < <(
    find "${root}/lib" "${root}/test" "${root}/packages" \
      \( -type d \( -name .dart_tool -o -name build -o -name .symlinks \) -prune \) -o \
      \( -type f -name '*.dart' -print \) | sort
  )
fi

# De-duplicate while preserving order (bash 3 compatible).
if [[ ${#files[@]} -gt 0 ]]; then
  declare -a unique
  for file in "${files[@]}"; do
    already_seen=0
    for existing in "${unique[@]:-}"; do
      if [[ "${existing}" == "${file}" ]]; then
        already_seen=1
        break
      fi
    done

    if [[ ${already_seen} -eq 0 ]]; then
      unique+=("${file}")
    fi
  done
  files=("${unique[@]}")
fi

if [[ ${#files[@]} -eq 0 ]]; then
  echo "No Dart files to format."
  exit 0
fi

command=(dart format)
if [[ ${check_only} -eq 1 ]]; then
  command+=(--set-exit-if-changed)
fi

"${command[@]}" "${files[@]}"
