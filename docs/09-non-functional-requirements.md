# Non-Functional Requirements

## Performance
- Order list should render 50 items under 1 second
- Search and filter operations should complete under 500 ms

## Reliability
- Offline entry must never lose data
- Background sync retries on reconnect

## Security
- All data access scoped to shop_id
- Role-based access for owners and staff
- Encrypted transport for all network traffic

## Privacy
- Store only required customer data
- Allow deletion of customers and orders
- Provide clear consent wording

## Usability
- New user should create first order in under 2 minutes
- Burmese UI must be readable on low-end devices

## Maintainability
- Clear data model and API boundaries
- Automated tests for core flows

## Observability
- Track crash rate, app launch time, and sync failures
