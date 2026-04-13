import "package:app_logger/app_logger.dart";
import "package:app_network/app_network.dart";
import "package:app_realtime/app_realtime.dart";
import "package:fom_mobile/app/di/modules/dependency_module.dart";
import "package:fom_mobile/app/di/modules/get_it_extensions.dart";
import "package:fom_mobile/features/notifications/data/datasources/notifications_remote_data_source.dart";
import "package:fom_mobile/features/notifications/data/repositories/notifications_repository_impl.dart";
import "package:fom_mobile/features/notifications/domain/repositories/notifications_repository.dart";
import "package:fom_mobile/features/notifications/domain/usecases/fetch_notification_preferences_use_case.dart";
import "package:fom_mobile/features/notifications/domain/usecases/fetch_notifications_use_case.dart";
import "package:fom_mobile/features/notifications/domain/usecases/mark_all_notifications_read_use_case.dart";
import "package:fom_mobile/features/notifications/domain/usecases/mark_notification_read_use_case.dart";
import "package:fom_mobile/features/notifications/domain/usecases/update_notification_preferences_use_case.dart";
import "package:fom_mobile/features/notifications/presentation/bloc/notification_preferences_bloc.dart";
import "package:fom_mobile/features/notifications/presentation/bloc/notifications_home_bloc.dart";
import "package:get_it/get_it.dart";

class NotificationsModule implements DependencyModule {
  const NotificationsModule();

  @override
  void register(GetIt getIt) {
    getIt
      ..putLazySingletonIfAbsent<NotificationsRemoteDataSource>(
        () => NotificationsRemoteDataSourceImpl(getIt<ApiClient>()),
      )
      ..putLazySingletonIfAbsent<NotificationsRepository>(
        () => NotificationsRepositoryImpl(
          getIt<NotificationsRemoteDataSource>(),
          logger: getIt<AppLogger>(),
        ),
      )
      ..putLazySingletonIfAbsent<FetchNotificationsUseCase>(
        () => FetchNotificationsUseCase(getIt<NotificationsRepository>()),
      )
      ..putLazySingletonIfAbsent<MarkNotificationReadUseCase>(
        () => MarkNotificationReadUseCase(getIt<NotificationsRepository>()),
      )
      ..putLazySingletonIfAbsent<MarkAllNotificationsReadUseCase>(
        () => MarkAllNotificationsReadUseCase(getIt<NotificationsRepository>()),
      )
      ..putLazySingletonIfAbsent<FetchNotificationPreferencesUseCase>(
        () => FetchNotificationPreferencesUseCase(
          getIt<NotificationsRepository>(),
        ),
      )
      ..putLazySingletonIfAbsent<UpdateNotificationPreferencesUseCase>(
        () => UpdateNotificationPreferencesUseCase(
          getIt<NotificationsRepository>(),
        ),
      )
      ..putLazySingletonIfAbsent<NotificationsHomeBloc>(
        () => NotificationsHomeBloc(
          fetchNotificationsUseCase: getIt<FetchNotificationsUseCase>(),
          markNotificationReadUseCase: getIt<MarkNotificationReadUseCase>(),
          markAllNotificationsReadUseCase:
              getIt<MarkAllNotificationsReadUseCase>(),
          realtimeService: getIt<AppRealtimeService>(),
          logger: getIt<AppLogger>(),
        ),
      )
      ..putLazySingletonIfAbsent<NotificationPreferencesBloc>(
        () => NotificationPreferencesBloc(
          fetchNotificationPreferencesUseCase:
              getIt<FetchNotificationPreferencesUseCase>(),
          updateNotificationPreferencesUseCase:
              getIt<UpdateNotificationPreferencesUseCase>(),
          logger: getIt<AppLogger>(),
        ),
      );
  }
}
