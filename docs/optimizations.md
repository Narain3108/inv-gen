# Frontend Optimization Checklist — InvoiceHub

Purpose  
Concise, prioritized guidance for frontend developers to harden, optimize and maintain the Next.js frontend for long‑term production use. Focus: reliability, performance, UX, security and developer experience.

---

## Summary (one line)
Stabilize data fetching and auth gating, reduce client bundle, centralize API & optimistic updates, add observability and tests.

---

## High priority (do first)

1. Data gating & race conditions
   - Ensure auth + allowed companies reload complete before any company-scoped network calls.
   - Add a single "app-initialized" gate (Auth + AppData loaded) used by pages/components that call company APIs.

2. Centralized data fetching & caching
   - Adopt TanStack Query (recommended) or SWR for lists (companies, products, invoices, clients).
   - Use background revalidate + retry/backoff and built-in caching.

3. Central API client improvements
   - Standardize error shape, add dev-only debug timing, and circuit-breaker for repeated 5xx.
   - Validate NEXT_PUBLIC_API_URL at startup and fail-fast if missing.

4. Generalize optimistic UI
   - Move optimistic create/update/delete logic into shared hooks/context (AppDataContext or custom hooks).
   - Provide rollback + user-visible undo/toast on failure.

5. Prevent duplicate client bundles / move work to server
   - Audit "use client" usage. Convert static/display components to Server Components where possible.
   - Reduce hydration cost and initial JS.

---

## Performance & bundle size

- Add bundle analysis (next build --profile or next/bundle-analyzer). Identify top modules.
- Lazy-load heavy components (charts, large editors, image assets).
- Use specific imports for icon libraries (avoid importing whole lucide/react).
- Use next/image for images and enable optimization.
- Remove unused dependencies.

---

## UX, accessibility & mobile

- Mobile-first UI and skeleton loaders to reduce perceived latency.
- Ensure keyboard navigation and aria-labels for interactive controls.
- Add undo for destructive actions (delete) and clear success/error toasts.
- Ensure focus management in dialogs.

---

## Security & auth

- Prefer httpOnly cookies; keep Authorization header fallback.
- Avoid logging PII to console.
- Sanitize all dynamic HTML and user inputs client-side.

---

## Observability & monitoring

- Add Sentry (or equivalent) for frontend exceptions and breadcrumbs.
- Capture web-vitals and key API latency metrics.
- Add dev-only request timing logs in api client.

---

## Testing & CI

- Unit tests for hooks and context (Auth, AppDataContext, optimistic hooks).
- Integration/E2E with Playwright for critical flows: login, company switch, create invoice, create user.
- Enforce type-check (tsc), linting (ESLint), formatting (Prettier) in CI.

---

## Developer DX

- Add Storybook for UI primitives and complex forms.
- Centralize UI primitives (Button, Input, Select) for consistent props and behavior.
- Provide a README short on how to run the frontend (dev/build/test).

---

## File audit (start here)
- src/contexts/AuthContext.tsx — gating, token handling
- src/contexts/AppDataContext.tsx — selectedCompany, optimistic handlers
- src/lib/api/client.ts — central API client
- src/lib/api/*.ts — wrappers; convert to use TanStack Query hooks
- src/components/* (dialogs, lists, forms) — optimistic patterns & accessibility
- src/app/** pages — ensure proper use client / server components
- next.config.js — image and bundle settings

---

## Quick actionable tasks (low friction)

1. Add gating boolean: `appReady = authReady && companiesLoaded` and prevent company-scoped requests until true.
2. Integrate TanStack Query for companies/products/invoices lists.
3. Move delete/create optimistic logic into `useOptimisticList` hook and replace inline implementations.
4. Add bundle-analyzer and review top 10 modules; defer or lazy-load top offenders.
5. Add Sentry init and an Error Boundary at app root.
6. Add Playwright smoke test for login → company switch → create invoice.

---

## Roadmap (recommended phases)

- Phase 1 (1–2 weeks): gating, TanStack Query for companies & invoices, central API errors, optimistic delete hook.
- Phase 2 (2–4 weeks): bundle analysis + code-splitting, Sentry, unit tests for contexts/hooks.
- Phase 3 (4–8 weeks): Storybook, Playwright E2E, performance budgets in CI.
- Phase 4 (ongoing): regular bundle audits, accessibility passes, telemetry dashboards.

---

## Snippets / examples

Gating pattern (hook usage)
```ts
// useAppReady.ts (example)
export function useAppReady() {
  const { authReady } = useAuth();
  const { companiesLoaded } = useAppData();
  return authReady && companiesLoaded;
}
```

Optimistic delete hook
```ts
// useOptimisticList.ts (concept)
function useOptimisticList(initial) {
  const [items, setItems] = useState(initial);
  const remove = async (id, apiDelete) => {
    const prev = items;
    setItems(items.filter(i => i.id !== id)); // optimistic
    try { await apiDelete(id); } catch(e) { setItems(prev); throw e; }
  };
  return { items, setItems, remove };
}
```

---

If you want, I can:
- Generate concrete PRs for Phase 1 (gating, TanStack Query integration for companies/invoices, optimistic hook, small api-client improvements).  
- Or produce Playwright test templates for critical flows.
