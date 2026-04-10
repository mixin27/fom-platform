enum OrderStatus {
  newOrder('new'),
  confirmed('confirmed'),
  outForDelivery('out_for_delivery'),
  delivered('delivered'),
  cancelled('cancelled');

  const OrderStatus(this.apiValue);

  final String apiValue;

  bool get isPending {
    return this == OrderStatus.newOrder ||
        this == OrderStatus.confirmed ||
        this == OrderStatus.outForDelivery;
  }

  bool get isActionable {
    return isPending;
  }

  static OrderStatus fromApiValue(String rawValue) {
    switch (rawValue.trim().toLowerCase()) {
      case 'new':
        return OrderStatus.newOrder;
      case 'confirmed':
        return OrderStatus.confirmed;
      case 'out_for_delivery':
        return OrderStatus.outForDelivery;
      case 'delivered':
        return OrderStatus.delivered;
      case 'cancelled':
        return OrderStatus.cancelled;
      default:
        return OrderStatus.newOrder;
    }
  }
}
