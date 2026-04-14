import 'dart:io';
import 'dart:typed_data';

import 'package:app_core/app_core.dart';
import 'package:file_picker/file_picker.dart';
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../domain/entities/shop_export_file.dart';

class PickedImportFile {
  const PickedImportFile({
    required this.fileName,
    required this.bytes,
  });

  final String fileName;
  final Uint8List bytes;
}

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

  Future<PickedImportFile> pickImportFile({
    required List<String> allowedExtensions,
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

  @override
  Future<PickedImportFile> pickImportFile({
    required List<String> allowedExtensions,
  }) async {
    final result = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: allowedExtensions,
      withData: true,
    );

    final files = result?.files ?? const <PlatformFile>[];
    if (files.isEmpty) {
      throw const CacheException('Order import was cancelled.');
    }
    final pickedFile = files.first;

    final normalizedName = (pickedFile.name).trim();
    if (normalizedName.isEmpty) {
      throw const CacheException('The selected import file is missing a name.');
    }

    final bytes = pickedFile.bytes;
    if (bytes != null && bytes.isNotEmpty) {
      return PickedImportFile(fileName: normalizedName, bytes: bytes);
    }

    final normalizedPath = (pickedFile.path ?? '').trim();
    if (normalizedPath.isEmpty) {
      throw const CacheException('The selected import file could not be read.');
    }

    final file = File(normalizedPath);
    if (!await file.exists()) {
      throw const CacheException('The selected import file no longer exists.');
    }

    return PickedImportFile(
      fileName: normalizedName,
      bytes: await file.readAsBytes(),
    );
  }
}
