import "package:equatable/equatable.dart";
import "package:fom_mobile/features/orders/domain/entities/order_details.dart";
import "package:fom_mobile/features/orders/domain/entities/order_document_export_format.dart";

sealed class OrderDocumentExportEvent extends Equatable {
  const OrderDocumentExportEvent();

  @override
  List<Object?> get props => const [];
}

class OrderDocumentSaveRequested extends OrderDocumentExportEvent {
  const OrderDocumentSaveRequested({
    required this.order,
    required this.shopName,
    required this.format,
  });

  final OrderDetails order;
  final String shopName;
  final OrderDocumentExportFormat format;

  @override
  List<Object?> get props => [order, shopName, format];
}

class OrderDocumentShareRequested extends OrderDocumentExportEvent {
  const OrderDocumentShareRequested({
    required this.order,
    required this.shopName,
    required this.format,
  });

  final OrderDetails order;
  final String shopName;
  final OrderDocumentExportFormat format;

  @override
  List<Object?> get props => [order, shopName, format];
}

class OrderDocumentExportFeedbackDismissed extends OrderDocumentExportEvent {
  const OrderDocumentExportFeedbackDismissed();
}
