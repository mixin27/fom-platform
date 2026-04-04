#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

"${script_dir}/pub_get_all.sh"
"${script_dir}/analyze_all.sh"
"${script_dir}/test_all.sh"
