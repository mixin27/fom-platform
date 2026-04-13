import "package:app_core/app_core.dart";
import "package:fom_mobile/features/orders/domain/entities/order_details.dart";
import "package:fom_mobile/features/orders/domain/entities/order_document_export_format.dart";
import "package:fom_mobile/features/orders/domain/entities/order_document_file.dart";

abstract class OrderDocumentRepository {
  Future<Result<OrderDocumentFile>> saveOrderDocument({
    required OrderDetails order,
    required String shopName,
    required OrderDocumentExportFormat format,
  });

  Future<Result<void>> shareOrderDocument({
    required OrderDetails order,
    required String shopName,
    required OrderDocumentExportFormat format,
  });
}
