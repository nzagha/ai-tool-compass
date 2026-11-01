# Monetization database mapping (Phase 1)

Maps the original aiBean Drizzle/PostgreSQL entities described in package file 07 to this Lovable draft. **This is not the original application or its hosted 45-table database.** Nothing here was imported from, connected to, or written to any original aiBean Supabase project.

## Isolation verification (2026-11-01)
- Draft `drft_01m6a6zmafeycanqjd5d4dbxrz` reported by the platform drafts list as "its own test database; data changes stay in this draft and never reach the live app".
- Server `SUPABASE_URL` and `psql` resolved to `127.0.0.1` (sandbox-local). `vendor_access`, `user_capabilities`, `creator_applications` exist only here until the draft is accepted.
- Migration `0006_monetization_phase1_access_foundation.sql` applied to the draft database only. **If this draft is ever accepted, that migration will run on the Lovable app's own database** (not the original aiBean database). Review before accepting.
- QA identities (`qa-*@qa.aibean.invalid`) exist only in this draft's database, created by `scripts/qa-fixtures.ts`, which refuses to run against a non-local backend. Passwords are random, written only to `/tmp/qa/credentials.json` (mode 600, wiped with the sandbox) and never committed, printed or screenshotted. They are not in `db/seed.sql` on purpose.

## Entity mapping
| Original (file 07) | Lovable draft | Difference / reason |
|---|---|---|
| `public.users` (text id, `is_admin`, `is_creator`) | `auth.users` + `public.profiles`; admin in `public.user_roles` (`app_role`); Creator in `public.user_capabilities('approved_creator')` | Supabase Auth owns identity; privileges are never stored on the profile, so a profile edit cannot escalate. |
| `public.tools` (id, slug, data JSONB) | `public.directory_records` kind=`tool` + sample catalog in `src/lib/catalog.ts` | Tool identity is the **slug** (sample tools have no DB row). |
| `public.vendor_access` (tool_id PK, user_id) | `public.vendor_access` (`tool_slug` PK, `user_id`, `claim_id`) | Same single-owner rule. Written only by trigger from admin-approved claims (latest approved claim wins); no client write grant. |
| `public.claim_requests` | `public.directory_records` kind=`claim` | Existing claim workflow kept. No `payment_required` default — payments do not exist. |
| `public.creator_applications` | `public.creator_applications` | Implemented: one pending per user; admin decision via `review_creator_application` RPC with reason + audit. |
| `public.audit_logs` | `public.admin_audit` (existing) | Reused instead of creating a second audit authority. |
| `public.orders`, `billing_webhook_receipts`, `billing_products`, `billing_transactions`, `commerce_subscriptions` | **Not created** | Phase 1 forbids payment objects; creating them would risk a second billing authority. |
| `public.featured_placements` | Existing `directory_records` kind=`placement` (editorial, unpaid) | Paid fields deferred. |
| `vendor_edit_requests`, `verification_requests`, `claim_disputes`, `tool_submissions` | Not created (claims/submissions use `directory_records`) | Deferred to later phases. |
| Pricing v1 (`pricing_releases`, `pricing_quotes`, `membership_bindings`, `membership_changes`, `pricing_refunds`) — PROPOSAL ONLY | Typed constants `PRICING_REFS` in `src/lib/monetization/model.ts` with authority flags | Version references only, not an engine. No tables. |
| Affiliate/Creator v1 (8 tables) — PROPOSAL ONLY | Not created | Blocked pending provider and approval. |
| `aibean_private.*_installations` ledgers | Drizzle journal `drizzle/migrations/meta/_journal.json` | Lovable stack records migrations through Drizzle Kit. |

## Access functions (all `SECURITY DEFINER`, `search_path=public`, no `anon` execute)
`has_role` (existing), `has_capability`, `owns_tool`, `request_creator_access`, `review_creator_application` (admin), `revoke_creator_capability` (admin), `sync_vendor_access` (trigger-only, no client execute).

## Grants / RLS
`user_capabilities`, `vendor_access`, `creator_applications`: RLS on; `SELECT` to `authenticated` limited to own rows or admin; `ALL` to `service_role`; **no INSERT/UPDATE/DELETE grant to `authenticated`** — writes only via the RPCs above. Server functions additionally re-check access (`src/lib/monetization.functions.ts`).

## Stack differences
- Original Drizzle runtime did not inherit visitor JWTs; here server functions run as the caller (RLS applies) and also perform explicit checks — two layers.
- Original private schema ledgers and package SHA-256 checks are not reproduced.
- First-signup-admin bootstrap was removed in this draft: new accounts are always ordinary members.
