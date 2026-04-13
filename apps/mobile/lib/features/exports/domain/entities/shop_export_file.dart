import 'package:equatable/equatable.dart';

class ShopExportFile extends Equatable {
  const ShopExportFile({required this.filename, required this.path});

  final String filename;
  final String path;

  @override
  List<Object?> get props => [filename, path];
}
