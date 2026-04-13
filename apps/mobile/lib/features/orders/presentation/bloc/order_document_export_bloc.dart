import "package:app_logger/app_logger.dart";
import "package:flutter_bloc/flutter_bloc.dart";
import "package:fom_mobile/features/orders/domain/entities/order_document_export_format.dart";
import "package:fom_mobile/features/orders/domain/usecases/save_order_document_use_case.dart";
import "package:fom_mobile/features/orders/domain/usecases/share_order_document_use_case.dart";

import "order_document_export_event.dart";
import "order_document_export_state.dart";

class OrderDocumentExportBloc
    extends Bloc<OrderDocumentExportEvent, OrderDocumentExportState>
    with LoggerMixin {
  OrderDocumentExportBloc({
    required SaveOrderDocumentUseCase saveOrderDocumentUseCase,
    required ShareOrderDocumentUseCase shareOrderDocumentUseCase,
    AppLogger? logger,
  }) : _saveOrderDocumentUseCase = saveOrderDocumentUseCase,
       _shareOrderDocumentUseCase = shareOrderDocumentUseCase,
       _logger = logger ?? AppLogger(enabled: false),
       super(const OrderDocumentExportState()) {
    on<OrderDocumentSaveRequested>(_onSaveRequested);
    on<OrderDocumentShareRequested>(_onShareRequested);
    on<OrderDocumentExportFeedbackDismissed>(_onFeedbackDismissed);
  }

  final SaveOrderDocumentUseCase _saveOrderDocumentUseCase;
  final ShareOrderDocumentUseCase _shareOrderDocumentUseCase;
  final AppLogger _logger;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext("OrderDocumentExportBloc");

  Future<void> _onSaveRequested(
    OrderDocumentSaveRequested event,
    Emitter<OrderDocumentExportState> emit,
  ) async {
    if (state.isBusy) {
      return;
    }

    emit(
      state.copyWith(
        activeFormat: event.format,
        activeAction: OrderDocumentExportActionKind.save,
        clearFeedback: true,
      ),
    );

    final result = await _saveOrderDocumentUseCase(
      SaveOrderDocumentParams(
        order: event.order,
        shopName: event.shopName,
        format: event.format,
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
            successMessage: "${event.format.label} saved to ${file.path}",
          ),
        );
      },
    );
  }

  Future<void> _onShareRequested(
    OrderDocumentShareRequested event,
    Emitter<OrderDocumentExportState> emit,
  ) async {
    if (state.isBusy) {
      return;
    }

    emit(
      state.copyWith(
        activeFormat: event.format,
        activeAction: OrderDocumentExportActionKind.share,
        clearFeedback: true,
      ),
    );

    final result = await _shareOrderDocumentUseCase(
      ShareOrderDocumentParams(
        order: event.order,
        shopName: event.shopName,
        format: event.format,
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
            successMessage: "${event.format.label} shared successfully.",
          ),
        );
      },
    );
  }

  void _onFeedbackDismissed(
    OrderDocumentExportFeedbackDismissed event,
    Emitter<OrderDocumentExportState> emit,
  ) {
    emit(state.copyWith(clearFeedback: true));
  }
}
