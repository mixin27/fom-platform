import "package:app_database/app_database.dart";
import "package:app_logger/app_logger.dart";
import "package:app_network/app_network.dart";
import "package:app_realtime/app_realtime.dart";
import "package:get_it/get_it.dart";

import "../../../app/di/modules/dependency_module.dart";
import "../../../app/di/modules/get_it_extensions.dart";
import "../data/datasources/customers_local_data_source.dart";
import "../data/datasources/customers_remote_data_source.dart";
import "../data/repositories/customers_repository_impl.dart";
import "../domain/repositories/customers_repository.dart";
import "../domain/usecases/create_customer_use_case.dart";
import "../domain/usecases/delete_customer_use_case.dart";
import "../domain/usecases/fetch_customer_orders_use_case.dart";
import "../domain/usecases/refresh_customer_detail_use_case.dart";
import "../domain/usecases/refresh_customers_use_case.dart";
import "../domain/usecases/update_customer_use_case.dart";
import "../domain/usecases/watch_customer_use_case.dart";
import "../domain/usecases/watch_customers_use_case.dart";
import "../presentation/bloc/customer_orders_bloc.dart";
import "../presentation/bloc/customer_profile_bloc.dart";
import "../presentation/bloc/customers_home_bloc.dart";

class CustomersModule implements DependencyModule {
  const CustomersModule();

  @override
  void register(GetIt getIt) {
    getIt
      ..putLazySingletonIfAbsent<CustomersLocalDataSource>(
        () =>
            CustomersLocalDataSourceImpl(getIt<AppDatabase>().customerCacheDao),
      )
      ..putLazySingletonIfAbsent<CustomersRemoteDataSource>(
        () => CustomersRemoteDataSourceImpl(getIt<ApiClient>()),
      )
      ..putLazySingletonIfAbsent<CustomersRepository>(
        () => CustomersRepositoryImpl(
          getIt<CustomersLocalDataSource>(),
          getIt<CustomersRemoteDataSource>(),
          logger: getIt<AppLogger>(),
        ),
      )
      ..putLazySingletonIfAbsent<WatchCustomersUseCase>(
        () => WatchCustomersUseCase(getIt<CustomersRepository>()),
      )
      ..putLazySingletonIfAbsent<WatchCustomerUseCase>(
        () => WatchCustomerUseCase(getIt<CustomersRepository>()),
      )
      ..putLazySingletonIfAbsent<RefreshCustomersUseCase>(
        () => RefreshCustomersUseCase(getIt<CustomersRepository>()),
      )
      ..putLazySingletonIfAbsent<RefreshCustomerDetailUseCase>(
        () => RefreshCustomerDetailUseCase(getIt<CustomersRepository>()),
      )
      ..putLazySingletonIfAbsent<CreateCustomerUseCase>(
        () => CreateCustomerUseCase(getIt<CustomersRepository>()),
      )
      ..putLazySingletonIfAbsent<UpdateCustomerUseCase>(
        () => UpdateCustomerUseCase(getIt<CustomersRepository>()),
      )
      ..putLazySingletonIfAbsent<FetchCustomerOrdersUseCase>(
        () => FetchCustomerOrdersUseCase(getIt<CustomersRepository>()),
      )
      ..putLazySingletonIfAbsent<DeleteCustomerUseCase>(
        () => DeleteCustomerUseCase(getIt<CustomersRepository>()),
      )
      ..putLazySingletonIfAbsent<CustomersHomeBloc>(
        () => CustomersHomeBloc(
          watchCustomersUseCase: getIt<WatchCustomersUseCase>(),
          refreshCustomersUseCase: getIt<RefreshCustomersUseCase>(),
          networkConnectionService: getIt<NetworkConnectionService>(),
          realtimeService: getIt<AppRealtimeService>(),
          logger: getIt<AppLogger>(),
        ),
      )
      ..putFactoryIfAbsent<CustomerProfileBloc>(
        () => CustomerProfileBloc(
          watchCustomerUseCase: getIt<WatchCustomerUseCase>(),
          refreshCustomerDetailUseCase: getIt<RefreshCustomerDetailUseCase>(),
          networkConnectionService: getIt<NetworkConnectionService>(),
          logger: getIt<AppLogger>(),
        ),
      )
      ..putFactoryIfAbsent<CustomerOrdersBloc>(
        () => CustomerOrdersBloc(
          fetchCustomerOrdersUseCase: getIt<FetchCustomerOrdersUseCase>(),
          networkConnectionService: getIt<NetworkConnectionService>(),
          logger: getIt<AppLogger>(),
        ),
      );
  }
}
