enum CustomersHomeTab { all, vip, topSpenders, newThisWeek }

extension CustomersHomeTabX on CustomersHomeTab {
  String get title {
    return switch (this) {
      CustomersHomeTab.all => 'All',
      CustomersHomeTab.vip => 'VIP',
      CustomersHomeTab.topSpenders => 'Top Spenders',
      CustomersHomeTab.newThisWeek => 'New This Week',
    };
  }
}

const List<CustomersHomeTab> kCustomersHomeTabs = CustomersHomeTab.values;
