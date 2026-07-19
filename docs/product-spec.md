# BabyCheck 0.2 product specification

## Goal

Answer three questions with minimal interaction:

1. How long has the baby been awake or asleep?
2. How much has the baby slept in the last 24 hours?
3. Based on personal logs, when may sleep or another meal be likely?

## Product boundaries

- Croatian UI, one baby, birth through 24 months.
- Only sleep and meals are tracked.
- No fussy-cause checklist, diagnosis, prepared-bottle lifecycle, caregiver synchronization, or remote AI.
- Age selects a general Danish 24-hour sleep range only.
- Exact timing requires five personal wake or meal intervals.
- Responsive feeding and observed cues override estimates.
- Reminders are permission-gated and frontend-only best effort.

## Data migration

Schema v2 converts completed schema-v1 bottle feeds into bottle meals. Prepared, feeding, and discarded bottles are not converted because they are not completed meals. Old fussy sessions are intentionally removed from the active schema. Backup import accepts v1 and converts it to v2 before writing.
