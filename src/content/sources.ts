import type { SourceReference } from '../domain/types'

export const GUIDANCE_ACCESSED_AT = '2026-07-19'

export const sources: SourceReference[] = [
  {
    id: 'dk-sst-sleep-length-2025',
    authority: 'Sundhedsstyrelsen',
    title: 'Anbefalinger for søvnlængde',
    url: 'https://www.sst.dk/vidensbase/forebyggelse/anbefalinger-for-soevnlaengde',
    reviewedAt: '2025-11-04',
    accessedAt: GUIDANCE_ACCESSED_AT,
    topic: 'sleep',
    note: 'Opći raspon ukupnog sna u 24 sata; uključuje dnevne odmore i nije točan prozor budnosti.',
  },
  {
    id: 'dk-sundhed-sleep-pattern-2025',
    authority: 'sundhed.dk — Patienthåndbogen',
    title: 'Søvnmønster hos børn under 3 år',
    url: 'https://www.sundhed.dk/borger/patienthaandbogen/boern/sygdomme/oevrige-sygdomme/soevnmoenster-hos-boern-under-3-aar/',
    reviewedAt: '2025-01-17',
    accessedAt: GUIDANCE_ACCESSED_AT,
    topic: 'sleep',
    note: 'Velike individualne razlike; pratiti znakove umora i osobni ritam.',
  },
  {
    id: 'dk-sundhed-newborn-feeding-2025',
    authority: 'sundhed.dk — Patienthåndbogen',
    title: 'Gode råd når man kommer hjem med en nyfødt',
    url: 'https://www.sundhed.dk/borger/patienthaandbogen/boern/om-boern/det-nyfoedte-barn/gode-raad-naar-man-kommer-hjem/',
    reviewedAt: '2025-03-06',
    accessedAt: GUIDANCE_ACCESSED_AT,
    topic: 'feeding',
    note: 'Novorođenčad se hrani često; pratiti znakove gladi i napredovanje, ne slijepo raspored.',
  },
  {
    id: 'web-notifications-2026',
    authority: 'MDN / WebKit',
    title: 'PWA notification capabilities',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API',
    reviewedAt: '2026-05-25',
    accessedAt: GUIDANCE_ACCESSED_AT,
    topic: 'notifications',
    note: 'Dopuštenje je obavezno; frontend-only aplikacija ne može zajamčeno rasporediti obavijest dok je potpuno zatvorena.',
  },
]
