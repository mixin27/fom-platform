# Requirements

## Functional Requirements
- Create orders manually with customer name, phone, address, product, price, and status
- View orders in a simple list
- Filter orders by Today, Pending, Delivered
- Update order status in one tap
- View daily summary with total orders, revenue, delivered vs pending
- Support Burmese language UI
- Basic authentication for sellers
- Data isolation per seller or shop

## Non-Functional Requirements
- App launch time under 3 seconds on low-end Android devices
- Order list loads in under 2 seconds for 500 orders
- Offline-first data entry with sync on reconnect
- Secure storage of customer phone numbers
- Data backups and recovery plan
- 99.5% monthly uptime target for backend services

## Data Requirements
- Store order status history for audit
- Store timestamps for creation and updates
- Maintain customer contact details
- Support multiple orders per customer

## Compliance and Privacy
- Collect only necessary personal data
- Provide clear consent text for storing phone numbers
- Allow seller to delete customer records

## Constraints
- Avoid Facebook API integration in MVP
- Must be usable in Burmese language only mode
- Keep UI minimal and fast

## Assumptions
- Most users will use Android
- Sellers will copy and paste order info from Messenger
- Sellers need daily summary more than complex reporting
