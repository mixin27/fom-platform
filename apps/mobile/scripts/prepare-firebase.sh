#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/.." && pwd)"

usage() {
  cat <<'USAGE'
Usage:
  ./scripts/prepare_firebase.sh --flavor <development|staging|production> [options]

Options:
  --platform <all|android|ios>   Which platform config to prepare. Default: all.
  --required                     Exit with non-zero status if required config file is missing.
  --help, -h                     Show this help.

Local secret source locations:
  android/firebase/<flavor>/google-services.json
  ios/firebase/<flavor>/GoogleService-Info.plist

Prepared output locations:
  android/app/src/<flavor>/google-services.json
  (iOS uses ios/firebase/<flavor>/GoogleService-Info.plist directly at build-time)
USAGE
}

flavor=""
platform="all"
required=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --flavor)
      flavor="${2:-}"
      shift 2
      ;;
    --platform)
      platform="${2:-}"
      shift 2
      ;;
    --required)
      required=1
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

case "${flavor}" in
  development|staging|production)
    ;;
  *)
    echo "Invalid or missing --flavor. Use development, staging, or production." >&2
    exit 1
    ;;
esac

case "${platform}" in
  all|android|ios)
    ;;
  *)
    echo "Invalid --platform value: ${platform}. Use all, android, or ios." >&2
    exit 1
    ;;
esac

android_src="${repo_root}/android/firebase/${flavor}/google-services.json"
android_dst="${repo_root}/android/app/src/${flavor}/google-services.json"
ios_src="${repo_root}/ios/firebase/${flavor}/GoogleService-Info.plist"

missing=0

if [[ "${platform}" == "all" || "${platform}" == "android" ]]; then
  if [[ -f "${android_src}" ]]; then
    mkdir -p "$(dirname -- "${android_dst}")"
    cp "${android_src}" "${android_dst}"
    echo "Prepared Android Firebase config: android/app/src/${flavor}/google-services.json"
  else
    echo "Android Firebase config not found: android/firebase/${flavor}/google-services.json"
    missing=1
  fi
fi

if [[ "${platform}" == "all" || "${platform}" == "ios" ]]; then
  if [[ -f "${ios_src}" ]]; then
    echo "Prepared iOS Firebase config source: ios/firebase/${flavor}/GoogleService-Info.plist"
  else
    echo "iOS Firebase config not found: ios/firebase/${flavor}/GoogleService-Info.plist"
    missing=1
  fi
fi

if [[ ${required} -eq 1 && ${missing} -ne 0 ]]; then
  echo "Missing required Firebase config for flavor '${flavor}'." >&2
  exit 1
fi

if [[ ${missing} -ne 0 ]]; then
  echo "Firebase preparation completed with missing files (non-fatal)."
else
  echo "Firebase preparation completed."
fi
