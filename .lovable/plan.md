# Apply the aiBean brand system

## Outcome
Refresh the existing directory without changing its product structure or demo functionality. The result will use the supplied aiBean identity consistently across every screen.

## Brand update
- Replace the temporary wordmark and icon with the supplied aiBean lockup and bean mark, including the favicon.
- Self-host the supplied Satoshi, Inter, and Caveat variable fonts; use Satoshi for headings, Inter for body/UI, and Caveat sparingly for handwritten annotations.
- Rebuild the global palette around cream, ink, cobalt, and signal orange, with the four pastel colors reserved for category/status meaning.
- Update global radii, buttons, cards, borders, shadows, and transitions to match the 16px/pill, light-elevation brand system.

## Product surfaces
- Restyle the navigation, search, footer, cards, filters, scores, verification badges, and dialogs through shared tokens and components so all routes inherit the identity.
- Refine the homepage’s first screen and key calls to action around the supplied “Less noise. Better tools. Ship faster.” and builder-focused voice.
- Replace off-brand labels and corporate calls to action with the approved vocabulary while preserving clear navigation and existing destinations.
- Keep demo-data disclosures and sponsored-placement transparency intact.

## Assets and quality
- Store uploaded app imagery and fonts through the project asset flow; keep a real optimized bean-mark favicon in `public/`.
- Preserve accessibility, responsive behavior, current routes, saved stacks, comparison, and search interactions.
- Check desktop and mobile rendering, route metadata, browser errors, and the latest build result.

## Technical details
- Brand values remain semantic tokens in the global stylesheet; page code continues to use those tokens rather than raw colors.
- Shared logo presentation will be a reusable component, with the primary lockup used where space allows and the bean mark at compact sizes.
- No backend, authentication, or data-model changes are included.