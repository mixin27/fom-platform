# BLoC State Management Rules

The Business Logic Component (BLoC) pattern is the standard for state management in this project.

## Standard Structure

Each Bloc must consist of three files:
1. `something_bloc.dart`: The logic and event handling.
2. `something_event.dart`: The input actions.
3. `something_state.dart`: The output states.

## General Rules

- **Use Equatable**: All States and Events must extend `Equatable` to ensure efficient re-renders.
- **Naming Conventions**:
  - Events: `<Verb><Noun>Event` (e.g., `FetchOrdersEvent`, `UpdateProfileEvent`).
  - States: `<Noun><Status>State` (e.g., `OrdersLoadingState`, `OrdersSuccessState`).
- **One Bloc per Feature/Page**: Avoid a single "Global Bloc". Create focused Blocs for specific UI sections or flows.
- **Immutable States**: Always yield new instances of the state. Use `copyWith` pattern.

## Implementation Pattern

### 1. Events
```dart
abstract class OrdersEvent extends Equatable {
  const OrdersEvent();
  @override
  List<Object?> get props => [];
}

class OrdersFetchRequested extends OrdersEvent {}
```

### 2. States
```dart
abstract class OrdersState extends Equatable {
  const OrdersState();
}

class OrdersInitial extends OrdersState {
  @override
  List<Object?> get props => [];
}

class OrdersLoadSuccess extends OrdersState {
  final List<Order> orders;
  const OrdersLoadSuccess(this.orders);
  
  @override
  List<Object?> get props => [orders];
}
```

### 3. Bloc Logic
```dart
class OrdersBloc extends Bloc<OrdersEvent, OrdersState> {
  final IOrderRepository _repository;

  OrdersBloc(this._repository) : super(OrdersInitial()) {
    on<OrdersFetchRequested>(_onFetchRequested);
  }

  Future<void> _onFetchRequested(
    OrdersFetchRequested event,
    Emitter<OrdersState> emit,
  ) async {
    emit(OrdersLoadInProgress()); // Optional: emit loading
    try {
      final orders = await _repository.getOrders();
      emit(OrdersLoadSuccess(orders));
    } catch (e) {
      emit(OrdersLoadFailure(e.toString()));
    }
  }
}
```

## UI Bindings

- **BlocProvider**: Provide the Bloc as high as needed, but no higher.
- **BlocBuilder**: Use for redrawing widgets based on state.
- **BlocListener**: Use for one-time actions like navigation or showing snackbars.
- **buildWhen / listenWhen**: Use these to optimize performance by filtering which state changes trigger a rebuild/action.
