# Guidance source maintenance

Last source review: **2026-07-18**.

The executable registry is in `src/content/sources.ts`. This document records implementation decisions and conflicts; it does not replace the original Danish material.

## Formula

- sundhed.dk, _Modermælkserstatning, bland et måltid ad gangen_, updated 2025-03-06.
- Sundhedsstyrelsen/Fødevarestyrelsen, _Håndtering af pulverformige modermælkserstatninger_, 2020-01-06.

Encoded conservatively:

- Prepare one powdered-formula bottle immediately before each feed during the first two months.
- Continue fresh single-feed preparation for premature babies unless their care team directs otherwise.
- A healthy, term baby older than two months may have powdered formula prepared for at most 24 hours only when immediately refrigerated at no more than 5 °C.
- Discard all leftovers after a feed; do not store or reheat them.
- Always follow the product label's ratio and preparation directions.

Not encoded:

- A universal room-temperature expiry.
- A universal opened ready-to-feed expiry.
- A universal expressed-milk expiry.
- A universal 70 °C preparation step. Official Danish documents contain practical temperature tension, so the interface directs caregivers to the package and care team rather than pretending there is one context-free rule.

## Crying and caregiver safety

- sundhed.dk, _Gode råd når man kommer hjem med en nyfødt_, updated 2025-03-06.
- sundhed.dk, _Grædende baby, gode råd til at bevare roen_, updated 2025-07-24.

The app paraphrases common checks: hunger, nappy, tiredness, contact, temperature and overstimulation. It includes a safe caregiver break and never-shake warning.

## Urgent care

- sundhed.dk, _Er barnet alvorlig sygt?_, updated 2024-08-26.
- sundhed.dk / Danske Regioner, _Lægevagten_.
- Official regional contact pages linked by `src/content/sources.ts`.

Numbers verified 2026-07-18:

- Hovedstaden: 1813.
- Sjælland: 1818.
- Syddanmark: 70 11 07 07.
- Midtjylland: 70 11 31 31.
- Nordjylland: 70 15 03 00.
- Life-threatening emergency: 112.

Denmark's regional reform begins 2027-01-01 and does not yet define replacement helpline numbers. Recheck all region records by 2026-12-01; do not predict future numbers.

## Sleep

- sundhed.dk, _Babyer og søvn_, updated 2024-08-09.

BabyCheck uses sleep records and the baby's personal pattern after five observations. It does not encode commercial age-based wake-window tables because no Danish official source establishing exact wake windows was found.

## Release process

Before changing a numeric threshold:

1. Open the canonical official source.
2. Record publisher, page title, update date and access date.
3. Check whether another official source conflicts.
4. Prefer a conservative non-numeric message when unresolved.
5. Add/update unit tests for every boundary.
6. Have medical-adjacent copy reviewed by a Danish health professional before promoting the app as anything beyond a personal caregiver aid.
