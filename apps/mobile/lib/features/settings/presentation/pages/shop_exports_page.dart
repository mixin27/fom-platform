import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fom_mobile/app/di/injection_container.dart';
import 'package:fom_mobile/features/auth/feature_auth.dart';
import 'package:fom_mobile/features/exports/feature_exports.dart';

class ShopExportsPage extends StatefulWidget {
  const ShopExportsPage({super.key});

  @override
  State<ShopExportsPage> createState() => _ShopExportsPageState();
}

class _ShopExportsPageState extends State<ShopExportsPage> {
  void _showMessage(String message) {
    if (!mounted) {
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider<ShopExportBloc>(
      create: (_) => getIt<ShopExportBloc>(),
      child: BlocListener<ShopExportBloc, ShopExportState>(
        listenWhen: (previous, current) {
          return previous.successMessage != current.successMessage ||
              previous.errorMessage != current.errorMessage;
        },
        listener: (context, state) {
          final message = state.errorMessage ?? state.successMessage;
          if ((message ?? '').trim().isEmpty) {
            return;
          }

          _showMessage(message!);
          context.read<ShopExportBloc>().add(
            const ShopExportFeedbackDismissed(),
          );
        },
        child: BlocBuilder<ShopExportBloc, ShopExportState>(
          builder: (context, exportState) {
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
                                  ? 'Save or share exports from the current active shop.'
                                  : 'Save exports to a public file location or share them to other apps for ${activeShop.shopName}.',
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
                                  'Save or share order rows, customer details, item summary, totals, and timestamps.',
                              isSaving: exportState.isDatasetBusy(
                                'orders',
                                ShopExportActionKind.save,
                              ),
                              isSharing: exportState.isDatasetBusy(
                                'orders',
                                ShopExportActionKind.share,
                              ),
                              onSavePressed: () => _saveDataset(
                                context,
                                dataset: 'orders',
                                label: 'Orders CSV',
                              ),
                              onSharePressed: () => _shareDataset(
                                context,
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
                                  'Save or share customer records with contact details, order count, and spend context.',
                              isSaving: exportState.isDatasetBusy(
                                'customers',
                                ShopExportActionKind.save,
                              ),
                              isSharing: exportState.isDatasetBusy(
                                'customers',
                                ShopExportActionKind.share,
                              ),
                              onSavePressed: () => _saveDataset(
                                context,
                                dataset: 'customers',
                                label: 'Customers CSV',
                              ),
                              onSharePressed: () => _shareDataset(
                                context,
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
                                  'Save or share delivery assignments, driver details, and delivery timestamps.',
                              isSaving: exportState.isDatasetBusy(
                                'deliveries',
                                ShopExportActionKind.save,
                              ),
                              isSharing: exportState.isDatasetBusy(
                                'deliveries',
                                ShopExportActionKind.share,
                              ),
                              onSavePressed: () => _saveDataset(
                                context,
                                dataset: 'deliveries',
                                label: 'Deliveries CSV',
                              ),
                              onSharePressed: () => _shareDataset(
                                context,
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
                                  'Save or share the member roster with roles and account identifiers.',
                              isSaving: exportState.isDatasetBusy(
                                'members',
                                ShopExportActionKind.save,
                              ),
                              isSharing: exportState.isDatasetBusy(
                                'members',
                                ShopExportActionKind.share,
                              ),
                              onSavePressed: () => _saveDataset(
                                context,
                                dataset: 'members',
                                label: 'Staffs CSV',
                              ),
                              onSharePressed: () => _shareDataset(
                                context,
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
          },
        ),
      ),
    );
  }

  void _saveDataset(
    BuildContext context, {
    required String dataset,
    required String label,
  }) {
    final activeShop = getIt<AuthBloc>().state.activeShop;
    final shopId = activeShop == null ? '' : activeShop.shopId.trim();

    if (shopId.isEmpty) {
      _showMessage('Choose an active shop before exporting data.');
      return;
    }

    context.read<ShopExportBloc>().add(
      ShopExportSaveRequested(
        shopId: shopId,
        shopName: activeShop?.shopName ?? 'shop',
        dataset: dataset,
        label: label,
      ),
    );
  }

  void _shareDataset(
    BuildContext context, {
    required String dataset,
    required String label,
  }) {
    final activeShop = getIt<AuthBloc>().state.activeShop;
    final shopId = activeShop == null ? '' : activeShop.shopId.trim();

    if (shopId.isEmpty) {
      _showMessage('Choose an active shop before exporting data.');
      return;
    }

    context.read<ShopExportBloc>().add(
      ShopExportShareRequested(
        shopId: shopId,
        shopName: activeShop?.shopName ?? 'shop',
        dataset: dataset,
        label: label,
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
    required this.isSaving,
    required this.isSharing,
    required this.onSavePressed,
    required this.onSharePressed,
  });

  final IconData icon;
  final Color iconColor;
  final Color iconBackground;
  final String title;
  final String description;
  final bool isSaving;
  final bool isSharing;
  final VoidCallback onSavePressed;
  final VoidCallback onSharePressed;

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
          Row(
            children: [
              Expanded(
                child: AppButton(
                  text: 'Save file',
                  onPressed: isSaving || isSharing ? null : onSavePressed,
                  isLoading: isSaving,
                  icon: const Icon(
                    Icons.download_rounded,
                    color: Colors.white,
                    size: 18,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: AppButton(
                  text: 'Share',
                  variant: AppButtonVariant.secondary,
                  onPressed: isSaving || isSharing ? null : onSharePressed,
                  isLoading: isSharing,
                  icon: const Icon(Icons.ios_share_rounded, size: 18),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
