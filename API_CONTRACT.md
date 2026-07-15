# BR Transport — REST API Contract

This document is the source of truth for the endpoints the React frontend
expects your Spring Boot backend to expose. Keep them in sync as the app grows.

## Conventions

- Base URL: configured on the frontend via `VITE_API_BASE_URL` (defaults to `http://localhost:8080`).
- All request/response bodies are JSON (`Content-Type: application/json`).
- Auth: `Authorization: Bearer <accessToken>` on every protected endpoint.
- Error shape (any non-2xx):

```json
{
  "message": "Human-readable error",
  "errors": { "fieldName": "Field-level error message" }
}
```

- Use standard HTTP status codes: 400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict, 422 unprocessable, 500 server error.
- CORS: allow the frontend origin (Lovable preview URL in dev, production domain in prod). Allow `Authorization`, `Content-Type` headers and `GET, POST, PUT, PATCH, DELETE, OPTIONS`.

## Module 1 — Authentication

### `POST /api/auth/login`

Request:
```json
{ "email": "admin@brtransport.com", "password": "•••••••" }
```

Response `200 OK`:
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<optional-jwt>",
  "user": { "id": 1, "email": "admin@brtransport.com", "name": "Admin" }
}
```

Errors: `401 { "message": "Invalid credentials" }`.

### `GET /api/auth/me`  *(Bearer)*

Response `200 OK`:
```json
{ "id": 1, "email": "admin@brtransport.com", "name": "Admin" }
```

Errors: `401` when the token is missing/expired/invalid.

### `POST /api/auth/logout`  *(Bearer, optional server-side)*

Response `204 No Content`. Client clears its token regardless of the outcome.

---

## Module 3/4 — Bills *(preview — final shape confirmed at Module 3)*

Endpoints will follow this REST layout. Fields are placeholders until the full
bill schema is confirmed. Confirmed field so far: **partyName**.

- `GET    /api/bills?page=0&size=20&sort=createdAt,desc&search=` — paginated list
- `GET    /api/bills/{id}` — single bill
- `POST   /api/bills` — create
- `PUT    /api/bills/{id}` — update
- `DELETE /api/bills/{id}` — delete

Paginated list response (Spring Data `Page` shape is fine):
```json
{
  "content": [ { "id": 1, "partyName": "Acme Co.", "createdAt": "2026-07-15T10:00:00Z" } ],
  "totalElements": 42,
  "totalPages": 3,
  "number": 0,
  "size": 20
}
```

---

## Admin account setup (manual)

Create the single admin user directly in MySQL after your Spring Boot app runs
migrations. Recommended shape:

```sql
INSERT INTO users (email, password_hash, name, role, created_at)
VALUES ('admin@brtransport.com', '<bcrypt-hash>', 'Admin', 'ADMIN', NOW());
```

Generate the bcrypt hash from your Spring Boot service (or a one-off CLI) using
the same `PasswordEncoder` bean the app uses — bcrypt strength ≥ 10.

---

## Change log

- **Module 1** — auth endpoints defined.
