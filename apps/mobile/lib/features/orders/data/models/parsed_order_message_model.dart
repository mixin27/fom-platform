import "../../domain/entities/parsed_order_message.dart";
import "order_entry_draft_model.dart";

class ParsedOrderMessageModel extends ParsedOrderMessage {
  const ParsedOrderMessageModel({
    required super.suggestedOrder,
    required super.subtotal,
    required super.totalPrice,
    required super.isReadyToCreate,
    required super.confidence,
    required super.matchedFields,
    required super.warnings,
    required super.unparsedLines,
    super.customerMatch,
  });

  factory ParsedOrderMessageModel.fromJson(Map<String, dynamic> json) {
    final suggestedOrder = OrderEntryDraftModel.fromParseJson(
      _asMap(json["suggested_order"]),
    );
    final parseMeta = _asMap(json["parse_meta"]);
    final customerMatchPayload = _asNullableMap(json["customer_match"]);

    return ParsedOrderMessageModel(
      suggestedOrder: suggestedOrder,
      subtotal: _asInt(
        _asMap(json["suggested_order"])["subtotal"],
        fallback: suggestedOrder.subtotal,
      ),
      totalPrice: _asInt(
        _asMap(json["suggested_order"])["total_price"],
        fallback: suggestedOrder.totalPrice,
      ),
      isReadyToCreate: _asBool(parseMeta["is_ready_to_create"]),
      confidence: _asDouble(parseMeta["confidence"]),
      matchedFields: _asStringList(parseMeta["matched_fields"]),
      warnings: _asStringList(parseMeta["warnings"]),
      unparsedLines: _asStringList(parseMeta["unparsed_lines"]),
      customerMatch: customerMatchPayload == null
          ? null
          : ParsedOrderCustomerMatchModel.fromJson(customerMatchPayload),
    );
  }
}

class ParsedOrderCustomerMatchModel extends ParsedOrderCustomerMatch {
  const ParsedOrderCustomerMatchModel({
    required super.id,
    required super.shopId,
    required super.name,
    required super.phone,
    required super.createdAt,
    super.township,
    super.address,
    super.notes,
  });

  factory ParsedOrderCustomerMatchModel.fromJson(Map<String, dynamic> json) {
    return ParsedOrderCustomerMatchModel(
      id: _asString(json["id"]),
      shopId: _asString(json["shop_id"]),
      name: _asNullableString(json["name"]) ?? "Customer",
      phone: _asNullableString(json["phone"]) ?? "",
      township: _asNullableString(json["township"]),
      address: _asNullableString(json["address"]),
      notes: _asNullableString(json["notes"]),
      createdAt: _asDateTime(json["created_at"]) ?? DateTime.now(),
    );
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

Map<String, dynamic>? _asNullableMap(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }

  if (value is Map) {
    return Map<String, dynamic>.from(value);
  }

  return null;
}

List<String> _asStringList(dynamic value) {
  if (value is List) {
    return value.map((item) => item.toString()).toList(growable: false);
  }

  return const <String>[];
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

double _asDouble(dynamic value, {double fallback = 0}) {
  if (value is double) {
    return value;
  }

  if (value is num) {
    return value.toDouble();
  }

  return double.tryParse(_asString(value)) ?? fallback;
}

bool _asBool(dynamic value) {
  if (value is bool) {
    return value;
  }

  if (value is num) {
    return value != 0;
  }

  final normalized = _asString(value).trim().toLowerCase();
  return normalized == "true" || normalized == "1" || normalized == "yes";
}

DateTime? _asDateTime(dynamic value) {
  final raw = _asNullableString(value);
  if (raw == null) {
    return null;
  }

  return DateTime.tryParse(raw)?.toLocal();
}
