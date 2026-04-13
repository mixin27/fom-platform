enum OrderDocumentExportFormat { text, pdf, image }

extension OrderDocumentExportFormatX on OrderDocumentExportFormat {
  String get fileExtension {
    switch (this) {
      case OrderDocumentExportFormat.text:
        return "txt";
      case OrderDocumentExportFormat.pdf:
        return "pdf";
      case OrderDocumentExportFormat.image:
        return "png";
    }
  }

  String get mimeType {
    switch (this) {
      case OrderDocumentExportFormat.text:
        return "text/plain";
      case OrderDocumentExportFormat.pdf:
        return "application/pdf";
      case OrderDocumentExportFormat.image:
        return "image/png";
    }
  }

  String get label {
    switch (this) {
      case OrderDocumentExportFormat.text:
        return "Order information text";
      case OrderDocumentExportFormat.pdf:
        return "Invoice PDF";
      case OrderDocumentExportFormat.image:
        return "Invoice image";
    }
  }
}
