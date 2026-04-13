import 'dart:io';

import 'package:app_core/app_core.dart';
import 'package:app_network/app_network.dart';
import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:fom_mobile/app/di/injection_container.dart';
import 'package:fom_mobile/features/auth/feature_auth.dart';
import 'package:intl/intl.dart';
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';

class ShopExportsPage extends StatefulWidget {
  const ShopExportsPage({super.key});

  @override
  State<ShopExportsPage> createState() => _ShopExportsPageState();
}

class _ShopExportsPageState extends State<ShopExportsPage> {
  String? _activeDataset;

  Future<void> _downloadDataset({
    required String dataset,
    required String label,
  }) async {
    final activeShop = getIt<AuthBloc>().state.activeShop;
    final shopId = activeShop?.shopId;

    if ((shopId ?? '').trim().isEmpty) {
      _showMessage('Choose an active shop before exporting data.');
      return;
    }

    setState(() => _activeDataset = dataset);

    try {
      final bytes = await getIt<ApiClient>().getBytes(
        '/shops/$shopId/exports/$dataset.csv',
      );
      final directory = await getApplicationDocumentsDirectory();
      final timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
      final safeShopName = _slugify(activeShop?.shopName ?? 'shop');
      final filename = '$safeShopName-$dataset-$timestamp.csv';
      final file = File(path.join(directory.path, filename));

      await file.writeAsBytes(bytes, flush: true);

      if (!mounted) {
        return;
      }

      _showMessage('$label saved to ${file.path}');
    } on AppException catch (error) {
      _showMessage(error.message);
    } catch (_) {
      _showMessage('Unable to export $label right now.');
    } finally {
      if (mounted) {
        setState(() => _activeDataset = null);
      }
    }
  }

  void _showMessage(String message) {
    if (!mounted) {
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
    );
  }

  String _slugify(String value) {
    final normalized = value
        .trim()
        .toLowerCase()
        .replaceAll(RegExp(r'[^a-z0-9]+'), '-')
        .replaceAll(RegExp(r'^-+|-+$'), '');

    return normalized.isEmpty ? 'shop' : normalized;
  }

  @override
  Widget build(BuildContext context) {
    final activeShop = getIt<AuthBloc>().state.activeShop;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        bottom: false,
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Data Exports',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        color: AppColors.textDark,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      activeShop == null
                          ? 'Download CSV exports from the current active shop.'
                          : 'Download CSV exports for ${activeShop.shopName}. Export availability depends on the current subscription plan.',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textLight,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 92),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  if (activeShop == null)
                    const AppEmptyState(
                      icon: Icon(Icons.storefront_outlined),
                      title: 'No active shop selected',
                      message:
                          'Choose a shop first, then return here to export operational data.',
                    )
                  else ...[
                    _ExportCard(
                      icon: Icons.shopping_cart_outlined,
                      iconColor: AppColors.softOrange,
                      iconBackground: AppColors.softOrangeLight,
                      title: 'Orders CSV',
                      description:
                          'Download order rows, customer details, item summary, totals, and timestamps.',
                      buttonText: 'Download Orders CSV',
                      isLoading: _activeDataset == 'orders',
                      onPressed: () => _downloadDataset(
                        dataset: 'orders',
                        label: 'Orders CSV',
                      ),
                    ),
                    const SizedBox(height: 14),
                    _ExportCard(
                      icon: Icons.people_outline_rounded,
                      iconColor: AppColors.teal,
                      iconBackground: AppColors.tealLight,
                      title: 'Customers CSV',
                      description:
                          'Download customer records with contact details, order count, and spend context.',
                      buttonText: 'Download Customers CSV',
                      isLoading: _activeDataset == 'customers',
                      onPressed: () => _downloadDataset(
                        dataset: 'customers',
                        label: 'Customers CSV',
                      ),
                    ),
                    const SizedBox(height: 14),
                    _ExportCard(
                      icon: Icons.local_shipping_outlined,
                      iconColor: AppColors.yellow,
                      iconBackground: AppColors.yellowLight,
                      title: 'Deliveries CSV',
                      description:
                          'Download delivery assignments, driver details, and delivery timestamps.',
                      buttonText: 'Download Deliveries CSV',
                      isLoading: _activeDataset == 'deliveries',
                      onPressed: () => _downloadDataset(
                        dataset: 'deliveries',
                        label: 'Deliveries CSV',
                      ),
                    ),
                    const SizedBox(height: 14),
                    _ExportCard(
                      icon: Icons.badge_outlined,
                      iconColor: AppColors.purple,
                      iconBackground: AppColors.purpleLight,
                      title: 'Staffs CSV',
                      description:
                          'Download the member roster with roles and account identifiers.',
                      buttonText: 'Download Staffs CSV',
                      isLoading: _activeDataset == 'members',
                      onPressed: () => _downloadDataset(
                        dataset: 'members',
                        label: 'Staffs CSV',
                      ),
                    ),
                  ],
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ExportCard extends StatelessWidget {
  const _ExportCard({
    required this.icon,
    required this.iconColor,
    required this.iconBackground,
    required this.title,
    required this.description,
    required this.buttonText,
    required this.isLoading,
    required this.onPressed,
  });

  final IconData icon;
  final Color iconColor;
  final Color iconBackground;
  final String title;
  final String description;
  final String buttonText;
  final bool isLoading;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: iconBackground,
                  borderRadius: BorderRadius.circular(14),
                ),
                alignment: Alignment.center,
                child: Icon(icon, color: iconColor, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: AppColors.textDark,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            description,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.textLight,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 14),
          AppButton(
            text: buttonText,
            onPressed: isLoading ? null : onPressed,
            isLoading: isLoading,
            icon: const Icon(Icons.download_rounded, color: Colors.white, size: 18),
          ),
        ],
      ),
    );
  }
}
