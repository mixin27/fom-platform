import 'package:app_core/app_core.dart';

import '../../../orders/domain/entities/order_list_item.dart';
import '../repositories/customers_repository.dart';

class FetchCustomerOrdersUseCase
    implements UseCase<List<OrderListItem>, FetchCustomerOrdersParams> {
  const FetchCustomerOrdersUseCase(this._repository);

  final CustomersRepository _repository;

  @override
  Future<Result<List<OrderListItem>>> call(FetchCustomerOrdersParams params) {
    return _repository.fetchCustomerOrders(
      shopId: params.shopId,
      customerId: params.customerId,
    );
  }
}

class FetchCustomerOrdersParams {
  const FetchCustomerOrdersParams({
    required this.shopId,
    required this.customerId,
  });

  final String shopId;
  final String customerId;
}
