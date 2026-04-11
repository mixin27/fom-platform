import "../../domain/entities/order_entry_customer_draft.dart";

class OrderEntryCustomerDraftModel extends OrderEntryCustomerDraft {
  const OrderEntryCustomerDraftModel({
    required super.name,
    required super.phone,
    super.township,
    super.address,
    super.customerId,
  });

  factory OrderEntryCustomerDraftModel.fromJson(Map<String, dynamic> json) {
    return OrderEntryCustomerDraftModel(
      customerId: _asNullableString(json["customer_id"]),
      name: _asNullableString(json["name"]) ?? "",
      phone: _asNullableString(json["phone"]) ?? "",
      township: _asNullableString(json["township"]),
      address: _asNullableString(json["address"]),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      "name": name,
      "phone": phone,
      if ((township ?? "").trim().isNotEmpty) "township": township!.trim(),
      if ((address ?? "").trim().isNotEmpty) "address": address!.trim(),
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
