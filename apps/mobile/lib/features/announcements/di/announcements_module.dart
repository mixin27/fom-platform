import 'package:app_logger/app_logger.dart';
import 'package:app_network/app_network.dart';
import 'package:app_storage/app_storage.dart';
import 'package:get_it/get_it.dart';

import '../../../app/di/modules/dependency_module.dart';
import '../../../app/di/modules/get_it_extensions.dart';
import '../data/datasources/announcements_local_data_source.dart';
import '../data/datasources/announcements_remote_data_source.dart';
import '../data/repositories/announcements_repository_impl.dart';
import '../domain/repositories/announcements_repository.dart';
import '../domain/usecases/dismiss_announcement_use_case.dart';
import '../domain/usecases/fetch_public_announcements_use_case.dart';
import '../domain/usecases/fetch_shop_announcements_use_case.dart';
import '../presentation/bloc/announcement_banner_bloc.dart';

class AnnouncementsModule implements DependencyModule {
  const AnnouncementsModule();

  @override
  void register(GetIt getIt) {
    getIt
      ..putLazySingletonIfAbsent<AnnouncementsRemoteDataSource>(
        () => AnnouncementsRemoteDataSourceImpl(getIt<ApiClient>()),
      )
      ..putLazySingletonIfAbsent<AnnouncementsLocalDataSource>(
        () =>
            AnnouncementsLocalDataSourceImpl(getIt<SharedPreferencesService>()),
      )
      ..putLazySingletonIfAbsent<AnnouncementsRepository>(
        () => AnnouncementsRepositoryImpl(
          getIt<AnnouncementsRemoteDataSource>(),
          getIt<AnnouncementsLocalDataSource>(),
          logger: getIt<AppLogger>(),
        ),
      )
      ..putLazySingletonIfAbsent<FetchPublicAnnouncementsUseCase>(
        () => FetchPublicAnnouncementsUseCase(getIt<AnnouncementsRepository>()),
      )
      ..putLazySingletonIfAbsent<FetchShopAnnouncementsUseCase>(
        () => FetchShopAnnouncementsUseCase(getIt<AnnouncementsRepository>()),
      )
      ..putLazySingletonIfAbsent<DismissAnnouncementUseCase>(
        () => DismissAnnouncementUseCase(getIt<AnnouncementsRepository>()),
      )
      ..putFactoryIfAbsent<AnnouncementBannerBloc>(
        () => AnnouncementBannerBloc(
          fetchPublicAnnouncementsUseCase:
              getIt<FetchPublicAnnouncementsUseCase>(),
          fetchShopAnnouncementsUseCase: getIt<FetchShopAnnouncementsUseCase>(),
          dismissAnnouncementUseCase: getIt<DismissAnnouncementUseCase>(),
          logger: getIt<AppLogger>(),
        ),
      );
  }
}
