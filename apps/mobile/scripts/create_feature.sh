#!/usr/bin/env bash
set -euo pipefail

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/_workspace.sh"

usage() {
  cat <<'USAGE'
Usage:
  ./scripts/create_feature.sh --name <snake_case_plural> [options]

Options:
  --name <name>          Feature folder name under lib/features (required).
  --entity <PascalCase>  Domain entity type. Default: feature name in PascalCase.
  --no-tests             Skip test scaffold generation.
  --print-di-snippet     Print DI module import + module list snippet.
  --print-router-snippet Print router/path snippet for app_router.dart and app_route_paths.dart.
  --help, -h             Show this help.

Examples:
  ./scripts/create_feature.sh --name rewards
  ./scripts/create_feature.sh --name demo_feature --print-di-snippet --print-router-snippet
  ./scripts/create_feature.sh --name menu_items --entity MenuItem
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

print_di_registration_snippet() {
  local feature_name="$1"
  local feature_pascal="$2"

  cat <<EOF

Feature DI module created:
lib/features/${feature_name}/di/${feature_name}_module.dart

DI import for lib/app/di/injection_container.dart:
import '../../features/${feature_name}/di/${feature_name}_module.dart';

DI module list entry in configureDependencies(...):
const ${feature_pascal}Module(),
EOF
}

print_router_registration_snippet() {
  local feature_name="$1"
  local feature_pascal="$2"

  cat <<EOF

Route path snippet for lib/app/router/app_route_paths.dart:
  static const String ${feature_name} = '/${feature_name}';

Router imports for lib/app/router/app_router.dart:
import '../../features/${feature_name}/presentation/pages/${feature_name}_page.dart';

Router constants for lib/app/router/app_router.dart:
  static const ${feature_name}Path = AppRoutePaths.${feature_name};

GoRouter snippet (StatefulShellRoute branch style):
StatefulShellBranch(
  routes: [
    GoRoute(
      path: ${feature_name}Path,
      builder: (context, state) => const ${feature_pascal}Page(),
    ),
  ],
),

GoRouter snippet (standalone route style):
GoRoute(
  path: ${feature_name}Path,
  builder: (context, state) => const ${feature_pascal}Page(),
),
EOF
}

feature_name=""
entity_name=""
with_tests=1
print_di_snippet=0
print_router_snippet=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)
      feature_name="${2:-}"
      shift 2
      ;;
    --entity)
      entity_name="${2:-}"
      shift 2
      ;;
    --no-tests)
      with_tests=0
      shift
      ;;
    --print-di-snippet)
      print_di_snippet=1
      shift
      ;;
    --print-router-snippet)
      print_router_snippet=1
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

if [[ -z "${feature_name}" ]]; then
  echo "Missing required option: --name" >&2
  usage
  exit 1
fi

if [[ ! "${feature_name}" =~ ^[a-z][a-z0-9_]*$ ]]; then
  echo "Invalid feature name: ${feature_name}. Use snake_case." >&2
  exit 1
fi

feature_pascal="$(snake_to_pascal "${feature_name}")"
if [[ -z "${entity_name}" ]]; then
  entity_name="${feature_pascal}"
fi

if [[ ! "${entity_name}" =~ ^[A-Z][A-Za-z0-9]*$ ]]; then
  echo "Invalid entity name: ${entity_name}. Use PascalCase." >&2
  exit 1
fi

feature_display="${feature_name//_/ }"

root="$(workspace_root)"
feature_root="${root}/lib/features/${feature_name}"
test_root="${root}/test/features/${feature_name}"

if [[ -e "${feature_root}" ]]; then
  echo "Feature already exists: ${feature_root}" >&2
  exit 1
fi

if [[ ${with_tests} -eq 1 ]] && [[ -e "${test_root}" ]]; then
  echo "Test directory already exists: ${test_root}" >&2
  exit 1
fi

mkdir -p \
  "${feature_root}/data/datasources" \
  "${feature_root}/data/models" \
  "${feature_root}/data/repositories" \
  "${feature_root}/di" \
  "${feature_root}/domain/entities" \
  "${feature_root}/domain/repositories" \
  "${feature_root}/domain/usecases" \
  "${feature_root}/presentation/bloc" \
  "${feature_root}/presentation/pages" \
  "${feature_root}/presentation/widgets"

cat > "${feature_root}/domain/entities/${feature_name}.dart" <<EOF
import 'package:equatable/equatable.dart';

class ${entity_name} extends Equatable {
  const ${entity_name}({
    required this.id,
    required this.title,
  });

  final String id;
  final String title;

  @override
  List<Object?> get props => [id, title];
}
EOF

cat > "${feature_root}/domain/repositories/${feature_name}_repository.dart" <<EOF
import 'package:app_core/app_core.dart';

import '../entities/${feature_name}.dart';

abstract class ${feature_pascal}Repository {
  Future<Result<List<${entity_name}>>> get${feature_pascal}();
}
EOF

cat > "${feature_root}/domain/usecases/get_${feature_name}_use_case.dart" <<EOF
import 'package:app_core/app_core.dart';

import '../entities/${feature_name}.dart';
import '../repositories/${feature_name}_repository.dart';

class Get${feature_pascal}UseCase
    implements UseCase<List<${entity_name}>, NoParams> {
  const Get${feature_pascal}UseCase(this._repository);

  final ${feature_pascal}Repository _repository;

  @override
  Future<Result<List<${entity_name}>>> call(NoParams params) {
    return _repository.get${feature_pascal}();
  }
}
EOF

cat > "${feature_root}/data/models/${feature_name}_model.dart" <<EOF
import '../../domain/entities/${feature_name}.dart';

class ${feature_pascal}Model extends ${entity_name} {
  const ${feature_pascal}Model({
    required super.id,
    required super.title,
  });

  factory ${feature_pascal}Model.fromJson(Map<String, dynamic> json) {
    return ${feature_pascal}Model(
      id: _asString(json['id']),
      title: _asString(json['title']),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'title': title,
    };
  }

  static String _asString(dynamic value) {
    return value?.toString() ?? '';
  }
}
EOF

cat > "${feature_root}/data/datasources/${feature_name}_local_data_source.dart" <<EOF
import '../models/${feature_name}_model.dart';

abstract class ${feature_pascal}LocalDataSource {
  Future<List<${feature_pascal}Model>> get${feature_pascal}();

  Future<void> save${feature_pascal}(List<${feature_pascal}Model> items);
}

class ${feature_pascal}LocalDataSourceImpl implements ${feature_pascal}LocalDataSource {
  final List<${feature_pascal}Model> _cache = <${feature_pascal}Model>[];

  @override
  Future<List<${feature_pascal}Model>> get${feature_pascal}() async {
    return List<${feature_pascal}Model>.unmodifiable(_cache);
  }

  @override
  Future<void> save${feature_pascal}(List<${feature_pascal}Model> items) async {
    _cache
      ..clear()
      ..addAll(items);
  }
}
EOF

cat > "${feature_root}/data/datasources/${feature_name}_remote_data_source.dart" <<EOF
import 'package:app_network/app_network.dart';

import '../models/${feature_name}_model.dart';

abstract class ${feature_pascal}RemoteDataSource {
  Future<List<${feature_pascal}Model>> get${feature_pascal}();
}

class ${feature_pascal}RemoteDataSourceImpl implements ${feature_pascal}RemoteDataSource {
  ${feature_pascal}RemoteDataSourceImpl(this._apiClient);

  final ApiClient _apiClient;

  @override
  Future<List<${feature_pascal}Model>> get${feature_pascal}() async {
    final payload = await _apiClient.getList('/${feature_name}');
    return payload.map(${feature_pascal}Model.fromJson).toList(growable: false);
  }
}
EOF

cat > "${feature_root}/di/${feature_name}_module.dart" <<EOF
import 'package:app_logger/app_logger.dart';
import 'package:app_network/app_network.dart';
import 'package:get_it/get_it.dart';

import '../../../app/di/modules/dependency_module.dart';
import '../../../app/di/modules/get_it_extensions.dart';
import '../data/datasources/${feature_name}_local_data_source.dart';
import '../data/datasources/${feature_name}_remote_data_source.dart';
import '../data/repositories/${feature_name}_repository_impl.dart';
import '../domain/repositories/${feature_name}_repository.dart';
import '../domain/usecases/get_${feature_name}_use_case.dart';
import '../presentation/bloc/${feature_name}_list_bloc.dart';

class ${feature_pascal}Module implements DependencyModule {
  const ${feature_pascal}Module();

  @override
  void register(GetIt getIt) {
    getIt
      ..putLazySingletonIfAbsent<${feature_pascal}LocalDataSource>(
        ${feature_pascal}LocalDataSourceImpl.new,
      )
      ..putLazySingletonIfAbsent<${feature_pascal}RemoteDataSource>(
        () => ${feature_pascal}RemoteDataSourceImpl(getIt<ApiClient>()),
      )
      ..putLazySingletonIfAbsent<${feature_pascal}Repository>(
        () => ${feature_pascal}RepositoryImpl(
          getIt<${feature_pascal}LocalDataSource>(),
          getIt<${feature_pascal}RemoteDataSource>(),
          logger: getIt<AppLogger>(),
        ),
      )
      ..putLazySingletonIfAbsent<Get${feature_pascal}UseCase>(
        () => Get${feature_pascal}UseCase(getIt<${feature_pascal}Repository>()),
      )
      ..putFactoryIfAbsent<${feature_pascal}ListBloc>(
        () => ${feature_pascal}ListBloc(
          getIt<Get${feature_pascal}UseCase>(),
          logger: getIt<AppLogger>(),
        ),
      );
  }
}
EOF

cat > "${feature_root}/data/repositories/${feature_name}_repository_impl.dart" <<EOF
import 'package:app_core/app_core.dart';
import 'package:app_logger/app_logger.dart';

import '../../domain/entities/${feature_name}.dart';
import '../../domain/repositories/${feature_name}_repository.dart';
import '../datasources/${feature_name}_local_data_source.dart';
import '../datasources/${feature_name}_remote_data_source.dart';

class ${feature_pascal}RepositoryImpl
    with LoggerMixin
    implements ${feature_pascal}Repository {
  ${feature_pascal}RepositoryImpl(
    this._localDataSource,
    this._remoteDataSource, {
    AppLogger? logger,
  }) : _logger = logger ?? AppLogger(enabled: false);

  final ${feature_pascal}LocalDataSource _localDataSource;
  final ${feature_pascal}RemoteDataSource _remoteDataSource;
  final AppLogger _logger;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext('${feature_pascal}Repo');

  @override
  Future<Result<List<${entity_name}>>> get${feature_pascal}() async {
    try {
      log.debug('Loading ${feature_display} from local cache');
      final localItems = await _localDataSource.get${feature_pascal}();

      try {
        log.debug('Syncing ${feature_display} from remote source');
        await _syncFromRemote();
        final syncedItems = await _localDataSource.get${feature_pascal}();
        log.info('Loaded \${syncedItems.length} ${feature_display} from synced cache');
        return Result.success(syncedItems);
      } catch (error) {
        if (localItems.isNotEmpty) {
          log.warning(
            'Remote sync failed, fallback to \${localItems.length} cached ${feature_display}',
          );
          return Result.success(localItems);
        }

        log.error('Remote sync failed and no cached ${feature_display}', error: error);
        return Result.failure(FailureMapper.from(error));
      }
    } catch (error) {
      log.error('Failed to load ${feature_display} from cache', error: error);
      return Result.failure(FailureMapper.from(error));
    }
  }

  Future<void> _syncFromRemote() async {
    final remoteItems = await _remoteDataSource.get${feature_pascal}();
    await _localDataSource.save${feature_pascal}(remoteItems);
  }
}
EOF

cat > "${feature_root}/presentation/bloc/${feature_name}_list_event.dart" <<EOF
import 'package:equatable/equatable.dart';

sealed class ${feature_pascal}ListEvent extends Equatable {
  const ${feature_pascal}ListEvent();

  @override
  List<Object?> get props => [];
}

final class ${feature_pascal}ListRequested extends ${feature_pascal}ListEvent {
  const ${feature_pascal}ListRequested();
}
EOF

cat > "${feature_root}/presentation/bloc/${feature_name}_list_state.dart" <<EOF
import 'package:equatable/equatable.dart';

import '../../domain/entities/${feature_name}.dart';

enum ${feature_pascal}ListStatus { initial, loading, success, failure }

class ${feature_pascal}ListState extends Equatable {
  const ${feature_pascal}ListState({
    this.status = ${feature_pascal}ListStatus.initial,
    this.items = const <${entity_name}>[],
    this.errorMessage,
  });

  final ${feature_pascal}ListStatus status;
  final List<${entity_name}> items;
  final String? errorMessage;

  ${feature_pascal}ListState copyWith({
    ${feature_pascal}ListStatus? status,
    List<${entity_name}>? items,
    String? errorMessage,
  }) {
    return ${feature_pascal}ListState(
      status: status ?? this.status,
      items: items ?? this.items,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, items, errorMessage];
}
EOF

cat > "${feature_root}/presentation/bloc/${feature_name}_list_bloc.dart" <<EOF
import 'package:app_core/app_core.dart';
import 'package:app_logger/app_logger.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/usecases/get_${feature_name}_use_case.dart';
import '${feature_name}_list_event.dart';
import '${feature_name}_list_state.dart';

class ${feature_pascal}ListBloc extends ResultBloc<${feature_pascal}ListEvent, ${feature_pascal}ListState>
    with LoggerMixin {
  ${feature_pascal}ListBloc(this._useCase, {AppLogger? logger})
    : _logger = logger ?? AppLogger(enabled: false),
      super(const ${feature_pascal}ListState()) {
    on<${feature_pascal}ListRequested>(_onRequested);
  }

  final Get${feature_pascal}UseCase _useCase;
  final AppLogger _logger;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext('${feature_pascal}Bloc');

  Future<void> _onRequested(
    ${feature_pascal}ListRequested event,
    Emitter<${feature_pascal}ListState> emit,
  ) async {
    log.info('${feature_pascal} list requested');
    await executeResult(
      emit: emit,
      loadingState: state.copyWith(status: ${feature_pascal}ListStatus.loading),
      request: () => _useCase(const NoParams()),
      onFailure: (failure) {
        log.warning('Failed to load ${feature_display}: \${failure.message}');
        return state.copyWith(
          status: ${feature_pascal}ListStatus.failure,
          errorMessage: failure.message,
        );
      },
      onSuccess: (items) {
        log.info('${feature_pascal} list loaded (\${items.length} items)');
        return state.copyWith(
          status: ${feature_pascal}ListStatus.success,
          items: items,
        );
      },
    );
  }
}
EOF

cat > "${feature_root}/presentation/widgets/${feature_name}_card.dart" <<EOF
import 'package:flutter/material.dart';

import '../../domain/entities/${feature_name}.dart';

class ${feature_pascal}Card extends StatelessWidget {
  const ${feature_pascal}Card({
    required this.item,
    this.onTap,
    super.key,
  });

  final ${entity_name} item;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        title: Text(item.title),
        subtitle: Text(item.id),
        onTap: onTap,
      ),
    );
  }
}
EOF

cat > "${feature_root}/presentation/pages/${feature_name}_page.dart" <<EOF
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../app/di/injection_container.dart';
import '../bloc/${feature_name}_list_bloc.dart';
import '../bloc/${feature_name}_list_event.dart';
import '../bloc/${feature_name}_list_state.dart';
import '../widgets/${feature_name}_card.dart';

class ${feature_pascal}Page extends StatelessWidget {
  const ${feature_pascal}Page({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) =>
          getIt<${feature_pascal}ListBloc>()..add(const ${feature_pascal}ListRequested()),
      child: const _${feature_pascal}View(),
    );
  }
}

class _${feature_pascal}View extends StatelessWidget {
  const _${feature_pascal}View();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: BlocBuilder<${feature_pascal}ListBloc, ${feature_pascal}ListState>(
        builder: (context, state) {
          if (state.status == ${feature_pascal}ListStatus.loading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state.status == ${feature_pascal}ListStatus.failure) {
            return Center(
              child: Text(state.errorMessage ?? 'Something went wrong.'),
            );
          }

          if (state.items.isEmpty) {
            return const Center(child: Text('No ${feature_display} available.'));
          }

          return ListView.separated(
            itemCount: state.items.length,
            separatorBuilder: (_, _) => const SizedBox(height: 12),
            itemBuilder: (_, index) {
              final item = state.items[index];

              return ${feature_pascal}Card(item: item);
            },
          );
        },
      ),
    );
  }
}
EOF

if [[ ${with_tests} -eq 1 ]]; then
  mkdir -p \
    "${test_root}/data/repositories" \
    "${test_root}/domain/usecases" \
    "${test_root}/presentation/bloc"

  cat > "${test_root}/domain/usecases/get_${feature_name}_use_case_test.dart" <<EOF
import 'package:app_core/app_core.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexxus_app/features/${feature_name}/domain/entities/${feature_name}.dart';
import 'package:nexxus_app/features/${feature_name}/domain/repositories/${feature_name}_repository.dart';
import 'package:nexxus_app/features/${feature_name}/domain/usecases/get_${feature_name}_use_case.dart';

void main() {
  test('returns repository result', () async {
    final repository = _Fake${feature_pascal}Repository();
    final useCase = Get${feature_pascal}UseCase(repository);

    final result = await useCase(const NoParams());

    expect(result.isSuccess, isTrue);
    expect(result.dataOrNull, hasLength(1));
  });
}

class _Fake${feature_pascal}Repository implements ${feature_pascal}Repository {
  @override
  Future<Result<List<${entity_name}>>> get${feature_pascal}() async {
    return Result.success(
      const <${entity_name}>[
        ${entity_name}(id: 'item-1', title: 'Item 1'),
      ],
    );
  }
}
EOF

  cat > "${test_root}/data/repositories/${feature_name}_repository_impl_test.dart" <<EOF
import 'package:flutter_test/flutter_test.dart';
import 'package:nexxus_app/features/${feature_name}/data/datasources/${feature_name}_local_data_source.dart';
import 'package:nexxus_app/features/${feature_name}/data/datasources/${feature_name}_remote_data_source.dart';
import 'package:nexxus_app/features/${feature_name}/data/models/${feature_name}_model.dart';
import 'package:nexxus_app/features/${feature_name}/data/repositories/${feature_name}_repository_impl.dart';

void main() {
  test('returns local data when remote sync fails', () async {
    final local = _Fake${feature_pascal}LocalDataSource(
      const <${feature_pascal}Model>[
        ${feature_pascal}Model(id: 'local-1', title: 'Local item'),
      ],
    );
    final remote = _Fake${feature_pascal}RemoteDataSource(
      items: const <${feature_pascal}Model>[],
      shouldThrow: true,
    );

    final repository = ${feature_pascal}RepositoryImpl(local, remote);
    final result = await repository.get${feature_pascal}();

    expect(result.isSuccess, isTrue);
    expect(
      result.dataOrNull!.map((item) => item.id),
      equals(<String>['local-1']),
    );
  });

  test('syncs from remote when local cache is empty', () async {
    final local = _Fake${feature_pascal}LocalDataSource(const <${feature_pascal}Model>[]);
    final remote = _Fake${feature_pascal}RemoteDataSource(
      items: const <${feature_pascal}Model>[
        ${feature_pascal}Model(id: 'remote-1', title: 'Remote item'),
      ],
    );

    final repository = ${feature_pascal}RepositoryImpl(local, remote);
    final result = await repository.get${feature_pascal}();

    expect(result.isSuccess, isTrue);
    expect(
      result.dataOrNull!.map((item) => item.id),
      equals(<String>['remote-1']),
    );
  });
}

class _Fake${feature_pascal}LocalDataSource implements ${feature_pascal}LocalDataSource {
  _Fake${feature_pascal}LocalDataSource(this._items);

  List<${feature_pascal}Model> _items;

  @override
  Future<List<${feature_pascal}Model>> get${feature_pascal}() async =>
      List<${feature_pascal}Model>.from(_items);

  @override
  Future<void> save${feature_pascal}(List<${feature_pascal}Model> items) async {
    _items = List<${feature_pascal}Model>.from(items);
  }
}

class _Fake${feature_pascal}RemoteDataSource implements ${feature_pascal}RemoteDataSource {
  _Fake${feature_pascal}RemoteDataSource({
    required this.items,
    this.shouldThrow = false,
  });

  final List<${feature_pascal}Model> items;
  final bool shouldThrow;

  @override
  Future<List<${feature_pascal}Model>> get${feature_pascal}() async {
    if (shouldThrow) {
      throw Exception('Remote failure');
    }

    return items;
  }
}
EOF

  cat > "${test_root}/presentation/bloc/${feature_name}_list_bloc_test.dart" <<EOF
import 'package:app_core/app_core.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexxus_app/features/${feature_name}/domain/entities/${feature_name}.dart';
import 'package:nexxus_app/features/${feature_name}/domain/repositories/${feature_name}_repository.dart';
import 'package:nexxus_app/features/${feature_name}/domain/usecases/get_${feature_name}_use_case.dart';
import 'package:nexxus_app/features/${feature_name}/presentation/bloc/${feature_name}_list_bloc.dart';
import 'package:nexxus_app/features/${feature_name}/presentation/bloc/${feature_name}_list_event.dart';
import 'package:nexxus_app/features/${feature_name}/presentation/bloc/${feature_name}_list_state.dart';

void main() {
  test('${feature_pascal}ListRequested emits loading then success', () async {
    final repository = _Fake${feature_pascal}Repository(
      items: const <${entity_name}>[
        ${entity_name}(id: 'item-1', title: 'Item 1'),
      ],
    );
    final bloc = ${feature_pascal}ListBloc(Get${feature_pascal}UseCase(repository));

    final expectation = expectLater(
      bloc.stream,
      emitsInOrder([
        isA<${feature_pascal}ListState>().having(
          (state) => state.status,
          'status',
          ${feature_pascal}ListStatus.loading,
        ),
        isA<${feature_pascal}ListState>()
            .having(
              (state) => state.status,
              'status',
              ${feature_pascal}ListStatus.success,
            )
            .having((state) => state.items.length, 'items length', 1),
      ]),
    );

    bloc.add(const ${feature_pascal}ListRequested());
    await expectation;
    await bloc.close();
  });

  test('${feature_pascal}ListRequested emits loading then failure', () async {
    final repository = _Fake${feature_pascal}Repository(
      items: const <${entity_name}>[],
      shouldFail: true,
    );
    final bloc = ${feature_pascal}ListBloc(Get${feature_pascal}UseCase(repository));

    final expectation = expectLater(
      bloc.stream,
      emitsInOrder([
        isA<${feature_pascal}ListState>().having(
          (state) => state.status,
          'status',
          ${feature_pascal}ListStatus.loading,
        ),
        isA<${feature_pascal}ListState>().having(
          (state) => state.status,
          'status',
          ${feature_pascal}ListStatus.failure,
        ),
      ]),
    );

    bloc.add(const ${feature_pascal}ListRequested());
    await expectation;
    await bloc.close();
  });
}

class _Fake${feature_pascal}Repository implements ${feature_pascal}Repository {
  _Fake${feature_pascal}Repository({
    required this.items,
    this.shouldFail = false,
  });

  final List<${entity_name}> items;
  final bool shouldFail;

  @override
  Future<Result<List<${entity_name}>>> get${feature_pascal}() async {
    if (shouldFail) {
      return Result.failure(
        const UnexpectedFailure('Failed to load ${feature_display}'),
      );
    }

    return Result.success(items);
  }
}
EOF
fi

if command -v dart >/dev/null 2>&1; then
  if [[ ${with_tests} -eq 1 ]]; then
    dart format "${feature_root}" "${test_root}" >/dev/null
  else
    dart format "${feature_root}" >/dev/null
  fi
fi

echo "Created feature scaffold: lib/features/${feature_name}"
if [[ ${with_tests} -eq 1 ]]; then
  echo "Created test scaffold: test/features/${feature_name}"
fi
echo
echo "Manual wiring checklist:"
echo "1. Import and add ${feature_pascal}Module in lib/app/di/injection_container.dart."
echo "2. Add route/path and page in lib/app/router/app_router.dart and app_route_paths.dart."
echo "3. Replace local data source in-memory cache with Drift implementation."
if [[ ${with_tests} -eq 1 ]]; then
  echo "4. Review generated tests and extend with real cases."
else
  echo "4. Add tests under test/features/${feature_name}/."
fi

if [[ ${print_di_snippet} -eq 1 ]]; then
  print_di_registration_snippet "${feature_name}" "${feature_pascal}"
fi

if [[ ${print_router_snippet} -eq 1 ]]; then
  print_router_registration_snippet "${feature_name}" "${feature_pascal}"
fi
