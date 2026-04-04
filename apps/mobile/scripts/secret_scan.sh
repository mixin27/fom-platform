#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "${script_dir}/.." && pwd)"
config_path="${repo_root}/.gitleaks.toml"
gitleaks_image="${GITLEAKS_DOCKER_IMAGE:-zricethezav/gitleaks:v8.24.2}"

usage() {
  cat <<'USAGE'
Usage:
  ./scripts/secret_scan.sh [--staged]

Options:
  --staged    Scan only staged git changes (requires local gitleaks binary).
  --help, -h  Show this help.
USAGE
}

scan_staged=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --staged)
      scan_staged=1
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

if [[ ${scan_staged} -eq 1 ]]; then
  if ! command -v gitleaks >/dev/null 2>&1; then
    echo "--staged mode requires gitleaks binary installed locally." >&2
    exit 1
  fi

  gitleaks protect \
    --staged \
    --config "${config_path}" \
    --redact \
    --no-banner
  exit 0
fi

if command -v gitleaks >/dev/null 2>&1; then
  gitleaks detect \
    --source "${repo_root}" \
    --config "${config_path}" \
    --redact \
    --no-banner
  exit 0
fi

if command -v docker >/dev/null 2>&1; then
  if ! docker info >/dev/null 2>&1; then
    echo "docker is installed but daemon is not running." >&2
    echo "Start Docker Desktop (or install gitleaks) and retry." >&2
    exit 1
  fi

  docker run --rm \
    -v "${repo_root}:/repo" \
    "${gitleaks_image}" \
    detect \
    --source=/repo \
    --config=/repo/.gitleaks.toml \
    --redact \
    --no-banner
  exit 0
fi

echo "gitleaks not found. Install local gitleaks or docker to run secret scan." >&2
exit 1
