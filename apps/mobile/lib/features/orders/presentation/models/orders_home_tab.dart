enum OrdersHomeTab {
  all,
  today,
  pending,
  shipping,
  delivered,
  cancelled;

  String get title {
    switch (this) {
      case OrdersHomeTab.all:
        return 'All';
      case OrdersHomeTab.today:
        return 'Today';
      case OrdersHomeTab.pending:
        return 'Pending';
      case OrdersHomeTab.shipping:
        return 'Shipping';
      case OrdersHomeTab.delivered:
        return 'Delivered';
      case OrdersHomeTab.cancelled:
        return 'Cancelled';
    }
  }
}

const List<OrdersHomeTab> kOrdersHomeTabs = <OrdersHomeTab>[
  OrdersHomeTab.all,
  OrdersHomeTab.today,
  OrdersHomeTab.pending,
  OrdersHomeTab.shipping,
  OrdersHomeTab.delivered,
  OrdersHomeTab.cancelled,
];
