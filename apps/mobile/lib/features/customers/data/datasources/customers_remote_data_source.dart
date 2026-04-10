import 'package:app_network/app_network.dart';

import '../models/customer_list_item_model.dart';

abstract class CustomersRemoteDataSource {
  Future<List<CustomerListItemModel>> fetchCustomers({
    required String shopId,
    int limit,
  });

  Future<CustomerListItemModel> fetchCustomerDetail({
    required String shopId,
    required String customerId,
  });
}

class CustomersRemoteDataSourceImpl implements CustomersRemoteDataSource {
  CustomersRemoteDataSourceImpl(this._apiClient);

  static const int _defaultListLimit = 100;

  final ApiClient _apiClient;

  @override
  Future<List<CustomerListItemModel>> fetchCustomers({
    required String shopId,
    int limit = _defaultListLimit,
  }) async {
    final payload = await _apiClient.getList(
      '/shops/$shopId/customers',
      queryParameters: <String, dynamic>{
        'limit': limit,
        'segment': 'all',
        'sort': 'name',
      },
    );

    return payload
        .map(CustomerListItemModel.fromJson)
        .where((customer) => customer.id.isNotEmpty)
        .toList(growable: false);
  }

  @override
  Future<CustomerListItemModel> fetchCustomerDetail({
    required String shopId,
    required String customerId,
  }) async {
    final payload = await _apiClient.getMap(
      '/shops/$shopId/customers/$customerId',
    );

    return CustomerListItemModel.fromJson(payload);
  }
}
