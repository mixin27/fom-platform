# Suggested Backend API Endpoints

## Conventions

- Base URL: `/api/v1`
- Auth: `Authorization: Bearer <access_token>`
- Access tokens are JWTs and include platform-scoped plus shop-scoped role and permission claims for client-side access decisions.
- Sessions capture request metadata including IP address and user-agent.
- Pagination: `limit` and `cursor`
- Timezone: use shop timezone for date filters
- Response envelopes follow `docs/17-api-response-structure.md`

## Docs and Testing

- Swagger UI: `/docs`
- OpenAPI JSON: `/openapi.json`
- OpenAPI YAML: `/openapi.yaml`
- Scalar API Reference: `/reference`

## Response Types

| Type       | HTTP     | Description                               |
| ---------- | -------- | ----------------------------------------- |
| Single     | 200, 201 | One resource in `data`                    |
| List       | 200      | Array in `data` with pagination in `meta` |
| Empty      | 200      | `data: []` with pagination totals         |
| No Content | 204      | No response body                          |
| Error      | 4xx, 5xx | Error envelope with `error`               |

## Public Marketing

| Method | Path          | Description                                 | Response                  |
| ------ | ------------- | ------------------------------------------- | ------------------------- |
| GET    | /public/plans | List active public subscription plans       | 200 List Plan             |

Public marketing notes:

- `GET /public/plans` is unauthenticated and intended for the landing page or other public pricing surfaces.
- The response returns the active plan catalog only; inactive plans stay hidden from public pricing.

## Auth and Profile

| Method | Path               | Description                                            | Response                                       |
| ------ | ------------------ | ------------------------------------------------------ | ---------------------------------------------- |
| POST   | /auth/register     | Register with email/password                           | 200 Single {access_token, refresh_token, user, platform_access, shops} |
| POST   | /auth/login        | Login with email plus password                         | 200 Single {access_token, refresh_token, user, platform_access, shops} |
| POST   | /auth/refresh      | Rotate access and refresh tokens                       | 200 Single {access_token, refresh_token, user, platform_access, shops} |
| POST   | /auth/email/verification/send | Send or resend an email verification link     | 200 Single {email, email_verified_at, sent, already_verified} |
| POST   | /auth/email/verification/confirm | Confirm an email verification token        | 200 Single {email, email_verified_at, verified} |
| POST   | /auth/password/forgot | Queue a password reset email                        | 200 Single {accepted, message} |
| POST   | /auth/password/reset | Reset password with a token and revoke sessions      | 200 Single {reset, email, reset_at} |
| POST   | /auth/social/login | Create or reuse a Google/Facebook identity and sign in | 200 Single {access_token, refresh_token, user, platform_access, shops} |
| POST   | /auth/phone/start  | Send OTP to phone number                               | 200 Single {challenge_id, purpose, expires_at} |
| POST   | /auth/phone/verify | Verify OTP and create session                          | 200 Single {access_token, refresh_token, user, platform_access, shops} |
| POST   | /auth/logout       | Revoke current token                                   | 204 No Content                                 |
| GET    | /users/me          | Current user profile                                   | 200 Single User                                |
| PATCH  | /users/me          | Update profile, locale, email, or phone                | 200 Single User                                |

## Notifications and Email

| Method | Path                                   | Description                                          | Response                     |
| ------ | -------------------------------------- | ---------------------------------------------------- | ---------------------------- |
| GET    | /notifications                         | List inbox notifications for the current user        | 200 List Notification        |
| GET    | /notifications/unread-count            | Get unread inbox count for the current user          | 200 Single {unread_count}    |
| PATCH  | /notifications/{notificationId}/read   | Mark one inbox notification as read                  | 200 Single Notification      |
| POST   | /notifications/read-all                | Mark unread notifications as read in bulk            | 200 Single {read_count}      |
| GET    | /notification-preferences              | Get per-category in-app and email delivery settings  | 200 Single {preferences[]}   |
| PATCH  | /notification-preferences              | Update per-category in-app and email delivery settings | 200 Single {preferences[]} |

Notification notes:

- `GET /notifications` accepts `shop_id`, `category`, `unread_only`, `limit`, and `cursor`.
- The first implemented event category is `order_activity`, which covers order creation, order status changes, and delivery-driven order progress updates.
- Preferences currently support `order_activity`, `daily_summary`, `promotional_tips`, `billing_updates`, and `support_updates`.
- Email delivery is backed by an outbox table plus provider adapters. Supported providers are `log`, `disabled`, `smtp`, and `sendgrid`, selected through `EMAIL_PROVIDER`.
- Common sender configuration uses `EMAIL_FROM_EMAIL`, `EMAIL_FROM_NAME`, and optional `EMAIL_SUPPORT_EMAIL`.
- SMTP mode also supports `EMAIL_SMTP_HOST`, `EMAIL_SMTP_PORT`, `EMAIL_SMTP_SECURE`, `EMAIL_SMTP_USER`, `EMAIL_SMTP_PASSWORD`, `EMAIL_SMTP_IGNORE_TLS`, and `EMAIL_SMTP_REQUIRE_TLS`.
- SendGrid mode requires `SENDGRID_API_KEY` and can override sender defaults with `EMAIL_SENDGRID_FROM_EMAIL` and `EMAIL_SENDGRID_FROM_NAME`.
- Auth emails are production-oriented templates for welcome, email verification, forgot password, and password reset success.
- Platform billing currently emits invoice and billing notice emails when invoices are created or updated. Trial and promotion templates are available through the shared template system for future workflows.

## Platform Workspace

| Method | Path                    | Description                               | Response                            |
| ------ | ----------------------- | ----------------------------------------- | ----------------------------------- |
| GET    | /platform/dashboard     | Internal platform dashboard metrics       | 200 Single PlatformDashboard        |
| GET    | /platform/shops         | List tenant shops with platform filters   | 200 List PlatformShop               |
| GET    | /platform/users         | List users across the platform workspace  | 200 List PlatformUser               |
| GET    | /platform/shops/{shopId} | Get a single tenant shop snapshot        | 200 Single PlatformShop             |
| POST   | /platform/shops         | Create a tenant shop and owner account    | 200 Single PlatformShop             |
| PATCH  | /platform/shops/{shopId} | Update tenant shop and owner details     | 200 Single PlatformShop             |
| DELETE | /platform/shops/{shopId} | Delete a tenant shop and shop-scoped data | 204 No Content                     |
| GET    | /platform/subscriptions | List invoices and subscription summaries  | 200 Single PlatformSubscriptions    |
| PATCH  | /platform/subscriptions/{subscriptionId} | Update a shop subscription plan and term | 200 Single PlatformSubscription |
| POST   | /platform/subscriptions/{subscriptionId}/invoices | Create a subscription invoice | 200 Single PlatformInvoice |
| PATCH  | /platform/invoices/{invoiceId} | Update a platform invoice         | 200 Single PlatformInvoice          |
| GET    | /platform/support       | List operator issues and support queue    | 200 Single PlatformSupport          |
| POST   | /platform/support/issues | Create a manual support issue             | 200 Single PlatformSupportIssue     |
| PATCH  | /platform/support/issues/{issueId} | Update support issue workflow state | 200 Single PlatformSupportIssue |
| GET    | /platform/settings      | Platform owner profile and plan catalog   | 200 Single PlatformSettings         |
| PATCH  | /platform/settings/profile | Update platform owner profile settings | 200 Single PlatformSettings      |
| PATCH  | /platform/settings/plans/{planId} | Update plan catalog details        | 200 Single PlatformPlan            |

Platform notes:

- Platform routes require platform-scoped permissions and are intended only for the internal owner account.
- `GET /platform/shops` accepts `search`, `status`, `plan`, `limit`, and `cursor`.
- `GET /platform/users` accepts `search`, `access`, `limit`, and `cursor`.
- `POST /platform/shops` creates a shop, assigns the owner role, and starts the default trial subscription when the trial plan exists.
- `PATCH /platform/shops/{shopId}` can update shop name, timezone, owner name, owner email, owner phone, and optionally reset the owner password.
- `DELETE /platform/shops/{shopId}` permanently deletes the shop and its shop-scoped orders, customers, templates, deliveries, sessions, and billing records.
- `platform.subscriptions.write` is required for subscription and invoice management actions.
- `GET /platform/subscriptions` accepts `search`, `status`, `plan`, `subscription_status`, `limit`, and `cursor`.
- `PATCH /platform/subscriptions/{subscriptionId}` can update plan, status, start and end dates, and auto-renew state.
- `POST /platform/subscriptions/{subscriptionId}/invoices` creates a new invoice for the selected subscription.
- `PATCH /platform/invoices/{invoiceId}` updates invoice amount, status, due dates, and payment references.
- `platform.support.write` is required for support issue workflow mutations (`POST/PATCH /platform/support/issues/*`).
- `POST /platform/support/issues` creates a manual issue with `kind`, `severity`, `title`, and `detail`; optional `shop_id`, `assigned_to_user_id`, and `occurred_at` are supported.
- `PATCH /platform/support/issues/{issueId}` updates issue status (`open`, `in_progress`, `resolved`, `dismissed`), assignee, severity, and resolution note.
- `PATCH /platform/settings/profile` updates platform owner profile (`name`, `email`, `phone`, `locale`) and optional password credential reset.
- `PATCH /platform/settings/plans/{planId}` updates plan catalog metadata (code, name, description, price, billing period, active flag, sort order) plus dynamic feature items (`code`, `label`, `description`, `availability_status`, `sort_order`).
- The current platform billing catalog uses `trial`, `pro_monthly`, and `pro_yearly`.
- Current launch feature enforcement is driven by stable plan item codes, while future enterprise-oriented codes remain seeded but unavailable for later expansion.

## Shops and Staff

| Method | Path                               | Description                 | Response          |
| ------ | ---------------------------------- | --------------------------- | ----------------- |
| GET    | /shops                             | List current user shops     | 200 List Shop     |
| POST   | /shops                             | Create shop                 | 201 Single Shop   |
| GET    | /shops/{shopId}                    | Get shop details            | 200 Single Shop   |
| PATCH  | /shops/{shopId}                    | Update shop                 | 200 Single Shop   |
| GET    | /shops/{shopId}/billing            | Get current subscription and recent invoices | 200 Single ShopBilling |
| GET    | /shops/{shopId}/members            | List staff                  | 200 List Member   |
| POST   | /shops/{shopId}/members            | Add staff with `role_codes` | 201 Single Member |
| PATCH  | /shops/{shopId}/members/{memberId} | Update roles or status      | 200 Single Member |

Shop notes:

- `GET /shops/{shopId}/billing` is intended for owner or manager-facing settings surfaces and currently requires `shops.write`.
- `POST /shops` starts the new self-serve shop on the default free trial plan when the trial plan is active.
- Trial subscriptions expire automatically once `end_at` passes. The default trial length is controlled by `DEFAULT_TRIAL_DAYS` and defaults to 7 days.
- Shop member management routes are plan-gated by `team.members`.

## Customers

| Method | Path                                   | Description     | Response            |
| ------ | -------------------------------------- | --------------- | ------------------- |
| GET    | /shops/{shopId}/customers              | List customers  | 200 List Customer   |
| POST   | /shops/{shopId}/customers              | Create customer | 201 Single Customer |
| GET    | /shops/{shopId}/customers/{customerId} | Get customer    | 200 Single Customer |
| PATCH  | /shops/{shopId}/customers/{customerId} | Update customer | 200 Single Customer |

Customer list filters:

- `search`: case-insensitive match against `name`, `phone`, `township`, and `address`
- `segment`: `all`, `vip`, `new_this_week`, `top_spenders`
- `sort`: `recent`, `top_spenders`, `name`
- `limit` and `cursor`: standard cursor pagination fields

Customer write notes:

- `POST /shops/{shopId}/customers` uses `phone` as the per-shop uniqueness key and merges into the existing customer when the phone already exists.
- `PATCH /shops/{shopId}/customers/{customerId}` requires at least one field and accepts `null` for `township`, `address`, and `notes` to clear those values.
- Customer APIs require the `customers.management` plan feature in addition to RBAC permissions.

## Orders

| Method | Path                                    | Description              | Response         |
| ------ | --------------------------------------- | ------------------------ | ---------------- |
| GET    | /shops/{shopId}/orders                  | List orders with filters | 200 List Order   |
| POST   | /shops/{shopId}/orders                  | Create order             | 201 Single Order |
| POST   | /shops/{shopId}/orders/parse-message    | Parse Messenger text into a suggested order draft | 200 Single ParsedOrderDraft |
| GET    | /shops/{shopId}/orders/{orderId}        | Get order details        | 200 Single Order |
| PATCH  | /shops/{shopId}/orders/{orderId}        | Update order             | 200 Single Order |
| POST   | /shops/{shopId}/orders/{orderId}/status | Change status            | 200 Single Order |

Order list filters:

- `status`: `pending`, `new`, `confirmed`, `out_for_delivery`, `delivered`, `cancelled`
- `date`: `today` or a shop-local date in `YYYY-MM-DD`
- `search`: case-insensitive match across order number, customer fields, and item names
- `limit` and `cursor`: standard cursor pagination fields

Order write notes:

- `POST /shops/{shopId}/orders` accepts either `customer_id` or inline customer details. The preferred request body uses `customer` plus `items`, while legacy inline customer and single-item fields are still accepted.
- `POST /shops/{shopId}/orders/parse-message` does not create an order. It parses copied Messenger text and returns a `suggested_order`, parse warnings, confidence, and an optional `customer_match`.
- The parser can return multiple `items` when the message contains separate item lines, repeated labeled product blocks, comma-separated or semicolon-separated inline item segments, or per-item color/size sub-lines inside labeled product blocks.
- `PATCH /shops/{shopId}/orders/{orderId}` requires at least one field and accepts `note: null` to clear the note.
- `POST /shops/{shopId}/orders/{orderId}/status` expects `{ "status": "...", "note": "..." }`.
- Order APIs require the `orders.management` plan feature, and `POST /shops/{shopId}/orders/parse-message` additionally requires `orders.parse_messenger`.

## Order Items

| Method | Path                                            | Description       | Response             |
| ------ | ----------------------------------------------- | ----------------- | -------------------- |
| POST   | /shops/{shopId}/orders/{orderId}/items          | Add order item    | 201 Single OrderItem |
| PATCH  | /shops/{shopId}/orders/{orderId}/items/{itemId} | Update order item | 200 Single OrderItem |
| DELETE | /shops/{shopId}/orders/{orderId}/items/{itemId} | Remove order item | 204 No Content       |

Order item write notes:

- `POST /shops/{shopId}/orders/{orderId}/items` expects `product_name`, `qty`, `unit_price`, and optional `product_id`.
- `PATCH /shops/{shopId}/orders/{orderId}/items/{itemId}` requires at least one field and accepts `product_id: null` to clear the product reference.

## Message Templates

| Method | Path                                   | Description     | Response            |
| ------ | -------------------------------------- | --------------- | ------------------- |
| GET    | /shops/{shopId}/templates              | List templates  | 200 List Template   |
| POST   | /shops/{shopId}/templates              | Create template | 201 Single Template |
| PATCH  | /shops/{shopId}/templates/{templateId} | Update template | 200 Single Template |

Message template notes:

- `GET /shops/{shopId}/templates` accepts `search`, `state` (`all`, `active`, `inactive`), `limit`, and `cursor`.
- Templates include `title`, `body`, optional `shortcut`, and `is_active`.
- `title` must be unique within the shop.
- `shortcut` is optional, must also be unique within the shop when present, and may be cleared with `null` on update.
- `PATCH /shops/{shopId}/templates/{templateId}` requires at least one field to update.
- Template APIs require the `templates.management` plan feature.

## Deliveries

| Method | Path                                    | Description            | Response            |
| ------ | --------------------------------------- | ---------------------- | ------------------- |
| GET    | /shops/{shopId}/deliveries              | List deliveries        | 200 List Delivery   |
| POST   | /shops/{shopId}/deliveries              | Create delivery        | 201 Single Delivery |
| PATCH  | /shops/{shopId}/deliveries/{deliveryId} | Update delivery status | 200 Single Delivery |

Delivery notes:

- `GET /shops/{shopId}/deliveries` accepts `status`, `driver_user_id`, `search`, `limit`, and `cursor`.
- Delivery status values are `scheduled`, `out_for_delivery`, and `delivered`.
- `POST /shops/{shopId}/deliveries` requires `order_id` and `driver_user_id`.
- Each order can have at most one delivery record.
- `driver_user_id` must belong to an active member of the same shop.
- Delivery status updates sync the related order status forward to `confirmed`, `out_for_delivery`, or `delivered`.
- `address_snapshot` falls back to the current order customer address when omitted on create or reset with `null` on update.
- Delivery APIs require the `deliveries.management` plan feature.

## Summaries and Reports

| Method | Path                            | Description           | Response                |
| ------ | ------------------------------- | --------------------- | ----------------------- |
| GET    | /shops/{shopId}/summaries/daily | Daily summary by date | 200 Single DailySummary |
| GET    | /shops/{shopId}/reports/weekly  | Weekly report         | 200 Single Report       |
| GET    | /shops/{shopId}/reports/monthly | Monthly report        | 200 Single Report       |

Summary query notes:

- `GET /shops/{shopId}/summaries/daily` accepts `date=YYYY-MM-DD` in the shop timezone.
- When `date` is omitted, the API uses the latest order date for that shop.
- `GET /shops/{shopId}/reports/weekly` accepts an anchor `date=YYYY-MM-DD` and returns the Monday-start week containing that date.
- `GET /shops/{shopId}/reports/monthly` accepts `month=YYYY-MM` and returns the full month report.
- When report query parameters are omitted, the API uses the latest shop order period.
- Daily summaries and reporting APIs require the `reports.analytics` plan feature.

## Exports

### Shop Exports

| Method | Path                                   | Description                 | Response     |
| ------ | -------------------------------------- | --------------------------- | ------------ |
| GET    | /shops/{shopId}/exports/orders.csv     | Export shop orders as CSV   | 200 text/csv |
| GET    | /shops/{shopId}/exports/customers.csv  | Export shop customers as CSV | 200 text/csv |
| GET    | /shops/{shopId}/exports/deliveries.csv | Export shop deliveries as CSV | 200 text/csv |
| GET    | /shops/{shopId}/exports/members.csv    | Export shop staffs as CSV   | 200 text/csv |

Shop export notes:

- All shop export endpoints require the `exports.csv` plan feature.
- `GET /shops/{shopId}/exports/members.csv` also requires `team.members`.
- Export routes return raw CSV downloads instead of the standard JSON response envelope.

### Platform Exports

| Method | Path                                  | Description                        | Response     |
| ------ | ------------------------------------- | ---------------------------------- | ------------ |
| GET    | /platform/exports/shops.csv           | Export platform shops as CSV       | 200 text/csv |
| GET    | /platform/exports/users.csv           | Export platform users as CSV       | 200 text/csv |
| GET    | /platform/exports/subscriptions.csv   | Export subscriptions as CSV        | 200 text/csv |
| GET    | /platform/exports/invoices.csv        | Export invoices/payments as CSV    | 200 text/csv |

Platform export notes:

- Platform exports require the usual platform RBAC permissions for the corresponding dataset.
- These routes are intended for the internal platform owner workspace only.

## Example: Create Order Request

```json
{
  "customer_id": "cus_123",
  "status": "new",
  "items": [
    {
      "product_name": "T-shirt",
      "qty": 1,
      "unit_price": 12000
    }
  ],
  "total_price": 12000,
  "currency": "MMK",
  "note": "Deliver after 5pm"
}
```

## Example: Create Order Response

```json
{
  "success": true,
  "data": {
    "id": "ord_123",
    "status": "new",
    "total_price": 12000,
    "currency": "MMK"
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-03-24T10:15:00Z"
  }
}
```

## Example: List Orders

`GET /api/v1/shops/{shopId}/orders?status=pending&date=today&limit=50`
