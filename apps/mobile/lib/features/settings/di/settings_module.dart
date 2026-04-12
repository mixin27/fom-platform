import 'package:app_logger/app_logger.dart';
import 'package:app_network/app_network.dart';
import 'package:get_it/get_it.dart';

import '../../../app/di/modules/dependency_module.dart';
import '../../../app/di/modules/get_it_extensions.dart';
import '../data/datasources/settings_remote_data_source.dart';
import '../data/repositories/settings_repository_impl.dart';
import '../domain/repositories/settings_repository.dart';
import '../domain/usecases/fetch_settings_snapshot_use_case.dart';
import '../domain/usecases/update_settings_account_use_case.dart';
import '../domain/usecases/update_settings_shop_profile_use_case.dart';
import '../presentation/bloc/settings_bloc.dart';

class SettingsModule implements DependencyModule {
  const SettingsModule();

  @override
  void register(GetIt getIt) {
    getIt
      ..putLazySingletonIfAbsent<SettingsRemoteDataSource>(
        () => SettingsRemoteDataSourceImpl(getIt<ApiClient>()),
      )
      ..putLazySingletonIfAbsent<SettingsRepository>(
        () => SettingsRepositoryImpl(
          getIt<SettingsRemoteDataSource>(),
          logger: getIt<AppLogger>(),
        ),
      )
      ..putLazySingletonIfAbsent<FetchSettingsSnapshotUseCase>(
        () => FetchSettingsSnapshotUseCase(getIt<SettingsRepository>()),
      )
      ..putLazySingletonIfAbsent<UpdateSettingsAccountUseCase>(
        () => UpdateSettingsAccountUseCase(getIt<SettingsRepository>()),
      )
      ..putLazySingletonIfAbsent<UpdateSettingsShopProfileUseCase>(
        () => UpdateSettingsShopProfileUseCase(getIt<SettingsRepository>()),
      )
      ..putLazySingletonIfAbsent<SettingsBloc>(
        () => SettingsBloc(
          fetchSettingsSnapshotUseCase: getIt<FetchSettingsSnapshotUseCase>(),
          logger: getIt<AppLogger>(),
        ),
      );
  }
}
