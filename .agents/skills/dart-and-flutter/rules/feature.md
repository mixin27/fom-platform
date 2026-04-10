# Feature Architecture Rules

Features in this project follow a "Clean Architecture" pattern to ensure testability, maintainability, and clear separation of concerns.

## Directory Structure

Each feature folder in `lib/features/` should follow this template:

```text
feature_name/
├── data/
│   ├── models/           # DTOs, JSON decoders
│   ├── repositories/     # Concrete repository implementations
│   └── datasources/      # Remote (Dio) or Local (Drift) data sources
├── domain/
│   ├── entities/         # Plain Dart objects (the business model)
│   ├── repositories/     # Abstract repository interfaces
│   └── usecases/         # Specific business logic classes
├── presentation/
│   ├── bloc/             # Feature Blocs (event, state, bloc)
│   ├── pages/            # Full-screen widgets
│   └── widgets/          # Feature-specific reusable components
└── di/
    └── feature_name_di.dart # Dependency injection registration
```

## Key Rules

### 1. Data vs Domain Models
- **Entities (Domain)**: Should be "clean" and have no dependency on JSON serialization libraries.
- **Models (Data)**: Should extend or map to Entities. Use them to handle `fromJson`/`toJson` and networking specifics.

### 2. Dependency Injection
Use `GetIt` for all services and repositories.
- Register dependencies in the feature's `di/` folder.
- Favor `lazySingleton` for repositories.
- Use `factory` for Blocs if they require fresh state.

### 3. Feature Communication
- Features communicate via **Domain Repositories** or **Events**.
- Never import a `presentation` widget from another feature directly.

## Incorrect vs Correct

### Incorrect: Fat Repository
```dart
// lib/features/auth/data/repositories/auth_repository.dart
class AuthRepository {
  Future<User> login(String e, String p) async {
    final response = await dio.post('/login', data: {'email': e, 'password': p});
    return User.fromJson(response.data); // Logic mixed with data
  }
}
```

### Correct: Layered Separation
```dart
// lib/features/auth/domain/repositories/auth_repository.dart
abstract class IAuthRepository {
  Future<UserEntity> login(String email, String password);
}

// lib/features/auth/data/repositories/auth_repository_impl.dart
class AuthRepositoryImpl implements IAuthRepository {
  final AuthRemoteDataSource _dataSource;
  
  @override
  Future<UserEntity> login(String email, String password) async {
    final model = await _dataSource.login(email, password);
    return model.toEntity(); // Mapping DTO to Entity
  }
}
```
