import "../../domain/entities/order_entry_draft.dart";
import "../../domain/entities/order_source.dart";
import "../../domain/entities/order_status.dart";
import "order_entry_customer_draft_model.dart";
import "order_entry_item_draft_model.dart";

class OrderEntryDraftModel extends OrderEntryDraft {
  const OrderEntryDraftModel({
    required super.customer,
    required super.items,
    required super.status,
    required super.source,
    super.deliveryFee,
    super.note,
    super.currency,
  });

  factory OrderEntryDraftModel.fromEntity(OrderEntryDraft entity) {
    return OrderEntryDraftModel(
      customer: entity.customer,
      items: entity.items,
      status: entity.status,
      source: entity.source,
      deliveryFee: entity.deliveryFee,
      note: entity.note,
      currency: entity.currency,
    );
  }

  factory OrderEntryDraftModel.fromParseJson(Map<String, dynamic> json) {
    final customer = OrderEntryCustomerDraftModel.fromJson(
      _asMap(json["customer"]),
    );
    final items = _asMapList(
      json["items"],
    ).map(OrderEntryItemDraftModel.fromJson).toList(growable: false);

    return OrderEntryDraftModel(
      customer: customer,
      items: items,
      status: OrderStatus.fromApiValue(_asString(json["status"])),
      source: OrderSource.fromApiValue(_asString(json["source"])),
      deliveryFee: _asInt(json["delivery_fee"]),
      note: _asNullableString(json["note"]),
      currency: _asNullableString(json["currency"]) ?? "MMK",
    );
  }

  Map<String, dynamic> toCreatePayload() {
    final customerId = (customer.customerId ?? "").trim();
    final noteText = (note ?? "").trim();

    return <String, dynamic>{
      if (customerId.isNotEmpty) "customer_id": customerId,
      if (customerId.isEmpty)
        "customer": OrderEntryCustomerDraftModel(
          customerId: customer.customerId,
          name: customer.name,
          phone: customer.phone,
          township: customer.township,
          address: customer.address,
        ).toJson(),
      "items": items
          .map(
            (item) => OrderEntryItemDraftModel(
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            ).toJson(),
          )
          .toList(growable: false),
      "status": status.apiValue,
      "source": source.apiValue,
      "delivery_fee": deliveryFee,
      "currency": currency,
      if (noteText.isNotEmpty) "note": noteText,
    };
  }
}

Map<String, dynamic> _asMap(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }

  if (value is Map) {
    return Map<String, dynamic>.from(value);
  }

  return const <String, dynamic>{};
}

List<Map<String, dynamic>> _asMapList(dynamic value) {
  if (value is List) {
    return value
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList(growable: false);
  }

  return const <Map<String, dynamic>>[];
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

  return int.tryParse(_asString(value)) ?? fallback;
}
