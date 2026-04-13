abstract final class AppRoutePaths {
  // Onboarding
  static const String splash = '/splash';
  static const String onboarding = '/onboarding';

  // Auth
  static const String auth = '/auth';
  static const String register = '/register';
  static const String authEmail = '/auth/email';
  static const String authOtp = '/auth/otp';
  static const String shopSelection = '/shop-selection';

  // Orders
  static const String orders = '/orders';
  static const String addOrder = '/orders/add';
  static const String orderDetails = '/orders/:id';

  // Customers
  static const String customers = '/customers';
  static const String customerProfile = '/customers/:id';
  static const String customerOrders = '/customers/:id/orders';

  // Reports
  static const String reports = '/reports';

  // Settings
  static const String settings = '/settings';
  static const String editProfile = '/settings/edit-profile';
  static const String settingsExports = '/settings/exports';

  // Global Application Views
  static const String notifications = '/notifications';
  static const String search = '/search';

  // Dev Tools
  static const String devtoolsLogs = '/devtools/logs';
}
