# Execution Plan: Refactor API Response Structure

## What will be built and why
We will refactor the API responses to use a standardized JSON envelope structure exactly as requested, making it easier for clients to parse responses, handle metadata, and handle errors. A `request_id` will be generated for every request and included in the response.

**Proposed Structure:**

1. If the API has an error (e.g. 500 server error, validation error, HTTP exceptions):
```json
{
  "msg": "server_error",
  "request_id": "873de1f82c452843"
}
```

2. If the API succeeds and returns a single object:
```json
{
  "msg": "success",
  "request_id": "9b5f65d813a3eb7e",
  "data": { }
}
```

3. If the API succeeds and returns a list:
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

## Status: ✅ Complete

### Implementation Summary

| Step | File | What was done |
|------|------|---------------|
| 1 | `backend/schemas/response.py` | Defined `SingleResponse[T]`, `ListResponse[T]`, `ErrorResponse`, and `Pagination` Pydantic generic models |
| 2 | `backend/middlewares/logging_middleware.py` | Generates UUID `request_id` per request, attaches to `request.state`, adds `X-Request-ID` header. Also catches unhandled exceptions and returns `ErrorResponse` envelope directly (workaround for `BaseHTTPMiddleware` exception propagation). |
| 3 | `backend/core/setup.py` | Exception handlers for `RequestValidationError`, `StarletteHTTPException`, and `Exception` all return `ErrorResponse` envelope with `request_id` |
| 4 | `backend/routers/health.py` | Returns `SingleResponse[dict]` |
| 5 | `backend/routers/user.py` | Returns `SingleResponse[UserRead]` |
| 6 | `backend/routers/habit.py` | All endpoints wrapped: `ListResponse[HabitRead]`, `SingleResponse[HabitRead]`, `ListResponse[HeatmapEntry]`, `SingleResponse[HabitLogRead]`, `ListResponse[HabitLogRead]`, `SingleResponse[StreakResult]`. DELETE endpoints keep 204 No Content. |
| 7 | `backend/routers/test.py` | All test endpoints wrapped in `SingleResponse[dict]` |
| 8 | `backend/tests/test_response_envelope.py` | 20 dedicated tests covering SingleResponse, ListResponse, ErrorResponse envelopes, and request_id consistency |

## Verification
- ✅ All 103 backend tests pass (83 existing + 20 new envelope tests)
- ✅ Every success endpoint returns `{"msg": "success", "request_id": "...", "data": ...}`
- ✅ List endpoints include `pagination` with `page`, `page_size`, `total_rows`
- ✅ Error paths (422, 400, 404, 409, 500) return `{"msg": "...", "request_id": "..."}`
- ✅ `X-Request-ID` header matches `request_id` in response body
- ✅ Request IDs are unique per request
