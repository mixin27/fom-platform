/// Supported App Environment values.
enum AppEnvironment {
  development("development"),
  staging("staging"),
  production("production");

  const AppEnvironment(this.value);

  final String value;

  static AppEnvironment fromString(String input) {
    switch (input.toLowerCase().trim()) {
      case "dev":
      case "development":
        return AppEnvironment.development;
      case "staging":
      case "stage":
        return AppEnvironment.staging;
      case "prod":
      case "production":
        return AppEnvironment.production;
    }

    return AppEnvironment.production;
  }
}
