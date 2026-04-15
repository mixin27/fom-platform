import 'package:app_logger/app_logger.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/usecases/import_shop_orders_use_case.dart';
import '../../domain/usecases/save_shop_dataset_use_case.dart';
import '../../domain/usecases/share_shop_dataset_use_case.dart';
import 'shop_export_event.dart';
import 'shop_export_state.dart';

class ShopExportBloc extends Bloc<ShopExportEvent, ShopExportState>
    with LoggerMixin {
  ShopExportBloc({
    required ImportShopOrdersUseCase importShopOrdersUseCase,
    required SaveShopDatasetUseCase saveShopDatasetUseCase,
    required ShareShopDatasetUseCase shareShopDatasetUseCase,
    AppLogger? logger,
  }) : _importShopOrdersUseCase = importShopOrdersUseCase,
       _saveShopDatasetUseCase = saveShopDatasetUseCase,
       _shareShopDatasetUseCase = shareShopDatasetUseCase,
       _logger = logger ?? AppLogger(enabled: false),
       super(const ShopExportState()) {
    on<ShopOrdersImportRequested>(_onImportRequested);
    on<ShopExportSaveRequested>(_onSaveRequested);
    on<ShopExportShareRequested>(_onShareRequested);
    on<ShopExportFeedbackDismissed>(_onFeedbackDismissed);
  }

  final ImportShopOrdersUseCase _importShopOrdersUseCase;
  final SaveShopDatasetUseCase _saveShopDatasetUseCase;
  final ShareShopDatasetUseCase _shareShopDatasetUseCase;
  final AppLogger _logger;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext('ShopExportBloc');

  Future<void> _onImportRequested(
    ShopOrdersImportRequested event,
    Emitter<ShopExportState> emit,
  ) async {
    emit(
      state.copyWith(
        activeDataset: 'orders-import',
        activeAction: ShopExportActionKind.importFile,
        clearFeedback: true,
      ),
    );

    final result = await _importShopOrdersUseCase(
      ImportShopOrdersParams(shopId: event.shopId),
    );

    if (isClosed) {
      return;
    }

    result.fold(
      (failure) {
        emit(state.copyWith(clearActive: true, errorMessage: failure.message));
      },
      (summary) {
        emit(
          state.copyWith(
            clearActive: true,
            successMessage: summary.summary.isEmpty
                ? '${event.label} imported successfully.'
                : summary.summary,
          ),
        );
      },
    );
  }

  Future<void> _onSaveRequested(
    ShopExportSaveRequested event,
    Emitter<ShopExportState> emit,
  ) async {
    emit(
      state.copyWith(
        activeDataset: event.dataset,
        activeAction: ShopExportActionKind.save,
        clearFeedback: true,
      ),
    );

    final result = await _saveShopDatasetUseCase(
      SaveShopDatasetParams(
        shopId: event.shopId,
        shopName: event.shopName,
        dataset: event.dataset,
        extension: event.extension,
        mimeType: event.mimeType,
      ),
    );

    if (isClosed) {
      return;
    }

    result.fold(
      (failure) {
        emit(state.copyWith(clearActive: true, errorMessage: failure.message));
      },
      (file) {
        emit(
          state.copyWith(
            clearActive: true,
            successMessage: '${event.label} saved to ${file.path}',
          ),
        );
      },
    );
  }

  Future<void> _onShareRequested(
    ShopExportShareRequested event,
    Emitter<ShopExportState> emit,
  ) async {
    emit(
      state.copyWith(
        activeDataset: event.dataset,
        activeAction: ShopExportActionKind.share,
        clearFeedback: true,
      ),
    );

    final result = await _shareShopDatasetUseCase(
      ShareShopDatasetParams(
        shopId: event.shopId,
        shopName: event.shopName,
        dataset: event.dataset,
        subject: event.label,
        text: 'Shared from ${event.shopName}',
        extension: event.extension,
        mimeType: event.mimeType,
      ),
    );

    if (isClosed) {
      return;
    }

    result.fold(
      (failure) {
        emit(state.copyWith(clearActive: true, errorMessage: failure.message));
      },
      (_) {
        emit(
          state.copyWith(
            clearActive: true,
            successMessage: '${event.label} shared successfully.',
          ),
        );
      },
    );
  }

  void _onFeedbackDismissed(
    ShopExportFeedbackDismissed event,
    Emitter<ShopExportState> emit,
  ) {
    emit(state.copyWith(clearFeedback: true));
  }
}
