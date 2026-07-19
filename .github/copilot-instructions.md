# Copilot Instructions

- BabyCheck is a Croatian-language, local-first PWA for Denmark.
- Never add analytics, remote fonts, advertisements, or a backend without an explicit product decision.
- Medical-adjacent behavior must be deterministic, explainable, conservative, and mapped to an official source in `src/content/sources.ts`.
- The product tracks only sleep and completed meals. Do not reintroduce fussy-cause checklists or prepared-bottle lifecycle.
- Danish guidance provides daily sleep ranges, not exact wake windows. Personal timing estimates require at least five samples and must never be called medical deadlines.
- Frontend-only reminders must never claim reliable delivery while the app is closed.
- Use IndexedDB for records; only tiny presentation preferences may use localStorage.
- Preserve GitHub Pages compatibility under the `/baby-check/` base path and keep the core application fully offline.
- Every multi-phase implementation ends with cleanup/refactor: extract shared types/config/functions, remove duplication and dead code, split files over roughly 300 lines where practical, and remove unused imports.
