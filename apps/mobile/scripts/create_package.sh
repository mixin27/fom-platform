#!/usr/bin/env bash
set -euo pipefail

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/_workspace.sh"

usage() {
  cat <<'USAGE'
Usage:
  ./scripts/create_package.sh --name <snake_case> [options]

Options:
  --name <name>                  Package name (required, snake_case).
  --kind <dart|flutter>          Package kind. Default: dart.
  --description <text>           Package description.
  --skip-workspace-update        Do not update root pubspec workspace members.
  --help, -h                     Show this help.

Examples:
  ./scripts/create_package.sh --name app_analytics
  ./scripts/create_package.sh --name app_widgets --kind flutter
USAGE
}

snake_to_pascal() {
  awk -F '_' '{
    for (i = 1; i <= NF; i++) {
      if (length($i) == 0) {
        continue;
      }
      printf toupper(substr($i, 1, 1)) substr($i, 2)
    }
    printf "\n"
  }' <<<"$1"
}

ensure_workspace_member() {
  local root="$1"
  local package_name="$2"
  local root_pubspec="${root}/pubspec.yaml"
  local entry="  - packages/${package_name}"

  if grep -Eq "^[[:space:]]*-[[:space:]]+packages/${package_name}[[:space:]]*$" "${root_pubspec}"; then
    return 0
  fi

  local last_workspace_line
  last_workspace_line="$(
    awk '
      /^workspace:[[:space:]]*$/ {in_ws=1; next}
      in_ws {
        if ($0 ~ /^[[:space:]]*-[[:space:]]+/) {
          last=NR
          next
        }

        if ($0 ~ /^[^[:space:]]/) {
          in_ws=0
        }
      }
      END {
        if (last > 0) {
          print last
        }
      }
    ' "${root_pubspec}"
  )"

  if [[ -z "${last_workspace_line}" ]]; then
    echo "Failed to locate workspace member list in ${root_pubspec}" >&2
    exit 1
  fi

  local temp_file
  temp_file="$(mktemp)"

  awk -v target="${last_workspace_line}" -v value="${entry}" '
    NR == target {
      print
      print value
      next
    }
    { print }
  ' "${root_pubspec}" > "${temp_file}"

  mv "${temp_file}" "${root_pubspec}"
}

name=""
kind="dart"
description=""
skip_workspace_update=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)
      name="${2:-}"
      shift 2
      ;;
    --kind)
      kind="${2:-}"
      shift 2
      ;;
    --description)
      description="${2:-}"
      shift 2
      ;;
    --skip-workspace-update)
      skip_workspace_update=1
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

if [[ -z "${name}" ]]; then
  echo "Missing required option: --name" >&2
  usage
  exit 1
fi

if [[ ! "${name}" =~ ^[a-z][a-z0-9_]*$ ]]; then
  echo "Invalid package name: ${name}. Use snake_case (letters, numbers, underscore)." >&2
  exit 1
fi

if [[ "${kind}" != "dart" && "${kind}" != "flutter" ]]; then
  echo "Invalid package kind: ${kind}. Use dart or flutter." >&2
  exit 1
fi

if [[ -z "${description}" ]]; then
  description="Reusable ${name} package."
fi

escaped_description="${description//\"/\\\"}"

root="$(workspace_root)"
package_dir="${root}/packages/${name}"

if [[ -e "${package_dir}" ]]; then
  echo "Package already exists: ${package_dir}" >&2
  exit 1
fi

class_name="$(snake_to_pascal "${name}")Service"

mkdir -p "${package_dir}/lib/src" "${package_dir}/test"

if [[ "${kind}" == "flutter" ]]; then
  cat > "${package_dir}/pubspec.yaml" <<EOF
name: ${name}
description: "${escaped_description}"
version: 0.1.0
publish_to: none

resolution: workspace

environment:
  sdk: ^3.11.0

dependencies:
  flutter:
    sdk: flutter

dev_dependencies:
  flutter_lints: ^6.0.0
  flutter_test:
    sdk: flutter
EOF

  cat > "${package_dir}/analysis_options.yaml" <<'EOF'
include: package:flutter_lints/flutter.yaml
EOF

  cat > "${package_dir}/test/${name}_service_test.dart" <<EOF
import 'package:flutter_test/flutter_test.dart';
import 'package:${name}/${name}.dart';

void main() {
  test('${class_name} exposes package name', () {
    const service = ${class_name}();
    expect(service.packageName, '${name}');
  });
}
EOF
else
  cat > "${package_dir}/pubspec.yaml" <<EOF
name: ${name}
description: "${escaped_description}"
version: 0.1.0
publish_to: none

resolution: workspace

environment:
  sdk: ^3.11.0

dependencies: {}

dev_dependencies:
  lints: ^6.0.0
  test: ^1.26.3
EOF

  cat > "${package_dir}/analysis_options.yaml" <<'EOF'
include: package:lints/recommended.yaml
EOF

  cat > "${package_dir}/test/${name}_service_test.dart" <<EOF
import 'package:${name}/${name}.dart';
import 'package:test/test.dart';

void main() {
  test('${class_name} exposes package name', () {
    const service = ${class_name}();
    expect(service.packageName, '${name}');
  });
}
EOF
fi

cat > "${package_dir}/lib/${name}.dart" <<EOF
library;

export 'src/${name}_service.dart';
EOF

cat > "${package_dir}/lib/src/${name}_service.dart" <<EOF
class ${class_name} {
  const ${class_name}();

  String get packageName => '${name}';
}
EOF

cat > "${package_dir}/README.md" <<EOF
# ${name}

${description}
EOF

if [[ ${skip_workspace_update} -eq 0 ]]; then
  ensure_workspace_member "${root}" "${name}"
fi

if command -v dart >/dev/null 2>&1; then
  dart format "${package_dir}/lib" "${package_dir}/test" >/dev/null
fi

echo "Created package: packages/${name}"
if [[ ${skip_workspace_update} -eq 0 ]]; then
  echo "Updated workspace members in pubspec.yaml"
fi
echo
echo "Next steps:"
echo "1. Run: ./scripts/pub_get_all.sh"
echo "2. Add package dependencies where needed."
