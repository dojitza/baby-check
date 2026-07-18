# BabyCheck

BabyCheck is a Croatian-language, mobile-first, local-only PWA for caregivers in Denmark. It records sleep and bottle events and provides a transparent order of checks when a baby is unsettled.

BabyCheck does **not** know or diagnose why a baby is crying. It keeps urgent warning signs above all heuristics and links medical-adjacent wording to official Danish sources.

## Features

- One local baby profile, including chronological and optional corrected age.
- One-tap and manual sleep recording with overlap protection.
- Powdered formula, ready-to-feed formula and expressed-milk bottle records.
- Conservative, source-versioned active-bottle checks.
- Explainable fussy checklist using fixed safety lanes and personal patterns only after enough observations.
- Danish regional out-of-hours contacts and direct `112` action.
- IndexedDB persistence, persistent-storage request and validated JSON backup/restore.
- Offline service worker, installable manifest, iOS safe areas and dark mode.
- No account, backend, analytics, remote fonts, advertisements or runtime API requests.

## Technology

- React 19, TypeScript and Vite.
- Dexie/IndexedDB for local records.
- Zod for backup validation.
- `vite-plugin-pwa` and Workbox for installation and offline use.
- Vitest and Playwright for deterministic domain and mobile browser tests.

## Local development

Requirements: Node 22.12 or newer and npm.

1. Install dependencies with `npm ci`.
2. Start development with `npm run dev`.
3. Open `http://localhost:5173/baby-check/`.

Quality commands:

- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run test:e2e`
- `npm run check`

Install Playwright engines once with `npx playwright install chromium webkit`.

## Architecture

- `src/db/` — versioned IndexedDB schema and backup/restore.
- `src/domain/` — pure age, sleep, bottle-safety and fussy-ranking logic.
- `src/content/` — Croatian labels, Danish official sources and regional contacts.
- `src/features/` — onboarding, dashboard, entry forms, checklist, history and settings.
- `src/styles/` — mobile-first design tokens and component styles.
- `tests/` — deterministic unit tests.
- `e2e/` — mobile Chromium and WebKit user flows.
- `docs/guidance-sources.md` — source conflicts, encoded rules and re-review process.

## Privacy and storage

Baby records remain in IndexedDB on the current device. Clearing website data, uninstalling the PWA or browser storage pressure can remove records. The app requests persistent storage but browsers may decline. Exported JSON backups are not encrypted and should be treated as private files.

GitHub Pages serves the static application and may log ordinary request metadata, including visitor IP addresses. BabyCheck itself sends no baby records and embeds no third-party resources.

## Medical-adjacent limitations

The checklist uses deterministic rules, not an LLM or a diagnostic model. It does not calculate a medical probability. A sentence such as “awake longer than the recent personal median” describes only recorded history.

For life-threatening illness or injury in Denmark, call `112`. Persistent, unusual or concerning crying and signs of illness require professional assessment. See `docs/guidance-sources.md` for source mapping and review dates.

## Deployment

The application is built for the `/baby-check/` subpath and deployed to GitHub Pages by `.github/workflows/deploy-pages.yml` after the quality workflow passes on `main`.

Production URL: `https://kotarski.dev/baby-check/`. GitHub's standard
`https://dojitza.github.io/baby-check/` address redirects there because this
account already has the verified `kotarski.dev` Pages domain.

Repository Settings → Pages must use **GitHub Actions** as the source. A public repository is required on GitHub Free.

To roll back, revert `main` to a known-good commit and let the Pages workflow redeploy. Static deploys do not intentionally clear client IndexedDB, but schema migrations must remain backward safe.

## License

MIT. Health guidance remains attributable to its original publishers and is paraphrased in the interface.
