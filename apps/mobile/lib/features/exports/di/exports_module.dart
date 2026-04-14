import 'package:app_logger/app_logger.dart';
import 'package:app_network/app_network.dart';
import 'package:get_it/get_it.dart';

import '../../../app/di/modules/dependency_module.dart';
import '../../../app/di/modules/get_it_extensions.dart';
import '../data/datasources/shop_exports_local_data_source.dart';
import '../data/datasources/shop_exports_remote_data_source.dart';
import '../data/repositories/shop_exports_repository_impl.dart';
import '../domain/repositories/shop_exports_repository.dart';
import '../domain/usecases/import_shop_orders_use_case.dart';
import '../domain/usecases/save_shop_dataset_use_case.dart';
import '../domain/usecases/share_shop_dataset_use_case.dart';
import '../presentation/bloc/shop_export_bloc.dart';

class ExportsModule implements DependencyModule {
  const ExportsModule();

  @override
  void register(GetIt getIt) {
    getIt
      ..putLazySingletonIfAbsent<ShopExportsRemoteDataSource>(
        () => ShopExportsRemoteDataSourceImpl(getIt<ApiClient>()),
      )
      ..putLazySingletonIfAbsent<ShopExportsLocalDataSource>(
        () => ShopExportsLocalDataSourceImpl(),
      )
      ..putLazySingletonIfAbsent<ShopExportsRepository>(
        () => ShopExportsRepositoryImpl(
          getIt<ShopExportsRemoteDataSource>(),
          getIt<ShopExportsLocalDataSource>(),
          logger: getIt<AppLogger>(),
        ),
      )
      ..putLazySingletonIfAbsent<SaveShopDatasetUseCase>(
        () => SaveShopDatasetUseCase(getIt<ShopExportsRepository>()),
      )
      ..putLazySingletonIfAbsent<ImportShopOrdersUseCase>(
        () => ImportShopOrdersUseCase(getIt<ShopExportsRepository>()),
      )
      ..putLazySingletonIfAbsent<ShareShopDatasetUseCase>(
        () => ShareShopDatasetUseCase(getIt<ShopExportsRepository>()),
      )
      ..putFactoryIfAbsent<ShopExportBloc>(
        () => ShopExportBloc(
          importShopOrdersUseCase: getIt<ImportShopOrdersUseCase>(),
          saveShopDatasetUseCase: getIt<SaveShopDatasetUseCase>(),
          shareShopDatasetUseCase: getIt<ShareShopDatasetUseCase>(),
          logger: getIt<AppLogger>(),
        ),
      );
  }
}
