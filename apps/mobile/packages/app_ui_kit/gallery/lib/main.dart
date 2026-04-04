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

class GalleryHomePage extends StatelessWidget {
  const GalleryHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('App UI Kit Gallery'),
        actions: [
          IconButton(
            icon: const Icon(Icons.palette_outlined),
            onPressed: () {},
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
            const _Section(
              title: 'Colors',
              children: [
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    _ColorBox(color: AppColors.softOrange, name: 'Soft Orange'),
                    _ColorBox(color: AppColors.teal, name: 'Teal'),
                    _ColorBox(color: AppColors.cream, name: 'Cream'),
                    _ColorBox(color: AppColors.textDark, name: 'Text Dark'),
                    _ColorBox(color: AppColors.textMid, name: 'Text Mid'),
                    _ColorBox(color: AppColors.border, name: 'Border'),
                  ],
                ),
              ],
            ),
            _Section(
              title: 'Buttons',
              children: [
                AppButton(text: 'Primary Button', onPressed: () {}),
                const SizedBox(height: 12),
                AppButton(
                  text: 'Secondary Button',
                  variant: AppButtonVariant.secondary,
                  onPressed: () {},
                ),
                const SizedBox(height: 12),
                AppButton(
                  text: 'Tertiary Button',
                  variant: AppButtonVariant.tertiary,
                  onPressed: () {},
                ),
                const SizedBox(height: 12),
                AppButton(
                  text: 'Facebook Button',
                  variant: AppButtonVariant.facebook,
                  icon: const Icon(Icons.facebook, color: Colors.white),
                  onPressed: () {},
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    AppIconButton(
                      icon: const Icon(Icons.notifications_none),
                      onPressed: () {},
                      showBadge: true,
                    ),
                    const SizedBox(width: 12),
                    AppIconButton(
                      icon: const Icon(Icons.more_horiz),
                      onPressed: () {},
                    ),
                    const SizedBox(width: 12),
                    AppIconButton(
                      icon: const Icon(Icons.arrow_back),
                      onPressed: () {},
                      isSelected: true,
                    ),
                  ],
                ),
              ],
            ),
            _Section(
              title: 'Form Inputs',
              children: [
                const AppTextField(
                  label: 'Full Name',
                  hintText: 'Enter your name',
                  prefixIcon: Icon(Icons.person_outline),
                ),
                const SizedBox(height: 16),
                const AppSearchBar(
                  hintText: 'Search orders...',
                  filterLabel: 'Filter',
                ),
              ],
            ),
            _Section(
              title: 'Status & Badges',
              children: [
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: const [
                    AppStatusBadge(variant: AppStatusVariant.newOrder),
                    AppStatusBadge(variant: AppStatusVariant.confirmed),
                    AppStatusBadge(variant: AppStatusVariant.shipping),
                    AppStatusBadge(variant: AppStatusVariant.delivered),
                    AppChip(label: 'Silk Longyi'),
                    AppChip(
                      label: 'Fashion',
                      icon: Icon(Icons.style, size: 14),
                    ),
                  ],
                ),
              ],
            ),
            _Section(
              title: 'Dashboard Cards',
              children: [
                Row(
                  children: [
                    Expanded(
                      child: AppSummaryCard(
                        label: 'Today Orders',
                        value: '23',
                        changeText: '↑ 4 yesterday',
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: AppSummaryCard(
                        label: 'Revenue',
                        value: '485K',
                        changeText: '↑ MMK today',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                const AppSummaryCard(
                  label: 'Pending',
                  value: '8',
                  changeText: 'Need action',
                  isPositiveChange: false,
                ),
              ],
            ),
            _Section(
              title: 'Navigation & Steppers',
              children: [
                const AppStepper(
                  totalSteps: 4,
                  currentStep: 1,
                  stepLabels: ['Received', 'Confirm', 'Shipping', 'Done'],
                ),
                const SizedBox(height: 24),
                AppTimeline(
                  items: const [
                    AppTimelineItem(
                      time: '10:32 AM',
                      event: 'Order created',
                      subtitle: 'Added manually',
                      color: AppTimelineColor.orange,
                    ),
                    AppTimelineItem(
                      time: '11:05 AM',
                      event: 'Out for delivery',
                      color: AppTimelineColor.teal,
                      isLast: true,
                    ),
                  ],
                ),
              ],
            ),
            _Section(
              title: 'Others',
              children: [
                Row(
                  children: const [
                    AppAvatar(size: 50),
                    SizedBox(width: 12),
                    AppAvatar(
                      size: 50,
                      backgroundColor: AppColors.tealLight,
                      icon: Icon(Icons.store, color: AppColors.teal),
                    ),
                    SizedBox(width: 12),
                    AppProgressBarDots(totalSteps: 3, currentStep: 1),
                  ],
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
