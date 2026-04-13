import "package:equatable/equatable.dart";

class OrderDocumentFile extends Equatable {
  const OrderDocumentFile({required this.filename, required this.path});

  final String filename;
  final String path;

  @override
  List<Object?> get props => [filename, path];
}
