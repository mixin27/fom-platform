import 'package:app_core/app_core.dart';

import '../../../orders/domain/entities/order_list_item.dart';
import '../entities/customer_draft.dart';
import '../entities/customer_list_item.dart';

abstract class CustomersRepository {
  Stream<List<CustomerListItem>> watchCustomers({required String shopId});

  Stream<CustomerListItem?> watchCustomer({
    required String shopId,
    required String customerId,
  });

  Future<Result<void>> refreshCustomers({required String shopId});

  Future<Result<void>> refreshCustomerDetail({
    required String shopId,
    required String customerId,
  });

  Future<Result<CustomerListItem>> createCustomer({
    required String shopId,
    required CustomerDraft draft,
  });

  Future<Result<CustomerListItem>> updateCustomer({
    required String shopId,
    required String customerId,
    required CustomerDraft draft,
  });

  Future<Result<List<OrderListItem>>> fetchCustomerOrders({
    required String shopId,
    required String customerId,
  });

  Future<Result<void>> deleteCustomer({
    required String shopId,
    required String customerId,
  });
}
