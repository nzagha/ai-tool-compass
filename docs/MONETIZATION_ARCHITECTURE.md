# aiBean monetization architecture

## Status and scope
**Phase 0 design only; nothing below is installed or enabled by this document.** Independent Lovable implementation with contract compatibility, not a port of the original Next.js runtime, original SQL ledger or original provider account. Use isolated synthetic fixtures for future local contract tests; do not attach another billing authority to original services. Supplied P0 isolation direction takes precedence over historical assumptions in HANDOFF/GAPS about original database reuse. Integration remains explicitly reviewed future work.

## Current project baseline (read-only source audit)
- TanStack Start v1, React 19, TypeScript, Tailwind v4, Vite, Cloudflare workerd runtime; not Next.js. Drizzle dependencies and versioned SQL migrations exist; `drizzle/schema.ts` is intentionally not the active hand-authored schema.
- Existing Cloud clients/auth middleware in `src/integrations/supabase`; bearer and CSRF middleware in `src/start.ts`; independent authentication and role RPC checks in account/admin functions.
- Public catalog comes through `useCatalog()` with sample/published records and database-derived claim-state overlay; discovery saves remain browser-local.
- Source models/migrations reference profiles, separate user_roles, directory_records, admin_audit and catalog_public. Current application enum has admin/moderator/user, not Creator/Vendor paid capabilities. Do not add payment roles to profiles or derive ownership from a plan.
- Admin `placement` metadata (Featured/Sponsored and dates) is **not** an order, settled payment or paid-day ledger. Existing claims/submissions are free pending contributions; do not retroactively charge or reinterpret them.
- No billing SDK, checkout/webhook route, invoice/subscription model or payment function was found in source audit. Source audit did not query hosted schema, private settings or original services.

## Modular design for later phases
| Module (proposed under src/lib/monetization/) | Responsibility | Compatible source IDs |
|---|---|---|
| contracts / pricing | Typed product, approved/proposed version, cents/currency, immutable quote and eligibility; no browser prices | MON-PRC-001–012; MON-PAY-004 |
| capabilities / entitlements | Approved Creator capability, current Tool ownership, paid invoice/period validation, highest eligible non-stacking benefit | MON-MOD-003/004; MON-SUB-001–003 |
| orders / billing | User-owned customer/order/invoice/subscription lifecycle, cancellations, schedule requests, reconciliation | MON-PAY-001–005; MON-SUB-004/005 |
| service requests | Payment readiness separate from submission/edit/claim/verification editorial decisions | MON-VND-001–006 |
| featured | Admin-approved request, settlement, disclosed placement, paid-day accounting isolated from organic rank | MON-FEA-001; MON-SEC-007 |
| affiliates | Approved config/destinations, consent/disclosure review, click limits, provider receipt/reversal evidence | MON-AFF-001–005 |
| reporting / audit | Scoped actual receipts, unavailable states, revision/audit trails; no invented balances | MON-SEC-010; MON-MOD-012 |
| repositories / provider adapters | Pure contracts + synthetic repository for local tests first; explicit Cloud adapter and reviewed provider adapter later | P0 isolation; MON-SEC-001/006 adaptation |

Editorial catalog and commercial repository remain separate. Future DTOs use stable account/tool/product/request IDs with explicit crosswalks to original IDs; do not assume current tool slug equals original database ID. No schema or provider-specific types in public view contracts. Integer minor currency units and immutable pricing versions avoid float/repricing errors; this is an architecture choice, not an approved price catalogue.

## Route map (proposed, not created)
Current /admin and /account experiences remain intact. Distinct future sections get distinct TanStack file routes, not hash navigation or a page-switcher.

| Surface | Planned URL(s) | Access boundary |
|---|---|---|
| Public commercial overview | Public teaser URL/content undecided | Only approved public information; no full price matrix |
| Full pricing | /pricing | Signed-in, under _authenticated per historical MON-MOD-001 |
| User | /account/billing, /account/membership, /account/submissions | Signed-in, own account only |
| Vendor | /vendor, /vendor/tools/$id, /vendor/tools/$id/analytics, /featured/manage | Signed-in + current independently approved owner, per Tool |
| Creator | /creator, /creator/content/skills, /creator/content/playbooks, /creator/content/resources, /creator/content/events, /creator/analytics | Signed-in + approved Creator capability, own content/campaigns |
| Admin | /admin/featured, /admin/claims, /admin/disputes, /admin/edits, /admin/verification, /admin/commerce/submissions, /admin/commerce/payments, /admin/commerce/subscriptions, /admin/commerce/pricing, /admin/affiliates, /admin/analytics, /admin/audit | Signed-in + independently server-verified admin |
| External events | /api/public/billing/webhook; affiliate receipt/redirect URLs TBD | Raw-body signature/adapter validation; public prefix does not confer trust |

Original /api/billing/webhook is a source endpoint, not an endpoint installed here. Map explicitly to TanStack public server route after provider approval. Parent routes must render Outlet; protected initial reads use loaders + queryClient.ensureQueryData + useSuspenseQuery inside protected layout. Leaf pages require unique aiBean head metadata at implementation. Reuse existing brand/assets/semantic tokens and controls; no redesign for Phase 0.

## Logical data dependencies (not DDL or installation claims)
| Data contract | Dependencies / constraints |
|---|---|
| Capability and ownership | Auth identity, separate protected role/capability records, canonical one-owner constraint; Creator approval not yet implemented here |
| Products / price releases / quotes | Explicit approval/version/hash, amount/currency, immutable quote, eligibility snapshot and authoritative current capability |
| Customers / orders / payment events | Account ownership, product/request/quote references, unique provider event/session IDs, exact expected amount/currency; no client-writable paid state |
| Subscriptions / invoices / management / refunds | Verified account/provider mapping, paid invoice and period evidence, audited commands and matched provider receipts |
| Submission/edit/verification/claim requests | Tool/account scope, independent review state, linked but independent commercial state; preserve existing non-commercial requests |
| Featured requests / placements / lifecycle | Admin approval, linked settled order, approved tool and distinct paid-time history; organic rank untouched |
| Usage / quotas | Proposed eligible plan version, UTC creation windows, concurrency-safe increments, retain existing content |
| Affiliate programs / campaigns / clicks / receipts / reversals | Exact approved config hash/destination/receipt contract; ownership scoping, unique event evidence, append-only confirmed/reversed ledger |
| Commercial audit / reports | Actor, target, revisions, timestamps, receipt provenance; access-minimized sensitive data |

Original Pricing proposal has five tables, Affiliate/Creator eight tables; exact schema, keys, constraints and 25 affiliate FKs are **not reconstructed** without file 07 and primary SQL. Above names are logical groups, not claims to replicate original table names. Original 45-table recovery gates affect later original integration, not permission to install anything in current Cloud.

## Planned server functions and invariants (no implementations yet)
- authenticated billingSnapshot/membershipSnapshot: scope to context.userId; never accept caller-controlled owner identity.
- quoteService/createCheckout: canonical product and reviewed price version, independent capability/ownership, server-derived amount/currency; disabled until separately approved provider configuration.
- requestCancellation/requestIntervalChange/requestRefund: authenticated own subscription/order; audited, reconciled provider command; policy unresolved means action unavailable.
- vendorServiceRequest/creatorUsageSnapshot: current owner/approved Creator server checks; paid membership cannot grant capability.
- adminCommercialSnapshot/reviewPriceRelease/reviewFeatured/reconcileOrder: authenticated admin RPC check before privileged work; immutable audit/revision controls.
- raw webhook: signature on untouched body, verify provider environment, exact event/account/session/order/amount/currency, deduplicate transactionally, separate settlement from editorial/capability updates. Redirect success page only reads status.
- affiliate outbound/receipt: allowlisted exact HTTPS destination and approved contract/hash, dedup/rate limits and signed provider evidence; clicks never create commission; normal outbound fallback when inactive.

## Permission model and platform adaptations
Original HANDOFF MON-SEC-001/006 uses canonical Drizzle runtime permissions with revoked direct role grants. That model cannot be copied blindly into current generated Cloud clients: use existing authenticated server middleware + context.supabase + account scoping + RLS and explicit grants matching policies. Future schema needs platform-compliant CREATE TABLE → GRANT → RLS → policy ordering; provider-only ledger writes are not granted to ordinary callers. No Phase 0 schema change occurs. Exact permission matrix awaits schema reconciliation. UI guards are usability, server functions and RLS are enforcement; no role checks from localStorage or payment metadata.

Use createServerFn for internal authenticated logic, TanStack server routes under /api/public for raw external events; public handlers validate their own caller. Preserve auth-attaching middleware; no Supabase Edge Functions or Next.js server patterns. Secrets are server-only inside handlers, privileged client imported only after authorization; no service keys in browser or VITE variables. Choose bundled Worker-compatible provider libraries/Web APIs only; do not assume Node subprocess/native filesystem services. Avoid original scanner implementations that require a Node host.

Provider choice/configuration is deferred. Source references Stripe test mode, but does not authorize an account connection or product creation; no provider enable tool is called in Phase 0. Any later choice must reconcile current platform payment requirements and original Stripe contracts with separate consent.

## Testing and integration sequence
Future local tests assert payment never changes rank/badge/ownership/capability; exact approved Featured offer; proposed-price disabled gates; invoice-backed Pro; no stacking; server ownership; concurrency/idempotency; refunds; Featured duration; safe outbound and receipt reversals. Synthetic fixtures must be explicitly marked non-financial. Genuine test-provider checkout/webhook/invoice/refund/schedule evidence, two-account permission tests and hosted persistence are separate acceptance gates, not replaced by mocks or CI success.

Integrate with original only after source reconciliation, separately reviewed canonical authority/ID mapping, original recovery/risk acceptance and exact environment consent. Never copy/alter original sealed migrations or reuse original private accounts automatically.

## Phase 1 implementation note (2026-11-01)
Routes in the "Route map" above are superseded for Phase 1 by: `/pricing` (public), `/membership` (membership + billing), `/vendor-studio`, `/vendor-studio/$slug`, `/creator`, `/admin-monetization` — all except `/pricing` under the `_authenticated` gate; the existing `/vendor` marketing page and `/admin` panel are kept. Modules: `src/lib/monetization/money.ts`, `src/lib/monetization/model.ts`, `src/lib/monetization.functions.ts`, `src/components/monetization/ui.tsx`, `scripts/qa-fixtures.ts`. Data: see `MONETIZATION_DATABASE_MAPPING.md` (files 07–09 now received; original installation status does not apply to this draft).
