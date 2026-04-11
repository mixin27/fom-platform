import "package:app_database/app_database.dart";
import "package:app_logger/app_logger.dart";
import "package:app_network/app_network.dart";
import "package:get_it/get_it.dart";

import "../../../app/di/modules/dependency_module.dart";
import "../../../app/di/modules/get_it_extensions.dart";
import "../data/datasources/orders_local_data_source.dart";
import "../data/datasources/orders_remote_data_source.dart";
import "../data/repositories/orders_repository_impl.dart";
import "../domain/repositories/orders_repository.dart";
import "../domain/usecases/create_order_use_case.dart";
import "../domain/usecases/parse_order_message_use_case.dart";
import "../domain/usecases/refresh_orders_use_case.dart";
import "../domain/usecases/update_order_status_use_case.dart";
import "../domain/usecases/watch_orders_use_case.dart";
import "../presentation/bloc/order_entry_bloc.dart";
import "../presentation/bloc/orders_home_bloc.dart";

class OrdersModule implements DependencyModule {
  const OrdersModule();

  @override
  void register(GetIt getIt) {
    getIt
      ..putLazySingletonIfAbsent<OrdersLocalDataSource>(
        () => OrdersLocalDataSourceImpl(getIt<AppDatabase>().orderCacheDao),
      )
      ..putLazySingletonIfAbsent<OrdersRemoteDataSource>(
        () => OrdersRemoteDataSourceImpl(getIt<ApiClient>()),
      )
      ..putLazySingletonIfAbsent<OrdersRepository>(
        () => OrdersRepositoryImpl(
          getIt<OrdersLocalDataSource>(),
          getIt<OrdersRemoteDataSource>(),
          logger: getIt<AppLogger>(),
        ),
      )
      ..putLazySingletonIfAbsent<WatchOrdersUseCase>(
        () => WatchOrdersUseCase(getIt<OrdersRepository>()),
      )
      ..putLazySingletonIfAbsent<RefreshOrdersUseCase>(
        () => RefreshOrdersUseCase(getIt<OrdersRepository>()),
      )
      ..putLazySingletonIfAbsent<ParseOrderMessageUseCase>(
        () => ParseOrderMessageUseCase(getIt<OrdersRepository>()),
      )
      ..putLazySingletonIfAbsent<CreateOrderUseCase>(
        () => CreateOrderUseCase(getIt<OrdersRepository>()),
      )
      ..putLazySingletonIfAbsent<UpdateOrderStatusUseCase>(
        () => UpdateOrderStatusUseCase(getIt<OrdersRepository>()),
      )
      ..putLazySingletonIfAbsent<OrdersHomeBloc>(
        () => OrdersHomeBloc(
          watchOrdersUseCase: getIt<WatchOrdersUseCase>(),
          refreshOrdersUseCase: getIt<RefreshOrdersUseCase>(),
          updateOrderStatusUseCase: getIt<UpdateOrderStatusUseCase>(),
          networkConnectionService: getIt<NetworkConnectionService>(),
          logger: getIt<AppLogger>(),
        ),
      )
      ..putFactoryIfAbsent<OrderEntryBloc>(
        () => OrderEntryBloc(
          parseOrderMessageUseCase: getIt<ParseOrderMessageUseCase>(),
          createOrderUseCase: getIt<CreateOrderUseCase>(),
          logger: getIt<AppLogger>(),
        ),
      );
  }
}
