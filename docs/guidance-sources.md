# Guidance source maintenance

Last source review: **2026-07-19**.

## Current scope

BabyCheck 0.2 tracks sleep and completed meals only. It no longer evaluates fussy causes or prepared-bottle safety.

## Sleep

- Sundhedsstyrelsen, _Anbefalinger for søvnlængde_, updated 2025-11-04.
- sundhed.dk, _Søvnmønster hos børn under 3 år_, updated 2025-01-17.

Encoded as general 24-hour guidance including naps:

- 0–3 months: 14–17 hours.
- 4–11 months: 12–15 hours.
- 1–2 years: 11–14 hours.

These are broad recommendations with substantial individual variation. BabyCheck does not encode commercial age-based wake-window tables because no Danish official source establishing exact wake windows was found. After five completed wake periods it can show the baby's own median as an observation, not a medical limit.

## Feeding

- sundhed.dk, _Gode råd når man kommer hjem med en nyfødt_, updated 2025-03-06.
- Sundhedsstyrelsen, _Sunde børn_, 2021 parent handbook.

BabyCheck records breast, bottle, and solid meals. It uses only personal completed-meal intervals for estimates. Official examples such as frequent newborn feeds provide context but are not converted into a rigid alarm schedule. Hunger cues, growth, and professional advice take precedence.

## Notifications

The Notifications API can display persistent notifications via a service worker after explicit permission. iOS support requires an installed Home Screen web app. A frontend-only PWA has no reliable cross-browser local scheduler that wakes a fully closed app. Periodic Background Sync is unsupported on Safari/iOS and is not an exact timer. Reliable closed-app Web Push would require a backend push sender and storing subscriptions/schedules.

BabyCheck therefore offers best-effort notifications while active or resumed, plus app badges where available, and explicitly discloses the limitation.

## Release process

Before changing a numeric threshold, verify the current official source, record its update/access date, preserve broad-language caveats, and add boundary tests. Medical-adjacent copy should receive professional review before public health promotion.
