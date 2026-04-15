import 'package:equatable/equatable.dart';

enum ShopExportActionKind { save, share, importFile }

class ShopExportState extends Equatable {
  const ShopExportState({
    this.activeDataset,
    this.activeAction,
    this.successMessage,
    this.errorMessage,
  });

  final String? activeDataset;
  final ShopExportActionKind? activeAction;
  final String? successMessage;
  final String? errorMessage;

  bool get isBusy => (activeDataset ?? '').trim().isNotEmpty;

  bool isDatasetBusy(String dataset, ShopExportActionKind action) {
    return activeDataset == dataset && activeAction == action;
  }

  ShopExportState copyWith({
    String? activeDataset,
    ShopExportActionKind? activeAction,
    String? successMessage,
    String? errorMessage,
    bool clearActive = false,
    bool clearFeedback = false,
  }) {
    return ShopExportState(
      activeDataset: clearActive ? null : (activeDataset ?? this.activeDataset),
      activeAction: clearActive ? null : (activeAction ?? this.activeAction),
      successMessage: clearFeedback
          ? null
          : (successMessage ?? this.successMessage),
      errorMessage: clearFeedback ? null : (errorMessage ?? this.errorMessage),
    );
  }

  @override
  List<Object?> get props => [
    activeDataset,
    activeAction,
    successMessage,
    errorMessage,
  ];
}
