# BabyCheck

BabyCheck is a Croatian-language, local-first PWA for tracking a baby's **sleep and meals**. It shows broad Danish age-based daily sleep guidance and learns likely next sleep/meal timing from the baby's own recent records.

## What it does

- One-tap sleep start/wake plus editable manual intervals.
- Simple meals: breastfeeding, bottle, or solids; optional ml, duration, and notes.
- Rolling sleep total for the last 24 hours.
- Danish general sleep bands: 0–3 months 14–17 h, 4–11 months 12–15 h, and 1–2 years 11–14 h, including naps.
- Personal wake and meal estimates after at least five usable intervals.
- Best-effort in-app, badge, and OS reminders while the PWA is active.
- IndexedDB persistence, schema-v1 bottle-to-meal migration, and v1/v2 JSON backup import.
- Offline installation, dark mode, no account, backend, analytics, advertisements, or runtime third-party requests.

## Important limitations

Danish official guidance does not define exact age-based wake windows. BabyCheck never labels a wake deadline as an official Danish recommendation. Timing estimates are medians from the baby's own logs and are not medical deadlines. Sleep and hunger cues take priority.

A frontend-only PWA cannot reliably wake itself at an exact time while fully closed. Notifications require explicit permission and are best effort while the app is active or resumed. Reliable closed-app Web Push would require backend scheduling and storage of push subscriptions, which this private local-only release deliberately avoids.

## Development

- `npm ci`
- `npm run dev`
- `npm run check`
- `npm run test:e2e`

Production: `https://kotarski.dev/baby-check/`

## Architecture

- `src/domain/rhythm/` — pure sleep/meal estimate logic.
- `src/db/` — Dexie schema v2, legacy migration, backup import/export.
- `src/notifications/` — permission, deduplication, foreground notification and badge logic.
- `src/features/` — onboarding, dashboard, sleep/meal entry, history, settings.

Baby data remains in the current browser's IndexedDB. Exported backups are unencrypted private JSON files.

MIT licensed.
