import "package:get_it/get_it.dart";

/// Extensions for Get It Registration X.
extension GetItRegistrationX on GetIt {
  void putSingletonIfAbsent<T extends Object>(T instance) {
    if (isRegistered<T>()) {
      return;
    }

    registerSingleton<T>(instance);
  }

  void putLazySingletonIfAbsent<T extends Object>(FactoryFunc<T> factoryFunc) {
    if (isRegistered<T>()) {
      return;
    }

    registerLazySingleton<T>(factoryFunc);
  }

  void putFactoryIfAbsent<T extends Object>(FactoryFunc<T> factoryFunc) {
    if (isRegistered<T>()) {
      return;
    }

    registerFactory<T>(factoryFunc);
  }
}
