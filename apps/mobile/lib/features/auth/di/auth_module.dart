import 'package:app_logger/app_logger.dart';
import 'package:app_network/app_network.dart';
import 'package:app_storage/app_storage.dart';
import 'package:get_it/get_it.dart';

import '../../../app/di/modules/dependency_module.dart';
import '../../../app/di/modules/get_it_extensions.dart';
import '../data/datasources/auth_local_data_source.dart';
import '../data/datasources/auth_remote_data_source.dart';
import '../data/repositories/auth_repository_impl.dart';
import '../domain/repositories/auth_repository.dart';
import '../domain/usecases/login_use_case.dart';
import '../domain/usecases/logout_use_case.dart';
import '../domain/usecases/read_selected_shop_use_case.dart';
import '../domain/usecases/register_use_case.dart';
import '../domain/usecases/restore_auth_session_use_case.dart';
import '../domain/usecases/save_selected_shop_use_case.dart';
import '../presentation/bloc/auth_bloc.dart';

class AuthModule implements DependencyModule {
  const AuthModule();

  @override
  void register(GetIt getIt) {
    getIt
      ..putLazySingletonIfAbsent<AuthLocalDataSource>(
        () => AuthLocalDataSourceImpl(
          tokenStore: getIt<AuthTokenStore>(),
          sharedPreferencesService: getIt<SharedPreferencesService>(),
        ),
      )
      ..putLazySingletonIfAbsent<AuthRemoteDataSource>(
        () => AuthRemoteDataSourceImpl(getIt<ApiClient>()),
      )
      ..putLazySingletonIfAbsent<AuthRepository>(
        () => AuthRepositoryImpl(
          getIt<AuthLocalDataSource>(),
          getIt<AuthRemoteDataSource>(),
          logger: getIt<AppLogger>(),
        ),
      )
      ..putLazySingletonIfAbsent<RestoreAuthSessionUseCase>(
        () => RestoreAuthSessionUseCase(getIt<AuthRepository>()),
      )
      ..putLazySingletonIfAbsent<LoginUseCase>(
        () => LoginUseCase(getIt<AuthRepository>()),
      )
      ..putLazySingletonIfAbsent<RegisterUseCase>(
        () => RegisterUseCase(getIt<AuthRepository>()),
      )
      ..putLazySingletonIfAbsent<LogoutUseCase>(
        () => LogoutUseCase(getIt<AuthRepository>()),
      )
      ..putLazySingletonIfAbsent<ReadSelectedShopUseCase>(
        () => ReadSelectedShopUseCase(getIt<AuthRepository>()),
      )
      ..putLazySingletonIfAbsent<SaveSelectedShopUseCase>(
        () => SaveSelectedShopUseCase(getIt<AuthRepository>()),
      )
      ..putLazySingletonIfAbsent<AuthBloc>(
        () => AuthBloc(
          restoreAuthSessionUseCase: getIt<RestoreAuthSessionUseCase>(),
          loginUseCase: getIt<LoginUseCase>(),
          registerUseCase: getIt<RegisterUseCase>(),
          logoutUseCase: getIt<LogoutUseCase>(),
          readSelectedShopUseCase: getIt<ReadSelectedShopUseCase>(),
          saveSelectedShopUseCase: getIt<SaveSelectedShopUseCase>(),
          logger: getIt<AppLogger>(),
        ),
      );
  }
}
