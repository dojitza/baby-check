# Copilot Instructions

- BabyCheck is a Croatian-language, local-first PWA for Denmark.
- Never add analytics, remote fonts, advertisements, or a backend without an explicit product decision.
- Medical-adjacent behavior must be deterministic, explainable, conservative, and mapped to an official source in `src/content/sources.ts`.
- Never claim to diagnose why a baby is crying or present heuristic scores as medical probabilities.
- Use IndexedDB for records; only tiny presentation preferences may use localStorage.
- Preserve GitHub Pages compatibility under the `/baby-check/` base path and keep the core application fully offline.
- Every multi-phase implementation ends with cleanup/refactor: extract shared types/config/functions, remove duplication and dead code, split files over roughly 300 lines where practical, and remove unused imports.
