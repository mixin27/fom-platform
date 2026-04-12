import 'package:app_network/app_network.dart';

import '../../domain/entities/customer_draft.dart';
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

  Future<CustomerListItemModel> createCustomer({
    required String shopId,
    required CustomerDraft draft,
  });

  Future<CustomerListItemModel> updateCustomer({
    required String shopId,
    required String customerId,
    required CustomerDraft draft,
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

  @override
  Future<CustomerListItemModel> createCustomer({
    required String shopId,
    required CustomerDraft draft,
  }) async {
    final payload = await _apiClient.postMap(
      '/shops/$shopId/customers',
      data: _draftToPayload(draft),
    );

    return CustomerListItemModel.fromJson(payload);
  }

  @override
  Future<CustomerListItemModel> updateCustomer({
    required String shopId,
    required String customerId,
    required CustomerDraft draft,
  }) async {
    final payload = await _apiClient.patchMap(
      '/shops/$shopId/customers/$customerId',
      data: _draftToPayload(draft),
    );

    return CustomerListItemModel.fromJson(payload);
  }

  Map<String, dynamic> _draftToPayload(CustomerDraft draft) {
    final township = draft.township?.trim();
    final address = draft.address?.trim();
    final notes = draft.notes?.trim();

    return <String, dynamic>{
      'name': draft.name.trim(),
      'phone': draft.phone.trim(),
      if (township != null && township.isNotEmpty) 'township': township,
      if (address != null && address.isNotEmpty) 'address': address,
      if (notes != null && notes.isNotEmpty) 'notes': notes,
    };
  }
}
