#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

workspace_root() {
  printf '%s\n' "${WORKSPACE_ROOT}"
}

workspace_members() {
  awk '
    /^workspace:[[:space:]]*$/ {in_ws=1; next}
    in_ws {
      if ($0 ~ /^[[:space:]]*#/) next
      if ($0 ~ /^[^[:space:]-]/) {in_ws=0; next}
      if ($0 ~ /^[[:space:]]*-[[:space:]]+/) {
        line=$0
        sub(/^[[:space:]]*-[[:space:]]+/, "", line)
        sub(/[[:space:]]+#.*$/, "", line)
        gsub(/[[:space:]]+$/, "", line)
        if (length(line) > 0) {
          print line
        }
      }
    }
  ' "${WORKSPACE_ROOT}/pubspec.yaml"
}

run_in_directory() {
  local directory="$1"
  shift

  local display="${directory#${WORKSPACE_ROOT}/}"
  if [[ "${directory}" == "${WORKSPACE_ROOT}" ]]; then
    display="."
  fi

  echo ">>> ${display}: $*"
  (
    cd "${directory}"
    "$@"
  )
}

package_has_tests() {
  local package_directory="$1"
  if [[ ! -d "${package_directory}/test" ]]; then
    return 1
  fi

  find "${package_directory}/test" -type f -name '*_test.dart' -print -quit | grep -q .
}

directory_has_build_runner() {
  local directory="$1"
  grep -Eq '^[[:space:]]+build_runner:' "${directory}/pubspec.yaml"
}
