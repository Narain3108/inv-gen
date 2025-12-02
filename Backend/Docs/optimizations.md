...existing code...

# Backend Firestore Optimization Requirements

Purpose
- Provide a prioritized, actionable checklist for improving Firestore query performance, reducing read costs, and increasing reliability for the FastAPI backend.

Priority 1 — Correct query usage & composite indexes
- Replace chained positional where(...) patterns with Firestore FieldFilter or structured queries to remove warnings and avoid unexpected behavior.
- Identify common multi-field queries and create composite indexes (Firestore console or indexes config).
  - Examples to index:
    - users: (organizationId, email)
    - invoices: (companyId, organizationId, createdAt)
    - products: (companyId, organizationId)
- Deliverable: firestore.indexes.json with required indexes.

Priority 2 — Pagination & projections
- Add server-side pagination (limit + cursor/startAfter) to all list endpoints:
  - get_companies, get_users, get_invoices, get_products, get_clients, get_quotations.
- Use field projections (select) to return only required fields in list endpoints (id, name, companyId, status) to cut bandwidth & reads.

Priority 3 — Reduce repeated reads & atomic writes
- Batch writes / transactions for multi-document operations (user creation + company allotment, onboarding).
- Where appropriate, denormalize small reference data or maintain a lookup collection to avoid repeated costly queries.

Priority 4 — Access checks in queries
- Push RBAC filters into Firestore queries where possible (include organizationId/companyId in query) to fail fast and reduce unnecessary reads.
- Avoid fetching then checking permissions; include permission constraints in the query.

Priority 5 — Caching & throttling
- Add short TTL in-memory cache (LRU or TTL) for low-change high-read data: companies list, product categories.
- Implement soft-rate limiting or debounce for UI-driven endpoints to reduce spikes.

Priority 6 — Observability & retries
- Add logging/metrics for slow queries and high read counts (endpoint, duration, doc reads).
- Implement retry/backoff for transient Firestore errors.

Guidance & examples (do not change production without testing)
- Composite index JSON sample:
```json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath":"organizationId","order":"ASCENDING"},
        {"fieldPath":"email","order":"ASCENDING"}
      ]
    }
  ]
}
```
- Use FieldFilter (Python):
```py
from google.cloud.firestore_v1 import FieldFilter
query = users_ref.query.filter(FieldFilter("email","==",email)).filter(FieldFilter("organizationId","==",org_id)).limit(1)
```
- Pagination + projection pattern:
```py
q = invoices_ref.where("companyId","==",cid).order_by("createdAt", direction=firestore.Query.DESCENDING).select(["id","total","status"]).limit(page_size)
```

Files to audit (recommended)
- app/api/v1/auth_firestore.py
- app/api/v1/companies_firestore.py
- app/api/v1/invoices_firestore.py
- app/api/v1/products_firestore.py
- app/api/v1/clients_firestore.py
- app/api/v1/quotations_firestore.py
- app/core/firebase.py (connection/config)

Testing & rollout
- Add unit tests or integration tests for each modified endpoint (query correctness + RBAC).
- Deploy indexes first (Firestore console or index file) before releasing code that relies on them.
- Monitor read counts and latency after each change.

Notes
- Do not use on_snapshot listeners in request handlers (expensive per-connection). For realtime needs, prefer client SDK listeners or a separate pub/sub service.
- Prioritize changes that reduce document reads and push filters into queries.

---

# Production-grade Backend Recommendations (Long-term / Non-Firestore specific)

Purpose
- Make the backend maintainable, secure, and scalable for long-term, industry-level production use.

Top priorities (apply first)
1. Authentication & Token lifecycle
   - Use short-lived access tokens + refresh tokens with rotation and revocation support.
   - Provide refresh endpoint and token revocation mechanism; log refresh events.
   - Deliverable: token rotation flow, refresh endpoint, revoke list.

2. RBAC hardened & centralized
   - Centralize role checks in a single dependency/middleware and use deny-by-default policies.
   - Maintain a policy matrix mapping roles → allowed actions/endpoints.
   - Deliverable: single get_current_user dependency & policy matrix.

3. Query performance & cost control
   - Deploy composite indexes for frequent multi-field queries.
   - Add server-side pagination, projections and limit maxima for list endpoints.
   - Add read-cost monitoring and alerting.

4. Data integrity & atomicity
   - Use batched writes/transactions for multi-document updates (onboarding, user-company linking).
   - Support idempotency keys for create/update to avoid duplicate writes.

5. Observability & SLOs
   - Add structured logging (request id, user id, duration), metrics (latency, error rates), and doc-read counts.
   - Integrate tracing (OpenTelemetry), metrics (Prometheus) and dashboards (Grafana).
   - Define SLOs and alert thresholds.

High-impact reliability & security
6. Secrets & config management
   - Move secrets to a secret manager (GCP Secret Manager, Vault). Avoid storing service account keys in repo.
   - Enforce least-privilege IAM for service accounts.

7. Backups & recovery
   - Automate Firestore exports/backups and test restores regularly.
   - Keep retention policies and run quarterly restore tests.

8. Input validation & defensive coding
   - Strengthen Pydantic schemas with strict validation and custom validators.
   - Normalize field naming (snake_case) or provide a clear transformation layer for frontend/backends.

9. Rate limiting & abuse protection
   - Implement per-user and per-endpoint rate limits (Redis token bucket).
   - Protect heavy endpoints and add throttling at API gateway level.

10. Async & background processing
    - Offload heavy/async tasks (PDF generation, bulk imports) to background workers (Celery, RQ, Cloud Tasks).
    - Provide retry/backoff and dead-letter handling.

11. Scalability & deployment
    - Make services stateless; use Redis or JWT for session/locks.
    - Containerize (Docker) and prepare for autoscaling (k8s, Cloud Run).
    - Deliverable: Dockerfile + deployment manifests.

12. Data modeling & migrations
    - Maintain migration/version scripts for denormalized Firestore structures.
    - Provide a migration runner and audit logs for migrations.

13. Security testing & dependency hygiene
    - Pin dependencies and run SCA/OSS vulnerability scanners.
    - Schedule weekly dependency review and monthly penetration tests.

14. API stability & developer experience
    - Enforce API versioning, provide OpenAPI docs, and consider client SDK generation.
    - Add contract tests for critical endpoints.

15. Privacy, compliance & retention
    - Implement data retention, deletion, and export workflows (GDPR/CCPA).
    - Provide audit logs for deletion and export operations.

---

# Operational & Process Improvements

1. CI/CD & gating
   - Automate unit/integration tests, linting and security scans in CI.
   - Require PR checks and deployments through pipelines.

2. Testing & monitoring of Firestore cost
   - Add tests estimating read counts for typical flows and alert when cost exceeds thresholds.
   - Run nightly cost reports.

3. Feature flags & progressive rollout
   - Use feature flags to roll out risky changes gradually.

4. Quick wins
   - Log slow queries (>200ms) and endpoints with high doc reads.
   - Standardize API error responses (code/message/details).
   - Implement soft-delete with retention windows.

---

# Implementation Guidance & Prioritization

Phase 1 (0–2 weeks)
- Add composite indexes for critical queries.
- Replace positional where(...) with FieldFilter in the most-used endpoints.
- Add pagination and field projection to top list endpoints.
- Add read-cost logging.

Phase 2 (2–6 weeks)
- Centralize RBAC and strengthen token lifecycle (refresh/revoke).
- Add in-memory caching for companies/product categories.
- Add retries/backoff for Firestore transient errors.

Phase 3 (6–12 weeks)
- Integrate tracing/metrics, background worker for heavy tasks, deploy CI/CD pipeline improvements.
- Introduce rate-limiting and secret manager migration.

Phase 4 (ongoing)
- Backups & restore testing, dependency hygiene, security testing, performance tuning, and runbook creation.

---

# References & Examples
- Firestore composite indexes: https://cloud.google.com/firestore/docs/query-data/indexing
- FieldFilter API: google-cloud-firestore python docs
- Pagination patterns: limit + startAfter, and cursor tokens
- OpenTelemetry + Prometheus examples for FastAPI