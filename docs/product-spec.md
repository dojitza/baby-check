# BabyCheck product specification

## Goal

BabyCheck helps a caregiver record sleep and bottle events quickly, then walks through an explainable order of checks when a baby is unsettled. It does not determine or diagnose the cause.

## Audience and locale

- Croatian interface.
- Danish official guidance and Danish regional medical contacts.
- One baby, one browser profile, birth through 24 months.

## MVP flows

1. Onboarding: optional nickname, birth date, optional due date/prematurity, Danish region, bottle kinds, informed limitation acknowledgement.
2. Today: current age and sleep/awake status, last bottle, active bottle warning, quick entry, fussy checklist.
3. Sleep: start/stop now or add a completed interval; reject future, inverted, and overlapping intervals.
4. Bottle: completed feeding or prepared bottle, milk kind, amount, preparation/storage state, timestamps.
5. Fussy session: urgent review first; bottle safety; data-supported tired/hunger; manual routine checks; professional care and caregiver safety.
6. History: editable/deletable local timeline.
7. Settings: theme, storage status, backup/restore/delete, guidance sources and contacts.

## Algorithm boundaries

- Fixed safety lanes always outrank heuristic suggestions.
- Personal patterns require at least five usable observations.
- Previous “helped” outcomes require at least three occurrences and only provide a bounded tie-break boost.
- No remote AI, cry recording, diagnosis, or confidence percentage.
- Danish guidance does not establish exact wake windows; BabyCheck labels personal awake patterns as observations rather than medical limits.

## Privacy

All baby records are stored in IndexedDB on the device. BabyCheck makes no runtime API calls and includes no analytics. GitHub Pages may log ordinary visitor network metadata such as IP address while serving static application files. Exports are unencrypted JSON and should be handled as private files.

## Non-goals

Caregiver synchronization, accounts, multiple babies, breastfeeding/solid/nappy diaries, guaranteed background alarms, app-store packaging, and medical-device certification are outside the MVP.
