import type {
  BabyProfile,
  CheckRecommendation,
  DerivedMetrics,
  FussyCheckCategory,
  FussySession,
} from '../types'
import { evaluateBottleSafety } from '../bottles/evaluateBottleSafety'
import { formatDuration } from '../../utils/dateTime'

const CATEGORY_TIE_ORDER: FussyCheckCategory[] = [
  'urgent',
  'bottleSafety',
  'tired',
  'hungry',
  'nappy',
  'wind',
  'temperature',
  'contact',
  'stimulation',
  'discomfort',
  'professionalCare',
  'caregiverSafety',
]

export function evaluateFussyChecks(
  profile: BabyProfile,
  metrics: DerivedMetrics,
  pastSessions: FussySession[],
  now = new Date(),
): CheckRecommendation[] {
  const recommendations: CheckRecommendation[] = [urgentCheck()]

  for (const bottle of metrics.activeBottles) {
    const evaluation = evaluateBottleSafety(bottle, profile, now)
    if (evaluation.recommendation) {
      recommendations.push(evaluation.recommendation)
      break
    }
  }

  if (!metrics.isSleeping) {
    recommendations.push(tiredCheck(metrics))
  }
  recommendations.push(hungerCheck(metrics))
  recommendations.push(...routineChecks(metrics))
  recommendations.push(professionalCareCheck(profile.region))
  recommendations.push(caregiverSafetyCheck())

  const outcomeBoosts = calculateOutcomeBoosts(pastSessions)
  return recommendations
    .map((recommendation) => ({
      ...recommendation,
      score:
        recommendation.lane >= 3
          ? recommendation.score + (outcomeBoosts.get(recommendation.category) ?? 0)
          : recommendation.score,
    }))
    .sort((a, b) => {
      if (a.lane !== b.lane) return a.lane - b.lane
      if (a.score !== b.score) return b.score - a.score
      return CATEGORY_TIE_ORDER.indexOf(a.category) - CATEGORY_TIE_ORDER.indexOf(b.category)
    })
}

function urgentCheck(): CheckRecommendation {
  return {
    category: 'urgent',
    lane: 1,
    score: 100,
    title: 'Prvo provjerite znakove bolesti',
    action:
      'Pogledajte diše li beba normalno, reagira li kao inače i izgleda li boja kože normalno. Otvorite popis hitnih znakova ako niste sigurni.',
    reason: 'Ova kratka sigurnosna provjera uvijek je prva, neovisno o zapisima.',
    sourceIds: ['dk-sundhed-seriously-ill-2024'],
    urgent: true,
  }
}

function tiredCheck(metrics: DerivedMetrics): CheckRecommendation {
  const awake = metrics.awakeMinutes
  const usual = metrics.usualWakeMedianMinutes
  if (awake !== null && usual !== null) {
    const ratio = awake / Math.max(usual, 1)
    const score = ratio >= 1.15 ? 95 : ratio >= 0.9 ? 75 : 45
    return {
      category: 'tired',
      lane: 3,
      score,
      title: ratio >= 1.15 ? 'Pokušajte mirno uspavljivanje' : 'Provjerite znakove umora',
      action:
        'Smanjite svjetlo i podražaje, govorite tiho i pokušajte uobičajenu rutinu uspavljivanja. Za spavanje položite bebu na leđa u siguran krevetić.',
      reason: `Budna je ${formatDuration(awake)}. U posljednjim zapisima sredina budnih razdoblja bila je oko ${formatDuration(usual)}. To je osobni obrazac, ne medicinski rok.`,
      sourceIds: ['dk-sundhed-sleep-2024'],
    }
  }

  return {
    category: 'tired',
    lane: 3,
    score: awake !== null && awake >= 120 ? 65 : 40,
    title: 'Provjerite znakove umora',
    action:
      'Tražite zijevanje, odvraćanje pogleda, trljanje očiju ili razdražljivost. Smanjite svjetlo i podražaje ako djeluje umorno.',
    reason:
      awake === null
        ? 'Još nema dovoljno zapisa da procijenimo koliko je dugo budna.'
        : `Budna je ${formatDuration(awake)}, ali još nema dovoljno osobnih podataka za usporedbu. Danske smjernice ne propisuju točne prozore budnosti.`,
    sourceIds: ['dk-sundhed-sleep-2024'],
  }
}

function hungerCheck(metrics: DerivedMetrics): CheckRecommendation {
  const elapsed = metrics.lastBottleMinutesAgo
  const usual = metrics.usualBottleIntervalMinutes
  const amount = metrics.lastBottle
    ? (metrics.lastBottle.consumedMl ?? metrics.lastBottle.offeredMl)
    : null

  if (elapsed !== null && usual !== null) {
    const ratio = elapsed / Math.max(usual, 1)
    return {
      category: 'hungry',
      lane: 3,
      score: ratio >= 0.9 ? 90 : ratio >= 0.65 ? 65 : 35,
      title: ratio >= 0.9 ? 'Provjerite znakove gladi' : 'Možda nije glad, ali provjerite znakove',
      action:
        'Tražite okretanje prema bočici, mljackanje ili ruke prema ustima. Ponudite hranjenje prema bebinim znakovima i ne prisiljavajte je da završi.',
      reason: `Od zadnje bočice prošlo je ${formatDuration(elapsed)}${amount ? ` (${amount} ml)` : ''}. Uobičajeni razmak u posljednjim zapisima je oko ${formatDuration(usual)}.`,
      sourceIds: ['dk-sundhed-newborn-home-2025'],
    }
  }

  return {
    category: 'hungry',
    lane: 3,
    score: elapsed === null ? 60 : elapsed >= 180 ? 70 : 38,
    title: 'Provjerite znakove gladi',
    action:
      'Tražite okretanje prema bočici, mljackanje ili ruke prema ustima. Slijedite bebine znakove i ne prisiljavajte je da završi bočicu.',
    reason:
      elapsed === null
        ? 'Nema zabilježene zadnje bočice.'
        : `Od zadnje bočice prošlo je ${formatDuration(elapsed)}; još nema dovoljno osobnih zapisa za pouzdanu usporedbu.`,
    sourceIds: ['dk-sundhed-newborn-home-2025'],
  }
}

function routineChecks(metrics: DerivedMetrics): CheckRecommendation[] {
  const recentBottle = metrics.lastBottleMinutesAgo !== null && metrics.lastBottleMinutesAgo <= 60

  return [
    {
      category: 'nappy',
      lane: 4,
      score: 80,
      title: 'Provjerite pelenu',
      action: 'Provjerite je li pelena mokra ili prljava i ima li crvenila ili iritacije.',
      reason: 'Pelene ne pratimo u aplikaciji pa je ovo uvijek važna ručna provjera.',
      sourceIds: ['dk-sundhed-newborn-home-2025'],
    },
    {
      category: 'wind',
      lane: 4,
      score: recentBottle ? 85 : 45,
      title: 'Pomozite bebi podrignuti',
      action: 'Držite je uspravno uz potporu glave i nježno tapkajte ili trljajte leđa.',
      reason: recentBottle
        ? `Bočica je bila prije ${formatDuration(metrics.lastBottleMinutesAgo)} pa progutani zrak može stvarati nelagodu.`
        : 'Progutani zrak ponekad stvara nelagodu, osobito nakon bočice.',
      sourceIds: ['dk-sundhed-newborn-home-2025'],
    },
    {
      category: 'temperature',
      lane: 4,
      score: 65,
      title: 'Provjerite je li joj prevruće ili prehladno',
      action: 'Dodirnite vrat ili leđa. Skinite ili dodajte jedan lagani sloj prema potrebi.',
      reason:
        'Male bebe slabije reguliraju temperaturu i mogu biti nemirne ako im je prevruće ili hladno.',
      sourceIds: ['dk-sundhed-newborn-home-2025'],
    },
    {
      category: 'contact',
      lane: 4,
      score: 60,
      title: 'Ponudite blizinu i miran kontakt',
      action:
        'Držite bebu uz prsa, govorite tihim glasom ili pokušajte kontakt koža-na-kožu dok ste budni.',
      reason: 'Potreba za kontaktom jedan je od čestih razloga plača.',
      sourceIds: ['dk-sundhed-newborn-home-2025'],
    },
    {
      category: 'stimulation',
      lane: 4,
      score: 55,
      title: 'Smanjite podražaje',
      action:
        'Prigušite svjetlo, utišajte prostor i nekoliko minuta pokušavajte samo jednu mirnu metodu.',
      reason: 'Previše buke, ljudi, svjetla ili brzih promjena može dodatno uznemiriti bebu.',
      sourceIds: ['dk-sundhed-newborn-home-2025'],
    },
    {
      category: 'discomfort',
      lane: 4,
      score: 50,
      title: 'Provjerite jednostavnu fizičku nelagodu',
      action:
        'Provjerite tijesnu odjeću, nabor, vlas omotanu oko prsta ili nožnog prsta, nos i položaj tijela.',
      reason:
        'Aplikacija ne može vidjeti bol ili fizičku nelagodu pa ih treba provjeriti rukom i pogledom.',
      sourceIds: [],
    },
  ]
}

function professionalCareCheck(region: BabyProfile['region']): CheckRecommendation {
  return {
    category: 'professionalCare',
    lane: 5,
    score: 70,
    title: 'Ako je plač neobičan ili trajan, nazovite stručnu pomoć',
    action: `Ako beba izgleda bolesno, slabije pije ili plač nije uobičajen, nazovite vlastitog liječnika ili dežurnu službu za regiju ${region}. Za životnu ugroženost nazovite 112.`,
    reason: 'Aplikacija ne može isključiti bol, bolest ili drugi medicinski uzrok.',
    sourceIds: ['dk-sundhed-seriously-ill-2024', 'dk-sundhed-out-of-hours'],
  }
}

function caregiverSafetyCheck(): CheckRecommendation {
  return {
    category: 'caregiverSafety',
    lane: 5,
    score: 60,
    title: 'Ako gubite kontrolu, napravite siguran predah',
    action:
      'Položite bebu na leđa u siguran krevetić, nakratko se udaljite i nazovite nekoga tko može pomoći. Nikada ne tresite bebu.',
    reason: 'Vaša sigurnost i bebina sigurnost važnije su od dovršavanja popisa.',
    sourceIds: ['dk-sundhed-crying-2025'],
  }
}

function calculateOutcomeBoosts(sessions: FussySession[]): Map<FussyCheckCategory, number> {
  const helpedCount = new Map<FussyCheckCategory, number>()
  for (const session of sessions.slice(0, 30)) {
    for (const result of session.results) {
      if (result.outcome === 'helped') {
        helpedCount.set(result.category, (helpedCount.get(result.category) ?? 0) + 1)
      }
    }
  }

  const boosts = new Map<FussyCheckCategory, number>()
  for (const [category, count] of helpedCount) {
    if (count >= 3) boosts.set(category, Math.min(12, count * 2))
  }
  return boosts
}
