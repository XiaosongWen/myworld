# 2026-07-19: API Response Envelope Structure

**Domain:** core

**Layer:** backend

**Status:** accepted

**Context:** 
We needed a standardized way for clients to parse API responses, handle metadata (like pagination), and manage errors consistently. A unified structure also allows us to inject a `request_id` into every response for easier tracing, logging, and debugging.

**Decision:** 
We refactored the API responses to use a standardized JSON envelope structure.

1. **Error Response:**
```json
{
  "msg": "error_code_or_message",
  "request_id": "873de1f82c452843"
}
```

2. **Single Object Success:**
```json
{
  "msg": "success",
  "request_id": "9b5f65d813a3eb7e",
  "data": { }
}
```

3. **List Success (with Pagination):**
```json
{
  "msg": "success",
  "request_id": "99c946f80610d9a2",
  "data": [ {} ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_rows": 2
  }
}
```
*Note: `DELETE` endpoints may still return `204 No Content` without an envelope.*

**Alternatives considered:**
- Returning raw objects or lists (previous approach) — rejected because it lacks a standard place for metadata (like pagination or request IDs) and makes generic error handling on the client more difficult and inconsistent.

**Rationale:** 
A standard envelope makes it extremely simple for the frontend API client to intercept all responses, check for `"msg": "success"`, parse out the `data`, and globally handle errors. Including `request_id` in every response and header (`X-Request-ID`) ensures traceability across the stack. Generic Pydantic models (`SingleResponse[T]`, `ListResponse[T]`) ensure that type checking and OpenAPI specs remain accurate.

**Consequences:** 
- All existing endpoints had to be wrapped in Pydantic generic models (`SingleResponse[T]`, `ListResponse[T]`).
- The frontend API client must be updated to unwrap `response.data.data` when accessing the actual payload.
- Exception handlers globally catch and format errors into the `ErrorResponse` envelope directly.
