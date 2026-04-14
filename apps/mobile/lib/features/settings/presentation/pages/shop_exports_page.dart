import 'package:app_core/app_core.dart';
import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fom_mobile/app/di/injection_container.dart';
import 'package:fom_mobile/features/auth/feature_auth.dart';
import 'package:fom_mobile/features/exports/feature_exports.dart';

import '../../domain/entities/settings_snapshot.dart';
import '../../domain/usecases/fetch_settings_snapshot_use_case.dart';

class ShopExportsPage extends StatefulWidget {
  const ShopExportsPage({super.key});

  @override
  State<ShopExportsPage> createState() => _ShopExportsPageState();
}

class _ShopExportsPageState extends State<ShopExportsPage> {
  static const String _csvExportsFeatureCode = 'exports.csv';
  static const String _teamMembersFeatureCode = 'team.members';
  static const String _ordersImportFeatureCode = 'orders.import_spreadsheet';

  Future<Result<SettingsSnapshot>>? _settingsFuture;
  String? _settingsShopId;

  void _showMessage(String message) {
    if (!mounted) {
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
    );
  }

  Future<Result<SettingsSnapshot>> _ensureSettingsFuture(String shopId) {
    if (_settingsFuture != null && _settingsShopId == shopId) {
      return _settingsFuture!;
    }

    _settingsShopId = shopId;
    _settingsFuture = getIt<FetchSettingsSnapshotUseCase>()(
      FetchSettingsSnapshotParams(shopId: shopId),
    );
    return _settingsFuture!;
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
                              'Data Import & Export',
                              style: TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.w900,
                                color: AppColors.textDark,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              activeShop == null
                                  ? 'Download exports or import spreadsheets from the current active shop.'
                                  : 'Save exports, share them to other apps, or import historical order spreadsheets for ${activeShop.shopName}.',
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
                            FutureBuilder<Result<SettingsSnapshot>>(
                              future: _ensureSettingsFuture(
                                activeShop.shopId.trim(),
                              ),
                              builder: (context, snapshot) {
                                final billing = snapshot.data?.dataOrNull?.billing;
                                final billingFailure =
                                    snapshot.data?.failureOrNull;
                                final exportEnabled =
                                    billing?.hasFeature(
                                      _csvExportsFeatureCode,
                                    ) ??
                                    true;
                                final memberExportEnabled =
                                    exportEnabled &&
                                    (billing?.hasFeature(
                                          _teamMembersFeatureCode,
                                        ) ??
                                        true);
                                final importEnabled =
                                    billing?.hasFeature(
                                      _ordersImportFeatureCode,
                                    ) ??
                                    true;
                                final canImport =
                                    activeShop.permissions.contains(
                                      'orders.write',
                                    ) &&
                                    importEnabled;
                                final importReason =
                                    activeShop.permissions.contains(
                                          'orders.write',
                                        )
                                    ? importEnabled
                                          ? null
                                          : 'Spreadsheet import is available on paid plans.'
                                    : 'You need order write permission to import historical orders.';

                                return Column(
                                  children: [
                                    if (billingFailure != null) ...[
                                      const _FeatureNoticeCard(
                                        message:
                                            'Could not verify subscription features right now. Actions will still be checked by the server.',
                                      ),
                                      const SizedBox(height: 14),
                                    ],
                                    if (!exportEnabled) ...[
                                      const _FeatureNoticeCard(
                                        message:
                                            'CSV exports are not available on the current subscription plan.',
                                      ),
                                      const SizedBox(height: 14),
                                    ],
                                    if (importReason != null) ...[
                                      _FeatureNoticeCard(message: importReason),
                                      const SizedBox(height: 14),
                                    ],
                                    _ImportCard(
                                      isDownloadingTemplate:
                                          exportState.isDatasetBusy(
                                            'orders-import-template',
                                            ShopExportActionKind.save,
                                          ),
                                      isImporting:
                                          exportState.isDatasetBusy(
                                            'orders-import',
                                            ShopExportActionKind.importFile,
                                          ),
                                      isEnabled: canImport,
                                      onDownloadTemplate: () => _saveDataset(
                                        context,
                                        dataset: 'orders-import-template',
                                        label: 'Order Import Template',
                                        extension: 'xlsx',
                                        mimeType:
                                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                      ),
                                      onImportPressed: () => _importOrders(
                                        context,
                                      ),
                                    ),
                                    const SizedBox(height: 14),
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
                                      isEnabled: exportEnabled,
                                      disabledMessage:
                                          'Not available on this plan',
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
                                      isEnabled: exportEnabled,
                                      disabledMessage:
                                          'Not available on this plan',
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
                                      isEnabled: exportEnabled,
                                      disabledMessage:
                                          'Not available on this plan',
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
                                      isEnabled: memberExportEnabled,
                                      disabledMessage:
                                          'Requires team member access on this plan',
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
                                );
                              },
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
    String extension = 'csv',
    String mimeType = 'text/csv',
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
        extension: extension,
        mimeType: mimeType,
      ),
    );
  }

  void _shareDataset(
    BuildContext context, {
    required String dataset,
    required String label,
    String extension = 'csv',
    String mimeType = 'text/csv',
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
        extension: extension,
        mimeType: mimeType,
      ),
    );
  }

  void _importOrders(BuildContext context) {
    final activeShop = getIt<AuthBloc>().state.activeShop;
    final shopId = activeShop == null ? '' : activeShop.shopId.trim();

    if (shopId.isEmpty) {
      _showMessage('Choose an active shop before importing data.');
      return;
    }

    context.read<ShopExportBloc>().add(
      ShopOrdersImportRequested(
        shopId: shopId,
        label: 'Order spreadsheet',
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
    required this.isEnabled,
    required this.disabledMessage,
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
  final bool isEnabled;
  final String disabledMessage;
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
          if (!isEnabled) ...[
            const SizedBox(height: 10),
            Text(
              disabledMessage,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.yellow,
              ),
            ),
          ],
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: AppButton(
                  text: 'Save file',
                  onPressed:
                      !isEnabled || isSaving || isSharing
                          ? null
                          : onSavePressed,
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
                  onPressed:
                      !isEnabled || isSaving || isSharing
                          ? null
                          : onSharePressed,
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

class _ImportCard extends StatelessWidget {
  const _ImportCard({
    required this.isDownloadingTemplate,
    required this.isImporting,
    required this.isEnabled,
    required this.onDownloadTemplate,
    required this.onImportPressed,
  });

  final bool isDownloadingTemplate;
  final bool isImporting;
  final bool isEnabled;
  final VoidCallback onDownloadTemplate;
  final VoidCallback onImportPressed;

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
                  color: AppColors.tealLight,
                  borderRadius: BorderRadius.circular(14),
                ),
                alignment: Alignment.center,
                child: const Icon(
                  Icons.file_open_outlined,
                  color: AppColors.teal,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Order Import',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: AppColors.textDark,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            'Download the Excel template, fill one row per order item, then import an .xlsx or .csv file to migrate historical orders.',
            style: TextStyle(
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
                  text: 'Template',
                  onPressed:
                      !isEnabled || isDownloadingTemplate || isImporting
                          ? null
                          : onDownloadTemplate,
                  isLoading: isDownloadingTemplate,
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
                  text: 'Import file',
                  variant: AppButtonVariant.secondary,
                  onPressed:
                      !isEnabled || isDownloadingTemplate || isImporting
                          ? null
                          : onImportPressed,
                  isLoading: isImporting,
                  icon: const Icon(Icons.upload_file_rounded, size: 18),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _FeatureNoticeCard extends StatelessWidget {
  const _FeatureNoticeCard({
    required this.message,
  });

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.yellowLight,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        message,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: AppColors.yellow,
          height: 1.5,
        ),
      ),
    );
  }
}
