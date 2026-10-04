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
