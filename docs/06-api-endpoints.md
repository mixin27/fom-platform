# Suggested Backend API Endpoints

## Conventions

- Base URL: `/api/v1`
- Auth: `Authorization: Bearer <access_token>`
- Access tokens are JWTs and include shop-scoped role and permission claims for mobile UI decisions.
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

## Auth and Profile

| Method | Path               | Description                                            | Response                                       |
| ------ | ------------------ | ------------------------------------------------------ | ---------------------------------------------- |
| POST   | /auth/register     | Register with email/password                           | 200 Single {access_token, refresh_token, user} |
| POST   | /auth/login        | Login with email plus password                         | 200 Single {access_token, refresh_token, user} |
| POST   | /auth/refresh      | Rotate access and refresh tokens                       | 200 Single {access_token, refresh_token, user} |
| POST   | /auth/social/login | Create or reuse a Google/Facebook identity and sign in | 200 Single {access_token, refresh_token, user} |
| POST   | /auth/phone/start  | Send OTP to phone number                               | 200 Single {challenge_id, purpose, expires_at} |
| POST   | /auth/phone/verify | Verify OTP and create session                          | 200 Single {access_token, refresh_token, user} |
| POST   | /auth/logout       | Revoke current token                                   | 204 No Content                                 |
| GET    | /users/me          | Current user profile                                   | 200 Single User                                |
| PATCH  | /users/me          | Update profile, locale, email, or phone                | 200 Single User                                |

## Shops and Staff

| Method | Path                               | Description                 | Response          |
| ------ | ---------------------------------- | --------------------------- | ----------------- |
| GET    | /shops                             | List current user shops     | 200 List Shop     |
| POST   | /shops                             | Create shop                 | 201 Single Shop   |
| GET    | /shops/{shopId}                    | Get shop details            | 200 Single Shop   |
| PATCH  | /shops/{shopId}                    | Update shop                 | 200 Single Shop   |
| GET    | /shops/{shopId}/members            | List staff                  | 200 List Member   |
| POST   | /shops/{shopId}/members            | Add staff with `role_codes` | 201 Single Member |
| PATCH  | /shops/{shopId}/members/{memberId} | Update roles or status      | 200 Single Member |

## Customers

| Method | Path                                   | Description     | Response            |
| ------ | -------------------------------------- | --------------- | ------------------- |
| GET    | /shops/{shopId}/customers              | List customers  | 200 List Customer   |
| POST   | /shops/{shopId}/customers              | Create customer | 201 Single Customer |
| GET    | /shops/{shopId}/customers/{customerId} | Get customer    | 200 Single Customer |
| PATCH  | /shops/{shopId}/customers/{customerId} | Update customer | 200 Single Customer |

## Orders

| Method | Path                                    | Description              | Response         |
| ------ | --------------------------------------- | ------------------------ | ---------------- |
| GET    | /shops/{shopId}/orders                  | List orders with filters | 200 List Order   |
| POST   | /shops/{shopId}/orders                  | Create order             | 201 Single Order |
| GET    | /shops/{shopId}/orders/{orderId}        | Get order details        | 200 Single Order |
| PATCH  | /shops/{shopId}/orders/{orderId}        | Update order             | 200 Single Order |
| POST   | /shops/{shopId}/orders/{orderId}/status | Change status            | 200 Single Order |

## Order Items

| Method | Path                                            | Description       | Response             |
| ------ | ----------------------------------------------- | ----------------- | -------------------- |
| POST   | /shops/{shopId}/orders/{orderId}/items          | Add order item    | 201 Single OrderItem |
| PATCH  | /shops/{shopId}/orders/{orderId}/items/{itemId} | Update order item | 200 Single OrderItem |
| DELETE | /shops/{shopId}/orders/{orderId}/items/{itemId} | Remove order item | 204 No Content       |

## Message Templates

| Method | Path                                   | Description     | Response            |
| ------ | -------------------------------------- | --------------- | ------------------- |
| GET    | /shops/{shopId}/templates              | List templates  | 200 List Template   |
| POST   | /shops/{shopId}/templates              | Create template | 201 Single Template |
| PATCH  | /shops/{shopId}/templates/{templateId} | Update template | 200 Single Template |

## Deliveries

| Method | Path                                    | Description            | Response            |
| ------ | --------------------------------------- | ---------------------- | ------------------- |
| GET    | /shops/{shopId}/deliveries              | List deliveries        | 200 List Delivery   |
| POST   | /shops/{shopId}/deliveries              | Create delivery        | 201 Single Delivery |
| PATCH  | /shops/{shopId}/deliveries/{deliveryId} | Update delivery status | 200 Single Delivery |

## Summaries and Reports

| Method | Path                            | Description           | Response                |
| ------ | ------------------------------- | --------------------- | ----------------------- |
| GET    | /shops/{shopId}/summaries/daily | Daily summary by date | 200 Single DailySummary |
| GET    | /shops/{shopId}/reports/weekly  | Weekly report         | 200 Single Report       |
| GET    | /shops/{shopId}/reports/monthly | Monthly report        | 200 Single Report       |

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
