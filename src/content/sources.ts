import type { DanishRegion, SourceReference } from '../domain/types'

export const GUIDANCE_VERSION = 'dk-2026-07-18'
export const GUIDANCE_ACCESSED_AT = '2026-07-18'

export const sources: SourceReference[] = [
  {
    id: 'dk-sundhed-newborn-home-2025',
    authority: 'sundhed.dk — Patienthåndbogen',
    title: 'Gode råd når man kommer hjem med en nyfødt',
    url: 'https://www.sundhed.dk/borger/patienthaandbogen/boern/om-boern/det-nyfoedte-barn/gode-raad-naar-man-kommer-hjem/',
    reviewedAt: '2025-03-06',
    accessedAt: GUIDANCE_ACCESSED_AT,
    topic: 'crying',
    note: 'Glad, pelena, umor, kontakt, mir i temperatura kao uobičajene provjere.',
  },
  {
    id: 'dk-sundhed-crying-2025',
    authority: 'sundhed.dk — Patienthåndbogen',
    title: 'Grædende baby, gode råd til at bevare roen',
    url: 'https://www.sundhed.dk/borger/patienthaandbogen/boern/sygdomme/overgreb-og-omsorgssvigt-mod-boern/graedende-baby-gode-raad-til-at-bevare-roen/',
    reviewedAt: '2025-07-24',
    accessedAt: GUIDANCE_ACCESSED_AT,
    topic: 'crying',
    note: 'Siguran predah za skrbnika i upozorenje da se beba nikada ne trese.',
  },
  {
    id: 'dk-sundhed-formula-2025',
    authority: 'sundhed.dk — Patienthåndbogen',
    title: 'Modermælkserstatning, bland et måltid ad gangen',
    url: 'https://www.sundhed.dk/borger/patienthaandbogen/boern/om-boern/det-nyfoedte-barn/modermaelkserstatning-bland-et-maaltid-ad-gangen/',
    reviewedAt: '2025-03-06',
    accessedAt: GUIDANCE_ACCESSED_AT,
    topic: 'formula',
    note: 'Jedna svježa bočica po obroku u prva dva mjeseca i bacanje ostatka.',
  },
  {
    id: 'dk-sst-formula-2020',
    authority: 'Sundhedsstyrelsen i Fødevarestyrelsen',
    title: 'Håndtering af pulverformige modermælkserstatninger',
    url: 'https://www.sst.dk/udgivelser/2020/haandtering-af-pulverformige-modermaelkserstatninger',
    reviewedAt: '2020-01-06',
    accessedAt: GUIDANCE_ACCESSED_AT,
    topic: 'formula',
    note: 'Posebne mjere za prerano rođenu i imunokompromitiranu djecu te hlađenje do 5 °C.',
  },
  {
    id: 'dk-sundhed-sleep-2024',
    authority: 'sundhed.dk — Patienthåndbogen',
    title: 'Babyer og søvn',
    url: 'https://www.sundhed.dk/borger/patienthaandbogen/boern/om-boern/det-nyfoedte-barn/babyer-og-soevn/',
    reviewedAt: '2024-08-09',
    accessedAt: GUIDANCE_ACCESSED_AT,
    topic: 'sleep',
    note: 'Velike individualne razlike; manjak sna može učiniti malo dijete razdražljivim.',
  },
  {
    id: 'dk-sundhed-seriously-ill-2024',
    authority: 'sundhed.dk — Patienthåndbogen',
    title: 'Er barnet alvorlig sygt?',
    url: 'https://www.sundhed.dk/borger/patienthaandbogen/boern/symptomer/er-barnet-alvorlig-sygt/',
    reviewedAt: '2024-08-26',
    accessedAt: GUIDANCE_ACCESSED_AT,
    topic: 'urgentCare',
    note: 'Znakovi zbog kojih treba hitna ili liječnička procjena.',
  },
  {
    id: 'dk-sundhed-out-of-hours',
    authority: 'sundhed.dk / Danske Regioner',
    title: 'Lægevagten',
    url: 'https://www.sundhed.dk/borger/sygdom-og-behandling/akut-hjaelp/laegevagt/',
    reviewedAt: '2023-08-23',
    accessedAt: GUIDANCE_ACCESSED_AT,
    topic: 'regionalCare',
    note: 'Dežurna liječnička služba kada vlastiti liječnik ne radi.',
  },
]

export interface RegionContact {
  id: DanishRegion
  label: string
  phone: string
  displayPhone: string
  availability: string
  url: string
}

export const regionContacts: Record<DanishRegion, RegionContact> = {
  hovedstaden: {
    id: 'hovedstaden',
    label: 'Region Hovedstaden',
    phone: '1813',
    displayPhone: '1813',
    availability: '24 sata dnevno',
    url: 'https://laegevagten.dk/region/hovedstaden/laegevagten/',
  },
  sjaelland: {
    id: 'sjaelland',
    label: 'Region Sjælland',
    phone: '1818',
    displayPhone: '1818',
    availability: 'radnim danom 16–08; vikendom i blagdanom cijeli dan',
    url: 'https://laegevagten.dk/region/sjaelland/laegevagten/',
  },
  syddanmark: {
    id: 'syddanmark',
    label: 'Region Syddanmark',
    phone: '+4570110707',
    displayPhone: '70 11 07 07',
    availability: 'radnim danom 16–08; vikendom i blagdanom cijeli dan',
    url: 'https://laegevagten.dk/region/syddanmark/laegevagten/',
  },
  midtjylland: {
    id: 'midtjylland',
    label: 'Region Midtjylland',
    phone: '+4570113131',
    displayPhone: '70 11 31 31',
    availability: 'radnim danom 16–08; vikendom i blagdanom cijeli dan',
    url: 'https://laegevagten.dk/region/midtjylland/laegevagten/',
  },
  nordjylland: {
    id: 'nordjylland',
    label: 'Region Nordjylland',
    phone: '+4570150300',
    displayPhone: '70 15 03 00',
    availability: 'radnim danom 16–08; vikendom i blagdanom cijeli dan',
    url: 'https://laegevagten.dk/region/nordjylland/laegevagten/',
  },
}

export const urgentSigns = [
  'Beba ne diše ili ima ozbiljne teškoće s disanjem.',
  'Bebu nije moguće probuditi ili ne reagira kao inače.',
  'Koža, usne ili jezik postaju plavi, sivi ili izrazito blijedi.',
  'Beba ima grčeve ili se guši i ne može disati.',
]

export const clinicianSigns = [
  'Beba je mlitava, neobično pospana ili je kontakt bitno drukčiji.',
  'Disanje je ubrzano ili naporno, koža se uvlači između rebara.',
  'Osip ne blijedi kada ga pritisnete.',
  'Beba odbija piti, često povraća ili ima znatno manje mokrih pelena.',
  'Plač je trajan, neobičan ili bebu nije moguće utješiti.',
  'Beba mlađa od 3 mjeseca ima temperaturu višu od 38 °C.',
]
