import "package:app_database/app_database.dart";
import "package:app_logger/app_logger.dart";
import "package:app_network/app_network.dart";
import "package:get_it/get_it.dart";

import "../../../app/di/modules/dependency_module.dart";
import "../../../app/di/modules/get_it_extensions.dart";
import "../data/datasources/reports_local_data_source.dart";
import "../data/datasources/reports_remote_data_source.dart";
import "../data/repositories/reports_repository_impl.dart";
import "../domain/repositories/reports_repository.dart";
import "../domain/usecases/refresh_report_use_case.dart";
import "../domain/usecases/watch_report_use_case.dart";
import "../presentation/bloc/reports_home_bloc.dart";

class ReportsModule implements DependencyModule {
  const ReportsModule();

  @override
  void register(GetIt getIt) {
    getIt
      ..putLazySingletonIfAbsent<ReportsLocalDataSource>(
        () => ReportsLocalDataSourceImpl(getIt<AppDatabase>().reportCacheDao),
      )
      ..putLazySingletonIfAbsent<ReportsRemoteDataSource>(
        () => ReportsRemoteDataSourceImpl(getIt<ApiClient>()),
      )
      ..putLazySingletonIfAbsent<ReportsRepository>(
        () => ReportsRepositoryImpl(
          getIt<ReportsLocalDataSource>(),
          getIt<ReportsRemoteDataSource>(),
          logger: getIt<AppLogger>(),
        ),
      )
      ..putLazySingletonIfAbsent<WatchReportUseCase>(
        () => WatchReportUseCase(getIt<ReportsRepository>()),
      )
      ..putLazySingletonIfAbsent<RefreshReportUseCase>(
        () => RefreshReportUseCase(getIt<ReportsRepository>()),
      )
      ..putLazySingletonIfAbsent<ReportsHomeBloc>(
        () => ReportsHomeBloc(
          watchReportUseCase: getIt<WatchReportUseCase>(),
          refreshReportUseCase: getIt<RefreshReportUseCase>(),
          networkConnectionService: getIt<NetworkConnectionService>(),
          logger: getIt<AppLogger>(),
        ),
      );
  }
}
