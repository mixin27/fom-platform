import "package:app_core/app_core.dart";
import "package:fom_mobile/features/orders/domain/entities/order_details.dart";
import "package:fom_mobile/features/orders/domain/entities/order_document_export_format.dart";
import "package:fom_mobile/features/orders/domain/repositories/order_document_repository.dart";

class ShareOrderDocumentUseCase
    implements VoidUseCase<ShareOrderDocumentParams> {
  const ShareOrderDocumentUseCase(this._repository);

  final OrderDocumentRepository _repository;

  @override
  Future<Result<void>> call(ShareOrderDocumentParams params) {
    return _repository.shareOrderDocument(
      order: params.order,
      shopName: params.shopName,
      format: params.format,
    );
  }
}

class ShareOrderDocumentParams {
  const ShareOrderDocumentParams({
    required this.order,
    required this.shopName,
    required this.format,
  });

  final OrderDetails order;
  final String shopName;
  final OrderDocumentExportFormat format;
}
