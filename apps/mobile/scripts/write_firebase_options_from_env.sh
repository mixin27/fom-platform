#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/.." && pwd)"

decode_base64_to_file() {
  local encoded_value="$1"
  local target_path="$2"

  mkdir -p "$(dirname -- "${target_path}")"

  if base64 --help 2>&1 | grep -q -- '--decode'; then
    printf '%s' "${encoded_value}" | base64 --decode >"${target_path}"
  else
    printf '%s' "${encoded_value}" | base64 -D >"${target_path}"
  fi
}

write_from_env() {
  local env_name="$1"
  local relative_target="$2"
  local value="${!env_name:-}"

  if [[ -z "${value}" ]]; then
    echo "Missing required Firebase options variable: ${env_name}" >&2
    return 1
  fi

  decode_base64_to_file "${value}" "${repo_root}/${relative_target}"
  echo "Wrote ${relative_target} from ${env_name}"
}

write_from_env "MOBILE_FIREBASE_OPTIONS_DEV_B64" "lib/firebase_options_dev.dart"
write_from_env "MOBILE_FIREBASE_OPTIONS_STG_B64" "lib/firebase_options_stg.dart"
write_from_env "MOBILE_FIREBASE_OPTIONS_PROD_B64" "lib/firebase_options_prod.dart"

echo "Firebase options files are ready."
