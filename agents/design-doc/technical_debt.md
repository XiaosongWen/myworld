# Technical Debt Log

> Record compromises, shortcuts, and deferred work that should be revisited later.

| ID | Task | Debt | Severity | Created | Resolved |
|----|------|------|----------|---------|----------|
| 1 | Phase 1 tests | Tests mock the database dependency rather than using a real PostgreSQL. No integration test that exercises the full SQLAlchemy → asyncpg stack. | Low | 2026-06-26 | — |
| 2 | State management | Zustand was listed in the Phase 1 execution plan's `package.json` dependencies but was deferred to Phase 2 (not yet installed). | Low | 2026-05-12 | 2026-06-29 |
