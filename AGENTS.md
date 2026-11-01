<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep demo directory content and typed domain models together in `src/lib/catalog.ts` so a database-backed repository can replace it without rewriting views.
- Keep shared discovery state in a client-side context in `src/components/app-shell.tsx` because the current MVP has no connected backend.
- Keep official brand assets behind `src/components/brand-logo.tsx` and semantic global tokens so the identity stays consistent across routes.
- Keep hero exploration in a focused preview component with a validated, hydration-safe local storage hook; use shared discovery context for actual saves so the preview and saved-tools page stay in sync.
- Public pages read tools/categories/use cases/skills through useCatalog() (sample data merged with admin-published records) so admin edits show site-wide.
- Edit AI skills through a typed form matching AISkill, using live catalog categories and tool slugs; this keeps admin records compatible with public skill cards and filters.
- Keep the user control panel under the client-gated `_authenticated` layout; authenticated account functions scope profile and contribution operations to context.userId so members cannot access each other's records.
- Reuse shared discovery state for the account workspace and explicitly distinguish browser-local saves from persisted profile and contribution records; this preserves existing collections without implying cross-device sync.
- Keep starting price and free-plan availability in tool payloads with a shared legacy pricing fallback; admin edits, details and comparisons must agree without requiring a schema migration.

- Derive public ownership status from database-maintained claim-state catalog entries, including sample-only tools; keep claimant details private and confirm ownership only through admin approval.
- Keep future monetization contracts separate from editorial catalog state and behind replaceable repository/provider adapters; this preserves independent ranking and avoids creating a second billing authority over the original application. Read docs/MONETIZATION_BUILD_CONTEXT.md and the other monetization documents before monetization work.
- Keep privileges out of profiles: admin lives in user_roles, Creator in user_capabilities, Tool ownership in vendor_access (one owner per tool, written only from admin-approved claims); clients get SELECT only and change these through SECURITY DEFINER RPCs, so no client or payment path can grant access.
- Monetization areas share `src/components/monetization/ui.tsx` and every area re-checks access in `src/lib/monetization.functions.ts`; navigation visibility is never the security boundary.
- Money is integer minor units through `src/lib/monetization/money.ts`; prices are versioned references with authority flags in `src/lib/monetization/model.ts`, not a pricing engine, so proposed prices can't be mistaken for live offers.
- Synthetic QA accounts come only from `scripts/qa-fixtures.ts`, which refuses non-local backends and keeps generated passwords out of the repo.
