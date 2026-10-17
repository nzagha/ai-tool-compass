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
