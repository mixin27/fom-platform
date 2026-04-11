import "package:app_logger/app_logger.dart";
import "package:flutter_bloc/flutter_bloc.dart";

import "../../domain/usecases/create_order_use_case.dart";
import "../../domain/usecases/parse_order_message_use_case.dart";
import "order_entry_event.dart";
import "order_entry_state.dart";

class OrderEntryBloc extends Bloc<OrderEntryEvent, OrderEntryState>
    with LoggerMixin {
  OrderEntryBloc({
    required ParseOrderMessageUseCase parseOrderMessageUseCase,
    required CreateOrderUseCase createOrderUseCase,
    AppLogger? logger,
  }) : _parseOrderMessageUseCase = parseOrderMessageUseCase,
       _createOrderUseCase = createOrderUseCase,
       _logger = logger ?? AppLogger(enabled: false),
       super(const OrderEntryState()) {
    on<OrderEntryStarted>(_onStarted);
    on<OrderEntryParseMessageRequested>(_onParseMessageRequested);
    on<OrderEntrySaveRequested>(_onSaveRequested);
    on<OrderEntryCleared>(_onCleared);
    on<OrderEntryErrorDismissed>(_onErrorDismissed);
    on<OrderEntrySuccessDismissed>(_onSuccessDismissed);
  }

  final ParseOrderMessageUseCase _parseOrderMessageUseCase;
  final CreateOrderUseCase _createOrderUseCase;
  final AppLogger _logger;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext("OrderEntryBloc");

  void _onStarted(OrderEntryStarted event, Emitter<OrderEntryState> emit) {
    final shopId = event.shopId.trim();
    final shopName = event.shopName.trim().isEmpty ? "My Shop" : event.shopName;

    if (shopId.isEmpty) {
      emit(
        state.copyWith(
          status: OrderEntryStatus.ready,
          shopId: "",
          shopName: shopName,
          errorMessage: "Shop access is not available for this account.",
        ),
      );
      return;
    }

    emit(
      state.copyWith(
        status: OrderEntryStatus.ready,
        shopId: shopId,
        shopName: shopName,
        clearError: true,
      ),
    );
  }

  Future<void> _onParseMessageRequested(
    OrderEntryParseMessageRequested event,
    Emitter<OrderEntryState> emit,
  ) async {
    final shopId = state.shopId?.trim();
    final message = event.message.trim();

    if (shopId == null || shopId.isEmpty) {
      emit(state.copyWith(errorMessage: "Shop access is not available."));
      return;
    }

    if (message.isEmpty) {
      emit(state.copyWith(errorMessage: "Paste a message to parse."));
      return;
    }

    emit(
      state.copyWith(
        status: OrderEntryStatus.parsing,
        clearError: true,
        clearCreatedOrder: true,
        clearParsedOrderMessage: true,
      ),
    );

    final result = await _parseOrderMessageUseCase(
      ParseOrderMessageParams(shopId: shopId, message: message),
    );

    if (isClosed) {
      return;
    }

    result.fold(
      (failure) {
        emit(
          state.copyWith(
            status: OrderEntryStatus.ready,
            errorMessage: failure.message,
          ),
        );
      },
      (parsedMessage) {
        emit(
          state.copyWith(
            status: OrderEntryStatus.ready,
            parsedOrderMessage: parsedMessage,
            clearError: true,
            clearCreatedOrder: true,
          ),
        );
      },
    );
  }

  Future<void> _onSaveRequested(
    OrderEntrySaveRequested event,
    Emitter<OrderEntryState> emit,
  ) async {
    final shopId = state.shopId?.trim();
    if (shopId == null || shopId.isEmpty) {
      emit(state.copyWith(errorMessage: "Shop access is not available."));
      return;
    }

    emit(
      state.copyWith(
        status: OrderEntryStatus.submitting,
        clearError: true,
        clearCreatedOrder: true,
      ),
    );

    final result = await _createOrderUseCase(
      CreateOrderParams(shopId: shopId, draft: event.draft),
    );

    if (isClosed) {
      return;
    }

    result.fold(
      (failure) {
        emit(
          state.copyWith(
            status: OrderEntryStatus.ready,
            errorMessage: failure.message,
          ),
        );
      },
      (createdOrder) {
        emit(
          state.copyWith(
            status: OrderEntryStatus.success,
            createdOrder: createdOrder,
            clearError: true,
          ),
        );
      },
    );
  }

  void _onCleared(OrderEntryCleared event, Emitter<OrderEntryState> emit) {
    emit(
      state.copyWith(
        status: OrderEntryStatus.ready,
        clearParsedOrderMessage: true,
        clearCreatedOrder: true,
        clearError: true,
      ),
    );
  }

  void _onErrorDismissed(
    OrderEntryErrorDismissed event,
    Emitter<OrderEntryState> emit,
  ) {
    emit(state.copyWith(clearError: true));
  }

  void _onSuccessDismissed(
    OrderEntrySuccessDismissed event,
    Emitter<OrderEntryState> emit,
  ) {
    emit(
      state.copyWith(
        status: OrderEntryStatus.ready,
        clearCreatedOrder: true,
        clearError: true,
      ),
    );
  }
}
