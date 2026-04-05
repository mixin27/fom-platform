abstract final class AppRoutePaths {
  // Onboarding
  static const String splash = '/splash';
  static const String onboarding = '/onboarding';

  // Auth
  static const String auth = '/auth';
  static const String register = '/register';
  static const String authEmail = '/auth/email';
  static const String authOtp = '/auth/otp';

  // Orders
  static const String orders = '/orders';
  static const String addOrder = '/orders/add';

  // Customers
  static const String customers = '/customers';
  static const String customerProfile = '/customers/:id';

  // Dev Tools
  static const String devtoolsLogs = '/devtools/logs';
}
