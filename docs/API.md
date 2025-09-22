# API Reference

All backend endpoints live under `pages/api/*` and are served by the Next.js API runtime. Responses conform to a consistent envelope and include a `correlation_id` header set by `lib/apiWrapper.ts`.

## 1. Conventions

- **Base URL (local):** `http://localhost:3000`
- **Content Type:** JSON unless otherwise noted.
- **Error format:**
  ```json
  {
    "ok": false,
    "error": "VALIDATION_FAILED",
    "message": "Invalid booking data",
    "details": { ... },
    "correlation_id": "7f17c8a2-..."
  }
  ```
- **Success format:**
  ```json
  {
    "ok": true,
    "correlation_id": "7f17c8a2-...",
    ...payload
  }
  ```

## 2. Authentication & Security

| Area | Mechanism |
| --- | --- |
| Public APIs | No auth, but validation and rate limiting are enforced. |
| Admin APIs | `POST /api/admin/login` issues an `admin_session` JWT cookie (30 min TTL) and `x-csrf-token`. Middleware (`middleware.ts`) ensures cookies exist for `/admin/*`. |
| OTP & booking | Require OTP session token issued by `/api/otp/verify`. Idempotency enforced via `Idempotency-Key` header. |

## 3. Rate Limits

- `/api/otp/send` → 3 requests / 15 min per phone; 10 requests / hour per IP (enforced by `lib/limiter.ts` + Redis or in-memory map).
- `/api/admin/login` → 5 attempts / 15 min per IP (in-memory map within handler).

## 4. Endpoints

### 4.1 Quotes

**POST `/api/quotes`** — Compute fare quotes for a route.

Request body:
```json
{
  "origin_text": "Raipur",
  "destination_text": "Bilaspur",
  "pickup_datetime": "2025-05-20T08:00:00.000Z",
  "car_type": "SEDAN",
  "discount_code": "WELCOME100"
}
```

Response:
```json
{
  "ok": true,
  "correlation_id": "...",
  "quote": {
    "route_id": 1,
    "distance_km": 120,
    "duration_min": 150,
    "fare_base_inr": 1540,
    "fare_after_discount_inr": 1440,
    "applied_discount": { "code": "WELCOME100", "amount_inr": 100 },
    "night_surcharge_applied": false,
    "discount_code_attempted": "WELCOME100",
    "discount_valid": true
  }
}
```

Errors: `VALIDATION_FAILED` (bad payload/expired pickup), `NOT_FOUND` (unknown route), `VALIDATION_FAILED` with 409 if discount invalid.

### 4.2 Bookings

**POST `/api/bookings`** — Confirm a booking.

Headers:
- `Idempotency-Key: <unique-string>` (required).

Request body:
```json
{
  "route_id": 1,
  "origin_text": "Raipur",
  "destination_text": "Bilaspur",
  "pickup_datetime": "2025-05-20T08:00:00.000Z",
  "car_type": "SEDAN",
  "fare_quote_inr": 1540,
  "discount_code": "WELCOME100",
  "payment_mode": "COD",
  "customer_phone": "9876543210",
  "customer_name": "Anita",
  "otp_token": "otp-ok-abcd1234"
}
```

Response:
```json
{
  "ok": true,
  "correlation_id": "...",
  "booking_id": 42,
  "status": "PENDING",
  "payment_mode": "COD",
  "fare_locked_inr": 1440,
  "message": "Booking created",
  "event_id": "9b2..."
}
```

Notable behavior:
- Fares are recalculated server-side; mismatches > ₹50 trigger `VALIDATION_FAILED` (409) with `{ "server_fare": ... }`.
- OTP token must match the verified phone or `UNAUTHORIZED` is returned.
- UTM cookies (`utm_first`) are parsed automatically and stored in the booking record.

### 4.3 Simplified Booking (MVP prototype)

**POST `/api/bookings/simple`** — Lightweight booking capture without persistence. Primarily used by experiments.

- Validates passenger info and returns a generated `booking_id`.
- Logs payload to the console (`console.log('💾 Booking saved to database:', booking);`).
- Response: `{ "success": true, "booking_id": "CAB...", "message": "Booking confirmed successfully" }`.

### 4.4 OTP

**POST `/api/otp/send`**

Request: `{ "phone": "9876543210" }`

Response:
```json
{
  "ok": true,
  "correlation_id": "...",
  "ttl_seconds": 300,
  "mock_otp": "1234"   // only when NODE_ENV !== 'production'
}
```

Errors: `RATE_LIMITED` (429), `VALIDATION_FAILED` (bad phone).

**POST `/api/otp/verify`**

Request: `{ "phone": "9876543210", "otp": "1234" }`

Response:
```json
{
  "ok": true,
  "correlation_id": "...",
  "valid": true,
  "token": "otp-ok-....",
  "ttl_seconds": 600
}
```

Errors: `ALREADY_USED` (410), `UNAUTHORIZED` (wrong/expired code), `VALIDATION_FAILED` (bad payload).

### 4.5 Search Results

**GET `/api/search-results`** — Returns enriched cab options.

Query parameters:
- `origin`, `destination`, `pickup_datetime` (required).
- Optional: `return_datetime`, `passengers`, `luggage`, filters.

Response:
```json
{
  "origin": { "displayName": "Raipur" },
  "destination": { "displayName": "Bilaspur" },
  "pickupDateTime": "2025-05-20T12:00:00.000Z",
  "distance": "120 km",
  "duration": "150 mins",
  "cabOptions": [
    {
      "id": "sedan-1",
      "category": "Comfort",
      "carType": "sedan",
      "price": 1800,
      "estimatedDistance": "120 km",
      "estimatedDuration": "150 mins",
      "rating": 4.5,
      "instantConfirmation": true
    },
    ...
  ]
}
```

Internally calls `/api/distance/matrix` to compute distance/duration.

### 4.6 Distance Matrix

**GET `/api/distance/matrix`**

Query parameters: `origin`, `destination` (strings).

- Uses Google Distance Matrix API if `GOOGLE_MAPS_API_KEY` or `GOOGLE_PLACES_API_KEY` is configured.
- Fallback: curated distance table covering Indian metros and Chhattisgarh routes.

Response:
```json
{ "distance": 120, "duration": 150, "status": "OK" }
```

### 4.7 Places Autocomplete

**GET `/api/places/autocomplete`**

Query parameters: `input` (≥2 characters), optional `sessiontoken`.

- Requires `GOOGLE_PLACES_API_KEY` for live data; otherwise returns `{ "predictions": [], "status": "OK" }`.
- Proxies responses from Google Places API with minimal filtering.

### 4.8 Admin Login

**POST `/api/admin/login`**

Request: `{ "email": "admin@example.com", "password": "admin123" }`

Response:
```json
{
  "ok": true,
  "csrfToken": "..."
}
```

- Sets cookies: `admin_session=<JWT>; HttpOnly; SameSite=Lax` and `admin_csrf=<token>`.
- Errors: 401 for invalid credentials, 429 when the in-memory rate limit is exceeded.

### 4.9 Health & Diagnostics

- `GET /api/health` → `{ "ok": true }`.
- `GET /api/v1/health` → `{ "ok": true, "db": "ok" | "fail", "cache": "ok" | "fail" }`.

### 4.10 Real User Monitoring

**POST `/api/v1/rum`** — Accepts client-side performance metrics.

Request:
```json
{
  "metric": "cls",
  "value": 0.04,
  "page_type": "route_fare",
  "origin": "raipur",
  "destination": "bilaspur",
  "ts": 1716182400000
}
```

Response: `{ "ok": true }`

Stored as JSONL in `data/rum/<date>.jsonl` for later aggregation. In development the payload is also logged to stdout.

## 5. Error Codes

| Code | HTTP | Description |
| --- | --- | --- |
| `VALIDATION_FAILED` | 400 | Input validation failed. `details` contains Zod errors. |
| `UNAUTHORIZED` | 401 | OTP mismatch, invalid credentials, or missing OTP token. |
| `FORBIDDEN` | 403 | Reserved for admin-only routes (none currently exposed publicly). |
| `NOT_FOUND` | 404 | Missing routes or resources. |
| `RATE_LIMITED` | 429 | OTP or login throttling. `retryAfter` included when available. |
| `ALREADY_USED` | 410 | OTP token reused after consumption. |
| `INTERNAL_ERROR` | 500 | Unexpected server error. |

## 6. Idempotency

- Booking API caches results under the key `booking:<Idempotency-Key>` using Redis when configured, otherwise an in-memory map.
- Repeat requests with the same key return the cached response and do not duplicate database writes.

## 7. Extending the API

1. Create a new file in `pages/api/<resource>.ts`.
2. Wrap the handler with `withApi` to get correlation IDs and consistent error envelopes.
3. Define request schemas in `lib/validate.ts` (Zod) and reuse `makeError`/`sendError` for error handling.
4. Document the new endpoint in this file and update the client code accordingly.
