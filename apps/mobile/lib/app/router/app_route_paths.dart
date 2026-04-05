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
  static const String orderDetails = '/orders/:id';

  // Customers
  static const String customers = '/customers';
  static const String customerProfile = '/customers/:id';

  // Reports
  static const String reports = '/reports';

  // Dev Tools
  static const String devtoolsLogs = '/devtools/logs';
}
