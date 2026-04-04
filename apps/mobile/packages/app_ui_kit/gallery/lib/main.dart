import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';

void main() {
  runApp(const GalleryApp());
}

class GalleryApp extends StatelessWidget {
  const GalleryApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'App UI Kit Gallery',
      theme: AppTheme.light,
      debugShowCheckedModeBanner: false,
      home: const GalleryHomePage(),
    );
  }
}

class GalleryHomePage extends StatefulWidget {
  const GalleryHomePage({super.key});

  @override
  State<GalleryHomePage> createState() => _GalleryHomePageState();
}

class _GalleryHomePageState extends State<GalleryHomePage> {
  int _selectedFilterIndex = 0;
  int _selectedStatusIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('App UI Kit Gallery'),
        actions: [
          IconButton(
            icon: const Icon(Icons.home_outlined),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => const ExampleHomeScreen(),
                ),
              );
            },
            tooltip: 'Example Home Screen',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _Section(
              title: 'Typography',
              children: [
                Text(
                  'Display Large',
                  style: Theme.of(context).textTheme.displayLarge,
                ),
                Text(
                  'Headline Medium',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                Text(
                  'Title Large',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                Text(
                  'Body Large',
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                Text(
                  'Label Small',
                  style: Theme.of(context).textTheme.labelSmall,
                ),
                const SizedBox(height: 10),
                const Text(
                  'မြန်မာစာ နမူနာ (Noto Sans Myanmar)',
                  style: TextStyle(
                    fontFamily: 'NotoSansMyanmar',
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            _Section(
              title: 'Colors',
              children: [
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    const _ColorBox(
                      color: AppColors.softOrange,
                      name: 'Orange',
                    ),
                    const _ColorBox(color: AppColors.teal, name: 'Teal'),
                    const _ColorBox(color: AppColors.green, name: 'Green'),
                    const _ColorBox(color: AppColors.yellow, name: 'Yellow'),
                    const _ColorBox(color: AppColors.textDark, name: 'Dark'),
                    const _ColorBox(color: AppColors.border, name: 'Border'),
                  ],
                ),
              ],
            ),
            _Section(
              title: 'Form Blocks',
              children: [
                const AppSectionHeader(
                  icon: Icon(Icons.person_outline),
                  title: 'Customer Info',
                  subtitle: 'ဖောက်သည်အချက်အလက်',
                ),
                const SizedBox(height: 12),
                AppPasteHelper(onTap: () {}),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: AppSelectionOption(
                        icon: const Icon(Icons.new_releases_outlined),
                        label: 'New',
                        subtitle: 'အသစ်',
                        isSelected: _selectedStatusIndex == 0,
                        onTap: () => setState(() => _selectedStatusIndex = 0),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: AppSelectionOption(
                        icon: const Icon(Icons.check_circle_outline),
                        label: 'Confirmed',
                        subtitle: 'အတည်ပြု',
                        isSelected: _selectedStatusIndex == 1,
                        onTap: () => setState(() => _selectedStatusIndex = 1),
                        selectedBorderColor: AppColors.teal,
                        selectedBackgroundColor: AppColors.tealLight,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: AppSelectionOption(
                        icon: const Icon(Icons.local_shipping_outlined),
                        label: 'Shipping',
                        subtitle: 'သွားပြီ',
                        isSelected: _selectedStatusIndex == 2,
                        onTap: () => setState(() => _selectedStatusIndex = 2),
                        selectedBorderColor: AppColors.yellow,
                        selectedBackgroundColor: AppColors.yellowLight,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            _Section(
              title: 'Alerts & Banners',
              children: const [
                AppAlertBanner(
                  title: '8 orders need your attention',
                  message: 'Confirm or update status now',
                ),
              ],
            ),
            _Section(
              title: 'Cards & Lists',
              children: [
                AppOrderCard(
                  customerName: 'Daw Khin Myat',
                  orderId: '#ORD-0241',
                  productName: 'Silk Longyi Set × 2',
                  price: '45,000',
                  status: AppStatusVariant.newOrder,
                  phone: '09 7812 3456',
                  township: 'Sanchaung',
                  time: '10:32 AM',
                  onTap: () {},
                  onPrimaryAction: () {},
                  primaryActionLabel: 'Confirm',
                  onSecondaryAction: () {},
                  secondaryActionLabel: 'Call',
                ),
              ],
            ),
            _Section(
              title: 'Empty States',
              children: [
                AppEmptyState(
                  icon: const Icon(Icons.search_off_outlined),
                  title: 'No orders found',
                  message: 'Try adjusting your filters or search query',
                  action: AppButton(
                    text: 'Clear All Filters',
                    onPressed: () {},
                    variant: AppButtonVariant.secondary,
                  ),
                ),
              ],
            ),
            _Section(
              title: 'Navigation',
              children: [
                AppFilterTabs(
                  tabs: const ['All (23)', 'Pending (8)', 'Delivered (11)'],
                  selectedIndex: _selectedFilterIndex,
                  onTabSelected: (idx) =>
                      setState(() => _selectedFilterIndex = idx),
                ),
                const SizedBox(height: 20),
                Center(
                  child: AppFAB(onPressed: () {}, icon: const Icon(Icons.add)),
                ),
              ],
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
      bottomNavigationBar: AppNavBar(
        items: [
          AppNavBarItem(
            icon: const Icon(Icons.list_alt),
            label: 'Orders',
            isSelected: true,
            onTap: () {},
          ),
          AppNavBarItem(
            icon: const Icon(Icons.people_outline),
            label: 'Customers',
            isSelected: false,
            onTap: () {},
          ),
          AppNavBarItem(
            icon: const Icon(Icons.bar_chart),
            label: 'Reports',
            isSelected: false,
            onTap: () {},
          ),
          AppNavBarItem(
            icon: const Icon(Icons.settings_outlined),
            label: 'Settings',
            isSelected: false,
            onTap: () {},
          ),
        ],
      ),
    );
  }
}

class ExampleHomeScreen extends StatefulWidget {
  const ExampleHomeScreen({super.key});

  @override
  State<ExampleHomeScreen> createState() => _ExampleHomeScreenState();
}

class _ExampleHomeScreenState extends State<ExampleHomeScreen> {
  int _tabIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              color: AppColors.warmWhite,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          AppAvatar(
                            size: 42,
                            backgroundColor: AppColors.softOrange,
                            icon: const Text(
                              '👗',
                              style: TextStyle(fontSize: 20),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Ma Aye Shop',
                                style: Theme.of(context).textTheme.titleMedium
                                    ?.copyWith(fontWeight: FontWeight.w900),
                              ),
                              Text(
                                'Yangon Fashion · 23 orders today',
                                style: Theme.of(context).textTheme.labelSmall
                                    ?.copyWith(
                                      color: AppColors.textLight,
                                      fontWeight: FontWeight.w600,
                                    ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          AppIconButton(
                            icon: const Icon(Icons.notifications_none),
                            onPressed: () {},
                            showBadge: true,
                          ),
                          const SizedBox(width: 8),
                          AppIconButton(
                            icon: const Icon(Icons.more_horiz),
                            onPressed: () {},
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Row(
                    children: [
                      Expanded(
                        child: AppSummaryCard(
                          label: 'Today Orders',
                          value: '23',
                          changeText: '↑ 4 yesterday',
                        ),
                      ),
                      SizedBox(width: 10),
                      Expanded(
                        child: AppSummaryCard(
                          label: 'Revenue',
                          value: '485K',
                          changeText: '↑ MMK today',
                        ),
                      ),
                      SizedBox(width: 10),
                      Expanded(
                        child: AppSummaryCard(
                          label: 'Pending',
                          value: '8',
                          changeText: 'Need action',
                          isPositiveChange: false,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  AppFilterTabs(
                    tabs: const [
                      'All (23)',
                      'Today (12)',
                      'Pending (8)',
                      'Delivered (11)',
                    ],
                    selectedIndex: _tabIndex,
                    onTabSelected: (idx) => setState(() => _tabIndex = idx),
                  ),
                ],
              ),
            ),
            // Body
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const AppSearchBar(hintText: 'Search orders, customers...'),
                    const SizedBox(height: 16),
                    if (_tabIndex == 2) ...[
                      const AppAlertBanner(
                        title: '8 orders need your attention',
                        message: 'Confirm or update status now',
                      ),
                      const SizedBox(height: 16),
                    ],
                    const Text(
                      'TODAY — APRIL 2',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textLight,
                        letterSpacing: 1.1,
                      ),
                    ),
                    const SizedBox(height: 12),
                    AppOrderCard(
                      customerName: 'Daw Khin Myat',
                      orderId: '#ORD-0241',
                      productName: 'Silk Longyi Set × 2',
                      price: '45,000',
                      status: AppStatusVariant.newOrder,
                      time: '10:32 AM',
                      onTap: () {},
                      onPrimaryAction: () {},
                      primaryActionLabel: 'Confirm',
                      onSecondaryAction: () {},
                      secondaryActionLabel: 'Call',
                    ),
                    const SizedBox(height: 10),
                    AppOrderCard(
                      customerName: 'Ko Zaw Lin',
                      orderId: '#ORD-0240',
                      productName: 'Men Shirt (L) × 1',
                      price: '18,500',
                      status: AppStatusVariant.shipping,
                      time: '9:14 AM',
                      productIcon: '👔',
                      onTap: () {},
                      onPrimaryAction: () {},
                      primaryActionLabel: 'Mark Delivered',
                      onSecondaryAction: () {},
                      secondaryActionLabel: 'Track',
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: AppFAB(
        onPressed: () {},
        icon: const Icon(Icons.add),
      ),
      bottomNavigationBar: AppNavBar(
        items: [
          AppNavBarItem(
            icon: const Icon(Icons.list_alt),
            label: 'Orders',
            isSelected: true,
            onTap: () {},
          ),
          AppNavBarItem(
            icon: const Icon(Icons.people_outline),
            label: 'Customers',
            isSelected: false,
            onTap: () {},
          ),
          AppNavBarItem(
            icon: const Icon(Icons.bar_chart),
            label: 'Reports',
            isSelected: false,
            onTap: () {},
          ),
          AppNavBarItem(
            icon: const Icon(Icons.settings_outlined),
            label: 'Settings',
            isSelected: false,
            onTap: () {},
          ),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: AppColors.softOrange,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
        ...children,
        const Divider(height: 32),
      ],
    );
  }
}

class _ColorBox extends StatelessWidget {
  const _ColorBox({required this.color, required this.name});

  final Color color;
  final String name;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          name,
          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }
}
