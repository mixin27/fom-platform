# Standard REST API Response Structure

## Goals
- Consistent response shape for all endpoints
- Easy client parsing for success and errors
- Clear error codes for localization

## Common Headers
- `X-Request-Id`: unique request identifier
- `Content-Type: application/json`

## Success (200, 201)
```json
{
  "success": true,
  "data": {
    "id": "ord_123",
    "status": "new"
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-03-24T10:15:00Z"
  }
}
```

## List Response with Pagination (200)
```json
{
  "success": true,
  "data": [
    {
      "id": "ord_123",
      "status": "new"
    }
  ],
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-03-24T10:15:00Z",
    "pagination": {
      "limit": 50,
      "cursor": "cur_001",
      "next_cursor": "cur_002",
      "total": 120
    }
  }
}
```

## Empty List (200)
```json
{
  "success": true,
  "data": [],
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-03-24T10:15:00Z",
    "pagination": {
      "limit": 50,
      "cursor": null,
      "next_cursor": null,
      "total": 0
    }
  }
}
```

## Validation Error (422)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "customer_id": ["Customer is required"],
      "items.0.qty": ["Quantity must be at least 1"]
    }
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-03-24T10:15:00Z"
  }
}
```

## Authentication Error (401)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-03-24T10:15:00Z"
  }
}
```

## Forbidden (403)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action"
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-03-24T10:15:00Z"
  }
}
```

## Not Found (404)
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Order not found"
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-03-24T10:15:00Z"
  }
}
```

## Conflict (409)
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Order status already delivered"
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-03-24T10:15:00Z"
  }
}
```

## Rate Limited (429)
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Try again later"
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-03-24T10:15:00Z",
    "retry_after_seconds": 30
  }
}
```

## Server Error (500)
```json
{
  "success": false,
  "error": {
    "code": "SERVER_ERROR",
    "message": "Unexpected error"
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-03-24T10:15:00Z"
  }
}
```

## Recommended Error Codes
| Code | HTTP | When |
| --- | --- | --- |
| VALIDATION_ERROR | 422 | Input validation failed |
| UNAUTHORIZED | 401 | No or invalid token |
| FORBIDDEN | 403 | User lacks permission |
| NOT_FOUND | 404 | Resource missing |
| CONFLICT | 409 | Invalid state transition |
| RATE_LIMITED | 429 | Too many requests |
| SERVER_ERROR | 500 | Unhandled error |

## Notes for Laravel
- Use a global exception handler to map exceptions to the standard format
- Return `request_id` from middleware for tracing
- Keep `message` user-friendly, and use `code` for client logic
