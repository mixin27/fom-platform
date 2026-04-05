import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../widgets/notification_card.dart';

class NotificationsHomePage extends StatelessWidget {
  const NotificationsHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            _buildHeader(context),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.only(
                  left: 16,
                  right: 16,
                  top: 14,
                  bottom:
                      90, // safe space for bottom nav potentially or scroll space
                ),
                children: [
                  const _SectionLabel('Just Now'),
                  NotificationCard(
                    title: 'New Order — Daw Khin Myat',
                    body: 'Silk Longyi Set × 2 · 45,000 MMK · Sanchaung',
                    timeLabel: 'Just now · #ORD-0244',
                    icon: const Text('🆕', style: TextStyle(fontSize: 20)),
                    statusType: NotificationStatusType.orange,
                    isUnread: true,
                    onTap: () {},
                  ),
                  NotificationCard(
                    title: 'New Order — U Kyaw Zin',
                    body: 'Formal Shirt × 3 · 54,000 MMK · Tarmwe',
                    timeLabel: '5 min ago · #ORD-0243',
                    icon: const Text('🆕', style: TextStyle(fontSize: 20)),
                    statusType: NotificationStatusType.orange,
                    isUnread: true,
                    onTap: () {},
                  ),

                  const _SectionLabel('Today'),
                  NotificationCard(
                    title: 'Order Delivered — Ko Zaw Lin',
                    body: 'Men Shirt confirmed received · 21,500 MMK',
                    timeLabel: '1 hr ago · #ORD-0240',
                    icon: const Text('🎉', style: TextStyle(fontSize: 20)),
                    statusType: NotificationStatusType.green,
                    isUnread: true,
                    onTap: () {},
                  ),
                  NotificationCard(
                    title: 'Reminder: 3 orders need action',
                    body:
                        'Orders #0238, #0237, #0235 are still "New" — confirm or update status.',
                    timeLabel: '2 hr ago',
                    icon: const Text('⏰', style: TextStyle(fontSize: 20)),
                    statusType: NotificationStatusType.yellow,
                    isUnread: true,
                    onTap: () {},
                  ),
                  NotificationCard(
                    title: 'Morning Summary — Yesterday',
                    body: '22 orders · 413,000 MMK revenue · 18 delivered',
                    timeLabel: '8:00 AM',
                    icon: const Text('📊', style: TextStyle(fontSize: 20)),
                    statusType: NotificationStatusType.teal,
                    isUnread: true,
                    onTap: () {},
                  ),

                  const _SectionLabel('Yesterday'),
                  NotificationCard(
                    title: 'VIP Customer Milestone',
                    body:
                        'Daw Aye Aye just reached 300K MMK total spend! She\'s your top customer.',
                    timeLabel: 'Apr 1, 6:32 PM',
                    icon: const Text('🎁', style: TextStyle(fontSize: 20)),
                    statusType: NotificationStatusType.purple,
                    onTap: () {},
                  ),
                  NotificationCard(
                    title: 'Order Cancelled — Ma Thida',
                    body:
                        'Handbag × 1 order was cancelled by customer request.',
                    timeLabel: 'Apr 1, 2:15 PM · #ORD-0230',
                    icon: const Text('❌', style: TextStyle(fontSize: 20)),
                    statusType: NotificationStatusType.red,
                    onTap: () {},
                  ),
                  NotificationCard(
                    title: 'Daily Report Ready',
                    body:
                        'April 1 summary: 22 orders · 413,000 MMK · Best day this week!',
                    timeLabel: 'Apr 1, 8:00 PM',
                    icon: const Text('📊', style: TextStyle(fontSize: 20)),
                    statusType: NotificationStatusType.teal,
                    onTap: () {},
                  ),

                  const _SectionLabel('Earlier'),
                  NotificationCard(
                    title: 'Trial: 5 days remaining',
                    body:
                        'Upgrade now for 5,000 MMK/month to keep your data and unlock all features.',
                    timeLabel: 'Mar 31',
                    icon: const Text('⭐', style: TextStyle(fontSize: 20)),
                    statusType: NotificationStatusType.orange,
                    onTap: () {},
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: const BoxDecoration(
        color: AppColors.warmWhite,
        border: Border(bottom: BorderSide(color: AppColors.border, width: 1.5)),
      ),
      child: Row(
        children: [
          AppIconButton(
            icon: const Icon(Icons.arrow_back_rounded),
            onPressed: () => context.pop(),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Notifications',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w900,
                    color: AppColors.textDark,
                  ),
                ),
                Text(
                  'အသိပေးချက်များ',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textLight,
                    fontFamily: 'NotoSansMyanmar',
                  ),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () {},
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              decoration: BoxDecoration(
                color: AppColors.softOrangeLight,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text(
                'Mark all read',
                style: TextStyle(
                  color: AppColors.softOrange,
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.label);
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 2, right: 2, bottom: 8, top: 12),
      child: Text(
        label.toUpperCase(),
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w800,
          color: AppColors.textLight,
          letterSpacing: 1.0, // approximates 0.1em
        ),
      ),
    );
  }
}
