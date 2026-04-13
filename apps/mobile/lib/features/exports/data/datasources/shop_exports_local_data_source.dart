import 'dart:io';
import 'dart:typed_data';

import 'package:app_core/app_core.dart';
import 'package:file_picker/file_picker.dart';
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../domain/entities/shop_export_file.dart';

abstract class ShopExportsLocalDataSource {
  Future<ShopExportFile> savePublicFile({
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
}

class ShopExportsLocalDataSourceImpl implements ShopExportsLocalDataSource {
  @override
  Future<ShopExportFile> savePublicFile({
    required Uint8List bytes,
    required String fileName,
    required List<String> allowedExtensions,
  }) async {
    final savedPath = await FilePicker.saveFile(
      dialogTitle: 'Save export file',
      fileName: fileName,
      type: FileType.custom,
      allowedExtensions: allowedExtensions,
      bytes: bytes,
    );

    final normalizedPath = savedPath?.trim() ?? '';
    if (normalizedPath.isEmpty) {
      throw const CacheException('Export save was cancelled.');
    }

    return ShopExportFile(
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
}
