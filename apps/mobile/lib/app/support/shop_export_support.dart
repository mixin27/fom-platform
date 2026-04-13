import 'dart:io';

import 'package:app_network/app_network.dart';
import 'package:intl/intl.dart';
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';

class ShopExportFile {
  const ShopExportFile({required this.filename, required this.path});

  final String filename;
  final String path;
}

Future<ShopExportFile> downloadShopExportCsv({
  required ApiClient apiClient,
  required String shopId,
  required String shopName,
  required String dataset,
}) async {
  final bytes = await apiClient.getBytes('/shops/$shopId/exports/$dataset.csv');
  final directory = await getApplicationDocumentsDirectory();
  final timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
  final safeShopName = _slugify(shopName);
  final filename = '$safeShopName-$dataset-$timestamp.csv';
  final file = File(path.join(directory.path, filename));

  await file.writeAsBytes(bytes, flush: true);

  return ShopExportFile(filename: filename, path: file.path);
}

String _slugify(String value) {
  final normalized = value
      .trim()
      .toLowerCase()
      .replaceAll(RegExp(r'[^a-z0-9]+'), '-')
      .replaceAll(RegExp(r'^-+|-+$'), '');

  return normalized.isEmpty ? 'shop' : normalized;
}
