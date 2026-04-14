import "package:app_core/app_core.dart";
import "package:app_logger/app_logger.dart";
import "package:fom_mobile/features/orders/data/datasources/order_document_local_data_source.dart";
import "package:fom_mobile/features/orders/data/services/order_document_generator.dart";
import "package:fom_mobile/features/orders/domain/entities/order_details.dart";
import "package:fom_mobile/features/orders/domain/entities/order_document_export_format.dart";
import "package:fom_mobile/features/orders/domain/entities/order_document_file.dart";
import "package:fom_mobile/features/orders/domain/repositories/order_document_repository.dart";

class OrderDocumentRepositoryImpl
    with LoggerMixin
    implements OrderDocumentRepository {
  OrderDocumentRepositoryImpl(
    this._generator,
    this._localDataSource, {
    AppLogger? logger,
  }) : _logger = logger ?? AppLogger(enabled: false);

  final OrderDocumentGenerator _generator;
  final OrderDocumentLocalDataSource _localDataSource;
  final AppLogger _logger;

  @override
  AppLogger get logger => _logger;

  @override
  LogContext get logContext => const LogContext("OrderDocumentRepository");

  @override
  Future<Result<OrderDocumentFile>> saveOrderDocument({
    required OrderDetails order,
    required String shopName,
    required OrderDocumentExportFormat format,
  }) async {
    try {
      final document = await _generator.generate(
        order: order,
        shopName: shopName,
        format: format,
      );
      final bytes = document.bytes;
      if (bytes == null) {
        throw const CacheException("Document bytes are unavailable for save.");
      }

      final file = await _localDataSource.saveFile(
        bytes: bytes,
        fileName: document.fileName,
        allowedExtensions: <String>[format.fileExtension],
      );

      log.info("Order document saved: order=${order.id}, format=$format");
      return Result<OrderDocumentFile>.success(file);
    } catch (error, stackTrace) {
      log.error(
        "Failed to save order document",
        error: error,
        stackTrace: stackTrace,
      );
      return Result<OrderDocumentFile>.failure(FailureMapper.from(error));
    }
  }

  @override
  Future<Result<void>> shareOrderDocument({
    required OrderDetails order,
    required String shopName,
    required OrderDocumentExportFormat format,
  }) async {
    try {
      final document = await _generator.generate(
        order: order,
        shopName: shopName,
        format: format,
      );

      if (format == OrderDocumentExportFormat.text) {
        final text = document.shareText?.trim() ?? "";
        if (text.isEmpty) {
          throw const CacheException("Document text is unavailable for share.");
        }

        await _localDataSource.shareText(subject: document.subject, text: text);
      } else {
        final bytes = document.bytes;
        if (bytes == null) {
          throw const CacheException(
            "Document bytes are unavailable for share.",
          );
        }

        await _localDataSource.shareFile(
          bytes: bytes,
          fileName: document.fileName,
          mimeType: document.mimeType,
          subject: document.subject,
          text: document.shareText,
        );
      }

      log.info("Order document shared: order=${order.id}, format=$format");
      return Result<void>.success(null);
    } catch (error, stackTrace) {
      log.error(
        "Failed to share order document",
        error: error,
        stackTrace: stackTrace,
      );
      return Result<void>.failure(FailureMapper.from(error));
    }
  }
}
