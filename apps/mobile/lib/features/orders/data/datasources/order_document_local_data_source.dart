import "dart:io";
import "dart:typed_data";

import "package:app_core/app_core.dart";
import "package:file_picker/file_picker.dart";
import "package:fom_mobile/features/orders/domain/entities/order_document_file.dart";
import "package:path/path.dart" as path;
import "package:path_provider/path_provider.dart";
import "package:share_plus/share_plus.dart";

abstract class OrderDocumentLocalDataSource {
  Future<OrderDocumentFile> saveFile({
    required Uint8List bytes,
    required String fileName,
    required List<String> allowedExtensions,
  });

  Future<void> shareFile({
    required Uint8List bytes,
    required String fileName,
    required String mimeType,
    required String subject,
    String? text,
  });

  Future<void> shareText({required String subject, required String text});
}

class OrderDocumentLocalDataSourceImpl implements OrderDocumentLocalDataSource {
  @override
  Future<OrderDocumentFile> saveFile({
    required Uint8List bytes,
    required String fileName,
    required List<String> allowedExtensions,
  }) async {
    final savedPath = await FilePicker.saveFile(
      dialogTitle: "Save customer document",
      fileName: fileName,
      type: FileType.custom,
      allowedExtensions: allowedExtensions,
      bytes: bytes,
    );

    final normalizedPath = savedPath?.trim() ?? "";
    if (normalizedPath.isEmpty) {
      throw const CacheException("Document save was cancelled.");
    }

    return OrderDocumentFile(
      filename: path.basename(normalizedPath),
      path: normalizedPath,
    );
  }

  @override
  Future<void> shareFile({
    required Uint8List bytes,
    required String fileName,
    required String mimeType,
    required String subject,
    String? text,
  }) async {
    final tempDirectory = await getTemporaryDirectory();
    final file = File(path.join(tempDirectory.path, fileName));
    await file.writeAsBytes(bytes, flush: true);

    await SharePlus.instance.share(
      ShareParams(
        files: <XFile>[XFile(file.path, mimeType: mimeType)],
        subject: subject,
        text: text,
      ),
    );
  }

  @override
  Future<void> shareText({required String subject, required String text}) {
    return SharePlus.instance.share(ShareParams(subject: subject, text: text));
  }
}
