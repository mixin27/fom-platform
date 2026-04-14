import "package:equatable/equatable.dart";
import "package:fom_mobile/features/orders/domain/entities/order_document_export_format.dart";

enum OrderDocumentExportActionKind { save, share }

class OrderDocumentExportState extends Equatable {
  const OrderDocumentExportState({
    this.activeFormat,
    this.activeAction,
    this.successMessage,
    this.errorMessage,
  });

  final OrderDocumentExportFormat? activeFormat;
  final OrderDocumentExportActionKind? activeAction;
  final String? successMessage;
  final String? errorMessage;

  bool get isBusy => activeFormat != null && activeAction != null;

  bool isFormatBusy(
    OrderDocumentExportFormat format,
    OrderDocumentExportActionKind action,
  ) {
    return activeFormat == format && activeAction == action;
  }

  OrderDocumentExportState copyWith({
    OrderDocumentExportFormat? activeFormat,
    OrderDocumentExportActionKind? activeAction,
    bool clearActive = false,
    String? successMessage,
    String? errorMessage,
    bool clearFeedback = false,
  }) {
    return OrderDocumentExportState(
      activeFormat: clearActive ? null : (activeFormat ?? this.activeFormat),
      activeAction: clearActive ? null : (activeAction ?? this.activeAction),
      successMessage: clearFeedback
          ? null
          : (successMessage ?? this.successMessage),
      errorMessage: clearFeedback ? null : (errorMessage ?? this.errorMessage),
    );
  }

  @override
  List<Object?> get props => [
    activeFormat,
    activeAction,
    successMessage,
    errorMessage,
  ];
}
