import "package:app_ui_kit/app_ui_kit.dart";
import "package:flutter/material.dart";
import "package:flutter_bloc/flutter_bloc.dart";
import "package:fom_mobile/app/di/injection_container.dart";
import "package:fom_mobile/app/router/app_route_paths.dart";
import "package:go_router/go_router.dart";
import "package:intl/intl.dart";

import "../../domain/entities/customer_list_item.dart";
import "../../domain/usecases/create_customer_use_case.dart";
import "../bloc/customers_home_bloc.dart";
import "../bloc/customers_home_event.dart";
import "../bloc/customers_home_state.dart";
import "../models/customers_home_tab.dart";
import "../widgets/customer_editor_sheet.dart";

class CustomersHomePage extends StatelessWidget {
  const CustomersHomePage({
    super.key,
    required this.initialShopId,
    required this.initialShopName,
  });

  final String initialShopId;
  final String initialShopName;

  @override
  Widget build(BuildContext context) {
    return BlocProvider<CustomersHomeBloc>.value(
      value: getIt<CustomersHomeBloc>(),
      child: _CustomersHomeView(
        initialShopId: initialShopId,
        initialShopName: initialShopName,
      ),
    );
  }
}

class _CustomersHomeView extends StatefulWidget {
  const _CustomersHomeView({
    required this.initialShopId,
    required this.initialShopName,
  });

  final String initialShopId;
  final String initialShopName;

  @override
  State<_CustomersHomeView> createState() => _CustomersHomeViewState();
}

class _CustomersHomeViewState extends State<_CustomersHomeView> {
  late final TextEditingController _searchController;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
    _searchController.addListener(_onSearchChanged);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CustomersHomeBloc>().add(
        CustomersHomeStarted(
          shopId: widget.initialShopId,
          shopName: widget.initialShopName,
        ),
      );
    });
  }

  @override
  void dispose() {
    _searchController
      ..removeListener(_onSearchChanged)
      ..dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<CustomersHomeBloc, CustomersHomeState>(
      listenWhen: (previous, current) {
        return previous.errorMessage != current.errorMessage &&
            current.errorMessage != null;
      },
      listener: (context, state) {
        final message = state.errorMessage;
        if (message == null || message.isEmpty) {
          return;
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
        );
        context.read<CustomersHomeBloc>().add(
          const CustomersHomeErrorDismissed(),
        );
      },
      builder: (context, state) {
        final tabs = kCustomersHomeTabs
            .map((tab) => "${tab.title} (${state.countForTab(tab)})")
            .toList(growable: false);

        return Scaffold(
          backgroundColor: AppColors.background,
          floatingActionButton: state.shopId == null
              ? null
              : AppFAB(
                  icon: const Icon(Icons.person_add_alt_1_rounded),
                  onPressed: () => _openCreateCustomerSheet(context, state),
                ),
          body: RefreshIndicator(
            onRefresh: () => _onRefresh(context),
            color: AppColors.softOrange,
            child: SafeArea(
              bottom: false,
              child: Stack(
                children: [
                  CustomScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    slivers: [
                      SliverToBoxAdapter(
                        child: AppCustomersHomeHeader(
                          title: "Customers",
                          subtitle: "${state.totalCustomersCount} tracked",
                          searchHintText: "Search name, phone, township...",
                          tabs: tabs,
                          selectedTabIndex: state.selectedTab.index,
                          onTabSelected: (index) {
                            context.read<CustomersHomeBloc>().add(
                              CustomersHomeTabChanged(
                                kCustomersHomeTabs[index],
                              ),
                            );
                          },
                          searchController: _searchController,
                          onSortPressed: () {
                            context.read<CustomersHomeBloc>().add(
                              const CustomersHomeTabChanged(
                                CustomersHomeTab.topSpenders,
                              ),
                            );
                          },
                          onAddPressed: state.shopId == null
                              ? null
                              : () => _openCreateCustomerSheet(context, state),
                        ),
                      ),
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                        sliver: SliverToBoxAdapter(
                          child: Row(
                            children: [
                              Expanded(
                                child: AppSummaryCard(
                                  label: "Customers",
                                  value: "${state.totalCustomersCount}",
                                  changeText: "Total",
                                  isPositiveChange: true,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: AppSummaryCard(
                                  label: "VIP",
                                  value: "${state.vipCustomersCount}",
                                  valueColor: AppColors.softOrange,
                                  changeText: "High value",
                                  changeColor: AppColors.softOrange,
                                  isPositiveChange: true,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: AppSummaryCard(
                                  label: "New This Week",
                                  value: "${state.newThisWeekCustomersCount}",
                                  valueColor: AppColors.teal,
                                  changeText: "Fresh leads",
                                  changeColor: AppColors.teal,
                                  isPositiveChange: true,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      ..._buildCustomerSlivers(state),
                    ],
                  ),
                  if (state.alphabetIndex.isNotEmpty)
                    _AlphabetIndex(letters: state.alphabetIndex),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  List<Widget> _buildCustomerSlivers(CustomersHomeState state) {
    if (state.status == CustomersHomeStatus.loading && !state.hasCustomers) {
      return const [
        SliverFillRemaining(
          hasScrollBody: false,
          child: Center(child: CircularProgressIndicator()),
        ),
      ];
    }

    if (state.filteredCustomers.isEmpty) {
      return [
        SliverFillRemaining(
          hasScrollBody: false,
          child: AppEmptyState(
            icon: const Icon(Icons.group_outlined),
            title: state.searchQuery.trim().isEmpty
                ? "No customers yet"
                : "No matching customers",
            message: state.searchQuery.trim().isEmpty
                ? "Customers will appear here after sync."
                : "Try another keyword or clear search.",
          ),
        ),
      ];
    }

    final grouped = <String, List<CustomerListItem>>{};
    for (final customer in state.filteredCustomers) {
      grouped.putIfAbsent(customer.firstLetter, () => <CustomerListItem>[]);
      grouped[customer.firstLetter]!.add(customer);
    }

    final sectionKeys = grouped.keys.toList(growable: false)..sort();
    final children = <Widget>[];

    for (final key in sectionKeys) {
      children.add(AppOrdersSectionLabel(title: key));
      for (final customer in grouped[key]!) {
        children.add(
          AppCustomerCard(
            name: customer.name,
            phone: customer.phone,
            township: customer.township,
            spentText: "${_formatCompactAmount(customer.totalSpent)} MMK",
            ordersText:
                "${customer.totalOrders} ${customer.totalOrders == 1 ? "order" : "orders"}",
            lastActiveText: _formatLastActive(customer.lastOrderAt),
            isVip: customer.isVip,
            isNewThisWeek: customer.isNewThisWeek,
            imageUrl: customer.avatarUrl,
            avatarBackgroundColor: _avatarBackground(customer),
            onTap: () => context.push(
              AppRoutePaths.customerProfile.replaceFirst(":id", customer.id),
            ),
          ),
        );
      }
    }

    children.add(const SizedBox(height: 96));

    return [
      SliverPadding(
        padding: const EdgeInsets.fromLTRB(16, 2, 32, 0),
        sliver: SliverList(delegate: SliverChildListDelegate(children)),
      ),
    ];
  }

  Color _avatarBackground(CustomerListItem customer) {
    if (customer.isVip) {
      return AppColors.softOrangeLight;
    }

    if (customer.isNewThisWeek) {
      return AppColors.tealLight;
    }

    final index = customer.id.hashCode.abs() % 4;
    switch (index) {
      case 0:
        return AppColors.purpleLight;
      case 1:
        return AppColors.greenLight;
      case 2:
        return AppColors.yellowLight;
      default:
        return AppColors.softOrangeLight;
    }
  }

  Future<void> _onRefresh(BuildContext context) async {
    context.read<CustomersHomeBloc>().add(
      const CustomersHomeRefreshRequested(),
    );
    await Future<void>.delayed(const Duration(milliseconds: 800));
  }

  void _onSearchChanged() {
    context.read<CustomersHomeBloc>().add(
      CustomersHomeSearchChanged(_searchController.text),
    );
  }

  String _formatCompactAmount(int amount) {
    if (amount.abs() >= 1000) {
      final compact = amount / 1000;
      final hasFraction = compact.truncateToDouble() != compact;
      return "${compact.toStringAsFixed(hasFraction ? 1 : 0)}K";
    }

    return NumberFormat.decimalPattern().format(amount);
  }

  String _formatLastActive(DateTime? lastOrderAt) {
    if (lastOrderAt == null) {
      return "No orders";
    }

    final now = DateTime.now();
    if (_isSameDay(now, lastOrderAt)) {
      return "Today";
    }

    final yesterday = now.subtract(const Duration(days: 1));
    if (_isSameDay(yesterday, lastOrderAt)) {
      return "Yesterday";
    }

    final difference = now.difference(lastOrderAt).inDays;
    if (difference < 7) {
      return "${difference}d ago";
    }

    return DateFormat("MMM d").format(lastOrderAt);
  }

  bool _isSameDay(DateTime left, DateTime right) {
    return left.year == right.year &&
        left.month == right.month &&
        left.day == right.day;
  }

  Future<void> _openCreateCustomerSheet(
    BuildContext context,
    CustomersHomeState state,
  ) async {
    final shopId = state.shopId?.trim() ?? '';
    if (shopId.isEmpty) {
      return;
    }

    final result = await showModalBottomSheet<CustomerEditorSheetResult>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => CustomerEditorSheet(
        title: 'Add Customer',
        submitLabel: 'Save Customer',
        onSubmitted: (draft) async {
          final createResult = await getIt<CreateCustomerUseCase>().call(
            CreateCustomerParams(shopId: shopId, draft: draft),
          );
          final failure = createResult.failureOrNull;

          if (failure != null) {
            throw Exception(failure.message);
          }
        },
      ),
    );

    if (!context.mounted || result != CustomerEditorSheetResult.saved) {
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Customer saved successfully.'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}

class _AlphabetIndex extends StatelessWidget {
  const _AlphabetIndex({required this.letters});

  final List<String> letters;

  @override
  Widget build(BuildContext context) {
    return Positioned(
      right: 8,
      top: 0,
      bottom: 0,
      child: IgnorePointer(
        child: Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.warmWhite.withValues(alpha: 0.72),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.border, width: 1),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: letters
                  .map(
                    (letter) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: Text(
                        letter,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: AppColors.textLight,
                          fontSize: 9,
                        ),
                      ),
                    ),
                  )
                  .toList(growable: false),
            ),
          ),
        ),
      ),
    );
  }
}
