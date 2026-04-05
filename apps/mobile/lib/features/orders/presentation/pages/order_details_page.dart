import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';

import '../widgets/order_details_widgets.dart';
import '../widgets/update_status_bottom_sheet.dart';

class OrderDetailsPage extends StatefulWidget {
  const OrderDetailsPage({required this.orderId, super.key});

  final String orderId;

  @override
  State<OrderDetailsPage> createState() => _OrderDetailsPageState();
}

class _OrderDetailsPageState extends State<OrderDetailsPage> {
  // Current status of the order
  AppStatusVariant _status = AppStatusVariant.newOrder;

  Future<void> _updateStatus() async {
    final newStatus = await UpdateStatusBottomSheet.show(context, _status);
    if (newStatus != null && mounted) {
      setState(() {
        _status = newStatus;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // Determine labels and step from progress
    String statusText;
    String badgeLabel;
    int currentStep;

    switch (_status) {
      case AppStatusVariant.newOrder:
        statusText = '🆕 New Order';
        badgeLabel = 'NEW';
        currentStep = 1;
        break;
      case AppStatusVariant.confirmed:
        statusText = '✅ Confirmed';
        badgeLabel = 'CONFIRMED';
        currentStep = 2;
        break;
      case AppStatusVariant.shipping:
        statusText = '🚚 Out for Delivery';
        badgeLabel = 'ON THE WAY';
        currentStep = 3;
        break;
      case AppStatusVariant.delivered:
        statusText = '🎉 Delivered';
        badgeLabel = 'DELIVERED';
        currentStep = 4;
        break;
      case AppStatusVariant.cancelled:
        statusText = '✗ Cancelled';
        badgeLabel = 'CANCELLED';
        currentStep = 1; // Or special state
        break;
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leadingWidth: 70,
        leading: Center(
          child: AppIconButton(
            icon: const Icon(Icons.arrow_back_rounded),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Order Detail',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w900,
                color: AppColors.textDark,
              ),
            ),
            Text(
              '#${widget.orderId} · Apr 2, 10:32 AM',
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.textLight,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: AppSpacing.md),
            child: AppIconButton(
              icon: const Icon(Icons.more_horiz_rounded),
              onPressed: () {},
            ),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1.5),
          child: Container(color: AppColors.border, height: 1.5),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Hero
            StatusHero(
              status: statusText,
              badgeLabel: badgeLabel,
              badgeVariant: _status,
              currentStep: currentStep,
            ),
            const SizedBox(height: AppSpacing.md),

            // Condition-based Shipping Banner (from Screen 2)
            if (_status == AppStatusVariant.shipping) ...[
              ShippingBanner(onDone: _updateStatus),
              const SizedBox(height: AppSpacing.md),
            ],

            // Quick Status Update
            const AppSectionHeader(
              title: 'Update Status — အခြေအနေ ပြောင်းမည်',
              icon: Icon(Icons.refresh_rounded),
            ),
            const SizedBox(height: AppSpacing.sm),
            StatusUpdateGrid(onUpdate: _updateStatus),
            const SizedBox(height: AppSpacing.lg),

            // Customer Info
            const CustomerInfoCard(),
            const SizedBox(height: AppSpacing.md),

            // Product & Payment
            const ProductPaymentCard(),
            const SizedBox(height: AppSpacing.md),

            // Activity Log
            const ActivityLogCard(),
            const SizedBox(height: 100), // Bottom bar spacer
          ],
        ),
      ),
      bottomNavigationBar: OrderDetailsBottomBar(
        isOutForDelivery: _status == AppStatusVariant.shipping,
        onPrimaryPressed: _updateStatus,
      ),
    );
  }
}
