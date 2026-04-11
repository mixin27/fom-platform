import "../../domain/entities/order_entry_item_draft.dart";

class OrderEntryItemDraftModel extends OrderEntryItemDraft {
  const OrderEntryItemDraftModel({
    required super.productName,
    required super.quantity,
    required super.unitPrice,
    super.productId,
  });

  factory OrderEntryItemDraftModel.fromJson(Map<String, dynamic> json) {
    return OrderEntryItemDraftModel(
      productId: _asNullableString(json["product_id"]),
      productName: _asNullableString(json["product_name"]) ?? "",
      quantity: _asInt(json["qty"], fallback: 1),
      unitPrice: _asInt(json["unit_price"]),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      if ((productId ?? "").trim().isNotEmpty) "product_id": productId!.trim(),
      "product_name": productName,
      "qty": quantity,
      "unit_price": unitPrice,
    };
  }
}

String _asString(dynamic value) {
  if (value == null) {
    return "";
  }

  return value.toString();
}

String? _asNullableString(dynamic value) {
  final raw = _asString(value).trim();
  if (raw.isEmpty) {
    return null;
  }

  return raw;
}

int _asInt(dynamic value, {int fallback = 0}) {
  if (value is int) {
    return value;
  }

  if (value is num) {
    return value.toInt();
  }

  final parsed = int.tryParse(_asString(value));
  return parsed ?? fallback;
}
