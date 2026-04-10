import 'package:app_core/app_core.dart';

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
}
