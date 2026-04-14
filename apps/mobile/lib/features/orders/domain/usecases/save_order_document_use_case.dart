import "package:app_core/app_core.dart";
import "package:fom_mobile/features/orders/domain/entities/order_details.dart";
import "package:fom_mobile/features/orders/domain/entities/order_document_export_format.dart";
import "package:fom_mobile/features/orders/domain/entities/order_document_file.dart";
import "package:fom_mobile/features/orders/domain/repositories/order_document_repository.dart";

class SaveOrderDocumentUseCase
    implements UseCase<OrderDocumentFile, SaveOrderDocumentParams> {
  const SaveOrderDocumentUseCase(this._repository);

  final OrderDocumentRepository _repository;

  @override
  Future<Result<OrderDocumentFile>> call(SaveOrderDocumentParams params) {
    return _repository.saveOrderDocument(
      order: params.order,
      shopName: params.shopName,
      format: params.format,
    );
  }
}

class SaveOrderDocumentParams {
  const SaveOrderDocumentParams({
    required this.order,
    required this.shopName,
    required this.format,
  });

  final OrderDetails order;
  final String shopName;
  final OrderDocumentExportFormat format;
}
