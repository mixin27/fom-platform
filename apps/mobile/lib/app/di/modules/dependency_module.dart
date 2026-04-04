import "dart:async";

import "package:get_it/get_it.dart";

abstract interface class DependencyModule {
  FutureOr<void> register(GetIt getIt);
}
