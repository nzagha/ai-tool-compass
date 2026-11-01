# Monetization phase tracker

## Phase 0 — qualified documentation baseline delivered
**Implementation STOP.** All six actual attachments read; nine referenced package files absent. Source-complete Phase 0 acceptance remains blocked, not marked unconditionally complete.

| Acceptance item | Actual status | Evidence / dependency |
|---|---|---|
| Every attachment inspected completely | Complete (6/6 supplied) | Build Context source register |
| Entire referenced package inspected | Blocked (files 01–09 missing) | P0-SRC-001; Master Plan direct source also missing |
| Monetization inventory | Complete for supplied evidence, qualified | Requirements Matrix: 58 MON IDs + 29 independent status rows; persona/revenue/workflow inventory |
| Each requirement traceable | Complete for supplied rows | Immutable original references preserved as secondary evidence; direct source comparison pending |
| Approved vs proposed prices distinguished | Complete | Only Featured offer approved; exact proposed prices/discounts preserved without activation |
| Appropriate Lovable architecture documented | Complete design, not implementation | Architecture: routes/modules/logical data/functions/permission adaptations/isolation |
| Conflicts/open decisions captured | Complete for supplied evidence | Open Decisions: 23 original MON-GAP rows + Phase 0-specific blockers |
| Persistent five deliverables created | Complete | docs/MONETIZATION_*.md |
| No real payments / hosted migrations / provider activation | Satisfied for this task | No payment, data, migration or provider tools called; existing site and services left unchanged |

## Phase 1 readiness (historical, superseded below)
**Ready:** bounded non-financial contract/design work can be scoped from this baseline.
**Not ready for full implementation approval:** missing files 01–09, exact schema and Featured lifecycle, direct-source reconciliation and a separate Phase 1 request.
**Not ready for checkout/paid subscriptions/live launch:** commercial approvals, approved provider environment/configuration, exact required schema authorization and genuine provider tests remain absent. No provider account or current hosted monetization state was inspected.

Request the missing nine Markdown documents and relevant direct Master Plan/amendments; reconcile before certifying complete Phase 0. Then obtain separate Phase 1 scope. Acknowledging this documentation is not consent to accept proposed fees or activate payment infrastructure.

## Future phased architecture (proposed sequence, not authorization)
| Phase | Bounded work | Prerequisites / acceptance |
|---|---|---|
| 1: Contracts and non-financial previews | Typed proposed/approved catalogue, capability contracts, synthetic fixtures, isolated repositories, persona navigation/previews | Full-source reconciliation, explicit phase request; mark simulated state, no purchase activation; concrete invariant tests |
| 2: Isolated persistence and commercial operations | Reviewed additive schema/permissions, owner-scoped billing records, independent service/Featured approval/audit/versioning | Explicit schema/environment authorization; two-account permission/persistence tests; no provider assumptions |
| 3: Approved test-provider workflows | Separately approved provider setup/products/quotes, signed raw events, invoice entitlements, refunds/schedules/reconciliation | Exact commercial version and provider consent; actual test checkout/webhook/invoice/refund evidence; payment never grants badge/ownership/roles |
| 4: Affiliates/Creator contracts | Approved exact destinations/contracts, click evidence, receipt/reversal reports, quotas/files where approved | Missing source/schema resolved; actual adapter/scanner permissions/tests; no payouts product invented |
| 5: Integration and release review | Reviewed original ID/canonical-authority adapters, hosting/tax/security/ops, independent live-release decision | Original recovery/risk gates if touching original, separate connection approval; provider/identity/security evidence; no automatic launch |

## Verification performed in Phase 0
Read every supplied Markdown in full; read-only project source audit distinguished current TanStack directory from original Next.js evidence. Programmatic documentation checks verify five files, 58 IDs, 29 status rows and 23 gap rows; references/authority qualifiers checked. Existing build log showed build OK. No app code changed, so no new runtime flow or pricing rule implementation was claimed/tested; no manual build/typecheck or live service verification performed.

## Phase 1 — foundation delivered in isolated draft (2026-11-01)
**STOP after Phase 1. Draft not accepted, not published.** Draft has its own test database (platform drafts list + `SUPABASE_URL`/psql at 127.0.0.1). No original aiBean database, provider or real payment touched.

| Acceptance item | Status | Evidence |
|---|---|---|
| Navigation functional | Done | Header "Pricing" link, footer link, account page links, admin panel link, shared area nav |
| Five area shells | Done | `/pricing`, `/membership`, `/vendor-studio`, `/creator`, `/admin-monetization` |
| Server-enforced permissions | Done | Server functions re-check role/capability/ownership; RLS + RPCs; no client write grants |
| Isolated backend operational | Done | Migration 0006 applied to draft DB only |
| Shared components mobile + desktop | Done | Playwright at 1280×1800 and 390×844, no horizontal overflow on all five areas |
| No hosted aiBean DB modified | Satisfied | Only draft-local DB used |
| No real payment | Satisfied | `PAYMENTS_ENABLED=false`; no payment code exists |

**Tests:** `bunx vitest run` — 6 files, **29 tests passed** (17 new in `src/test/monetization.test.ts`: area permissions, owner isolation, payment-never-grants, money formatting, status validation, fixture gating).
**End-to-end (real sign-in, real server guards, 5 synthetic accounts):** 21 distinct checks passed across runs — signed-out gate on full price list; member denied Vendor/Creator/Admin and another owner's tool; member Creator application; Vendor A sees only own tool and is denied Vendor B's tool; Creator allowed in Creator, denied Vendor; Admin approves application (audited) and is still not a tool owner; approved member then enters Creator; five mobile no-overflow checks.
**Limitations:** QA passwords live only in `/tmp/qa/credentials.json` (lost on sandbox restart; re-run `bun scripts/qa-fixtures.ts` to rotate). QA display names show as short ids in admin tables. Accepting the draft would apply migration 0006 (and remove first-signup-admin) to the Lovable app's own database. Files 01–06 and Master Plan still missing, so full source reconciliation remains open.
**Next phase (not started):** Phase 2 isolated commercial persistence — needs explicit request.
