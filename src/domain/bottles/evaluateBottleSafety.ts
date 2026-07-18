import type { BabyProfile, BottleEntry, CheckRecommendation } from '../types'
import { differenceInMinutes } from '../../utils/dateTime'

export interface BottleSafetyEvaluation {
  recommendation?: CheckRecommendation
  state: 'safe' | 'caution' | 'discard' | 'needsLabel'
  label: string
}

const SAFETY_SEVERITY: Record<BottleSafetyEvaluation['state'], number> = {
  safe: 0,
  needsLabel: 1,
  caution: 2,
  discard: 3,
}

export function evaluateActiveBottles(
  bottles: BottleEntry[],
  profile: BabyProfile,
  now = new Date(),
): Array<{ bottle: BottleEntry; result: BottleSafetyEvaluation }> {
  return bottles
    .map((bottle) => ({ bottle, result: evaluateBottleSafety(bottle, profile, now) }))
    .sort((a, b) => {
      const severity = SAFETY_SEVERITY[b.result.state] - SAFETY_SEVERITY[a.result.state]
      if (severity !== 0) return severity
      return new Date(a.bottle.preparedAt).getTime() - new Date(b.bottle.preparedAt).getTime()
    })
}

export function evaluateBottleSafety(
  bottle: BottleEntry,
  profile: BabyProfile,
  now = new Date(),
): BottleSafetyEvaluation {
  if (bottle.status === 'discarded' || bottle.status === 'finished') {
    return { state: 'safe', label: 'Bočica je završena.' }
  }

  if (bottle.status === 'feeding') {
    return warning(
      'discard',
      'Nakon ovog hranjenja bacite ostatak.',
      'Započeta bočica ne sprema se niti ponovno zagrijava. Bacite sav ostatak nakon obroka.',
      'Bočica je već dotaknula bebina usta.',
      ['dk-sundhed-formula-2025'],
    )
  }

  if (bottle.kind === 'expressedMilk') {
    return warning(
      'needsLabel',
      'Provjerite način i trajanje čuvanja izdojenog mlijeka.',
      'Provjerite kada je mlijeko izdojeno, kako je čuvano i upute zdravstvene patronažne sestre. Aplikacija zasad ne pretpostavlja univerzalan rok.',
      'Za izdojeno mlijeko nismo kodirali nepodržani univerzalni rok.',
      [],
    )
  }

  if (bottle.kind === 'readyFormula') {
    return warning(
      'needsLabel',
      'Provjerite deklaraciju otvorene gotove formule.',
      'Ne razrjeđujte gotovu formulu. Nakon otvaranja slijedite rok i način čuvanja naveden na pakiranju.',
      'Rok nakon otvaranja razlikuje se među proizvodima.',
      ['dk-sst-formula-2020'],
    )
  }

  const ageDays = correctedAgeDays(profile, now)
  const preparedMinutesAgo = differenceInMinutes(now, new Date(bottle.preparedAt))

  if (profile.premature || ageDays < 60) {
    if (bottle.storage === 'fresh' && preparedMinutesAgo <= 60) {
      return warning(
        'caution',
        'Upotrijebite svježu bočicu sada.',
        profile.premature
          ? 'Za prerano rođenu bebu pripremajte jednu svježu bočicu neposredno prije svakog hranjenja, osim ako je zdravstveni stručnjak rekao drukčije.'
          : 'U prva dva mjeseca pripremajte jednu svježu bočicu neposredno prije svakog hranjenja.',
        `Označena je kao svježa i pripremljena prije ${preparedMinutesAgo} min. Nemojte je spremati za kasnije.`,
        ['dk-sundhed-formula-2025', 'dk-sst-formula-2020'],
      )
    }
    return warning(
      'discard',
      'Pripremite novu bočicu neposredno prije hranjenja.',
      profile.premature
        ? 'Za prerano rođenu bebu praškastu formulu pripremajte svježu za svaki obrok, osim ako je zdravstveni stručnjak rekao drukčije.'
        : 'U prva dva mjeseca praškastu formulu pripremite neposredno prije svakog hranjenja.',
      bottle.storage === 'fridge'
        ? 'Ova bočica pripremljena je unaprijed.'
        : `Pripremljena je prije ${preparedMinutesAgo} min.`,
      ['dk-sundhed-formula-2025', 'dk-sst-formula-2020'],
    )
  }

  if (bottle.storage !== 'fridge') {
    return warning(
      'discard',
      'Pripremite svježu bočicu.',
      'Danske smjernice ne daju jedno univerzalno kućno pravilo za praškastu formulu ostavljenu na sobnoj temperaturi. Nemojte nuditi nesigurnu bočicu.',
      `Bočica nije označena kao odmah ohlađena; pripremljena je prije ${preparedMinutesAgo} min.`,
      ['dk-sst-formula-2020'],
    )
  }

  if (preparedMinutesAgo >= 24 * 60) {
    return warning(
      'discard',
      'Bacite ovu bočicu.',
      'Unaprijed pripremljena praškasta formula u hladnjaku do 5 °C čuva se najviše 24 sata.',
      `Pripremljena je prije ${Math.floor(preparedMinutesAgo / 60)} h.`,
      ['dk-sst-formula-2020'],
    )
  }

  if (preparedMinutesAgo >= 20 * 60) {
    return warning(
      'caution',
      'Upotrijebite uskoro ili bacite.',
      'Pripremljena praškasta formula mora ostati u hladnjaku do 5 °C i potrošiti se unutar 24 sata.',
      `Do granice od 24 sata preostalo je približno ${Math.ceil((24 * 60 - preparedMinutesAgo) / 60)} h.`,
      ['dk-sst-formula-2020'],
    )
  }

  return {
    state: 'safe',
    label: `U hladnjaku je ${Math.floor(preparedMinutesAgo / 60)} h. Držite je na najviše 5 °C i slijedite upute s pakiranja.`,
  }
}

function warning(
  state: BottleSafetyEvaluation['state'],
  title: string,
  action: string,
  reason: string,
  sourceIds: string[],
): BottleSafetyEvaluation {
  return {
    state,
    label: reason,
    recommendation: {
      category: 'bottleSafety',
      lane: 2,
      score: state === 'discard' ? 100 : 70,
      title,
      action,
      reason,
      sourceIds,
    },
  }
}

function correctedAgeDays(profile: BabyProfile, now: Date): number {
  const date = profile.dueDate ?? profile.birthDate
  const start = new Date(`${date}T00:00:00`)
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86_400_000))
}
