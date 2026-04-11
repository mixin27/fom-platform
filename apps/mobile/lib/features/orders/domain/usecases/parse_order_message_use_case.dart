import "package:app_core/app_core.dart";

import "../entities/parsed_order_message.dart";
import "../repositories/orders_repository.dart";

class ParseOrderMessageUseCase
    implements UseCase<ParsedOrderMessage, ParseOrderMessageParams> {
  const ParseOrderMessageUseCase(this._repository);

  final OrdersRepository _repository;

  @override
  Future<Result<ParsedOrderMessage>> call(ParseOrderMessageParams params) {
    return _repository.parseOrderMessage(
      shopId: params.shopId,
      message: params.message,
    );
  }
}

class ParseOrderMessageParams {
  const ParseOrderMessageParams({required this.shopId, required this.message});

  final String shopId;
  final String message;
}
