enum OrdersHomeTab {
  all,
  today,
  pending,
  delivered;

  String get title {
    switch (this) {
      case OrdersHomeTab.all:
        return 'All';
      case OrdersHomeTab.today:
        return 'Today';
      case OrdersHomeTab.pending:
        return 'Pending';
      case OrdersHomeTab.delivered:
        return 'Delivered';
    }
  }
}

const List<OrdersHomeTab> kOrdersHomeTabs = <OrdersHomeTab>[
  OrdersHomeTab.all,
  OrdersHomeTab.today,
  OrdersHomeTab.pending,
  OrdersHomeTab.delivered,
];
