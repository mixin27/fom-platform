#!/usr/bin/env bash
set -euo pipefail

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/_workspace.sh"

root="$(workspace_root)"

# Workspace-aware dependency resolution from root.
run_in_directory "${root}" flutter pub get

# Also resolve each package directly so package-scoped commands work immediately.
while IFS= read -r member; do
  run_in_directory "${root}/${member}" flutter pub get
done < <(workspace_members)
