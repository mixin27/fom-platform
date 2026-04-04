#!/usr/bin/env bash
set -euo pipefail

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/_workspace.sh"

root="$(workspace_root)"

run_in_directory "${root}" flutter clean

while IFS= read -r member; do
  run_in_directory "${root}/${member}" flutter clean
done < <(workspace_members)
