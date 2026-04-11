enum OrderSource {
  manual("manual"),
  messenger("messenger");

  const OrderSource(this.apiValue);

  final String apiValue;

  static OrderSource fromApiValue(String rawValue) {
    switch (rawValue.trim().toLowerCase()) {
      case "messenger":
        return OrderSource.messenger;
      case "manual":
      default:
        return OrderSource.manual;
    }
  }
}
