# Data Dictionary

## Users
| Field | Type | Notes |
| --- | --- | --- |
| id | string | Primary key |
| name | string | Display name |
| phone | string | E.164 format |
| locale | string | Default `my` for Burmese |
| created_at | datetime | Server timestamp |

## Shops
| Field | Type | Notes |
| --- | --- | --- |
| id | string | Primary key |
| owner_user_id | string | References users.id |
| name | string | Shop name |
| timezone | string | IANA timezone |
| created_at | datetime | Server timestamp |

## Shop Members
| Field | Type | Notes |
| --- | --- | --- |
| id | string | Primary key |
| shop_id | string | References shops.id |
| user_id | string | References users.id |
| role | string | owner, staff |
| status | string | active, invited, disabled |
| created_at | datetime | Server timestamp |

## Customers
| Field | Type | Notes |
| --- | --- | --- |
| id | string | Primary key |
| shop_id | string | References shops.id |
| name | string | Customer name |
| phone | string | Optional but recommended |
| address | string | Delivery address |
| notes | string | Optional |
| created_at | datetime | Server timestamp |

## Products
| Field | Type | Notes |
| --- | --- | --- |
| id | string | Primary key |
| shop_id | string | References shops.id |
| name | string | Product name |
| price | number | Default price |
| currency | string | MMK by default |
| is_active | boolean | Soft delete flag |

## Orders
| Field | Type | Notes |
| --- | --- | --- |
| id | string | Primary key |
| shop_id | string | References shops.id |
| customer_id | string | References customers.id |
| order_no | string | Human-friendly ID |
| status | string | new, confirmed, out_for_delivery, delivered |
| total_price | number | Order total |
| currency | string | MMK by default |
| note | string | Optional |
| source | string | messenger, manual |
| created_at | datetime | Server timestamp |
| updated_at | datetime | Server timestamp |

## Order Items
| Field | Type | Notes |
| --- | --- | --- |
| id | string | Primary key |
| order_id | string | References orders.id |
| product_id | string | Optional reference |
| product_name | string | Snapshot name |
| qty | number | Quantity |
| unit_price | number | Price per unit |
| line_total | number | qty * unit_price |

## Order Status Events
| Field | Type | Notes |
| --- | --- | --- |
| id | string | Primary key |
| order_id | string | References orders.id |
| from_status | string | Previous status |
| to_status | string | New status |
| changed_by_user_id | string | References users.id |
| changed_at | datetime | Server timestamp |

## Deliveries
| Field | Type | Notes |
| --- | --- | --- |
| id | string | Primary key |
| order_id | string | References orders.id |
| driver_user_id | string | References users.id |
| status | string | scheduled, out_for_delivery, delivered |
| delivery_fee | number | Optional |
| address_snapshot | string | Copy of order address |
| scheduled_at | datetime | Optional |
| delivered_at | datetime | Optional |

## Message Templates
| Field | Type | Notes |
| --- | --- | --- |
| id | string | Primary key |
| shop_id | string | References shops.id |
| title | string | Display name |
| body | string | Message content |
| is_active | boolean | Enable or disable |
| created_at | datetime | Server timestamp |

## Daily Summaries
| Field | Type | Notes |
| --- | --- | --- |
| id | string | Primary key |
| shop_id | string | References shops.id |
| summary_date | date | Shop timezone date |
| total_orders | number | Count |
| total_revenue | number | Sum of totals |
| delivered_count | number | Count |
| pending_count | number | Count |

## Plans
| Field | Type | Notes |
| --- | --- | --- |
| id | string | Primary key |
| code | string | e.g. trial, monthly |
| name | string | Display name |
| price | number | Plan price |
| currency | string | MMK by default |
| billing_period | string | monthly, yearly, lifetime |

## Subscriptions
| Field | Type | Notes |
| --- | --- | --- |
| id | string | Primary key |
| shop_id | string | References shops.id |
| plan_id | string | References plans.id |
| status | string | trialing, active, expired |
| start_at | datetime | Start time |
| end_at | datetime | End time |

## Payments
| Field | Type | Notes |
| --- | --- | --- |
| id | string | Primary key |
| subscription_id | string | References subscriptions.id |
| amount | number | Paid amount |
| currency | string | MMK by default |
| status | string | pending, paid, failed |
| provider_ref | string | Payment reference |
| paid_at | datetime | Payment time |

## Audit Logs
| Field | Type | Notes |
| --- | --- | --- |
| id | string | Primary key |
| shop_id | string | References shops.id |
| actor_user_id | string | References users.id |
| action | string | e.g. order_status_changed |
| entity_type | string | orders, customers |
| entity_id | string | Entity identifier |
| created_at | datetime | Server timestamp |
