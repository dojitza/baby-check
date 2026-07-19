import type {
  DerivedMetrics,
  NextEventEstimate,
  RhythmState,
  RhythmSummary,
  SleepGuidanceBand,
} from '../types'

const MIN_SAMPLES = 5
const APPROACHING_MINUTES = 20
const OVERDUE_MINUTES = 30

export const DANISH_SLEEP_GUIDANCE: SleepGuidanceBand[] = [
  {
    minAgeDays: 0,
    maxAgeDays: 121,
    recommendedMinMinutes: 14 * 60,
    recommendedMaxMinutes: 17 * 60,
    possibleMinMinutes: 11 * 60,
    possibleMaxMinutes: 19 * 60,
    sourceId: 'dk-sst-sleep-length-2025',
  },
  {
    minAgeDays: 122,
    maxAgeDays: 364,
    recommendedMinMinutes: 12 * 60,
    recommendedMaxMinutes: 15 * 60,
    possibleMinMinutes: 10 * 60,
    possibleMaxMinutes: 18 * 60,
    sourceId: 'dk-sst-sleep-length-2025',
  },
  {
    minAgeDays: 365,
    maxAgeDays: 730,
    recommendedMinMinutes: 11 * 60,
    recommendedMaxMinutes: 14 * 60,
    possibleMinMinutes: 9 * 60,
    possibleMaxMinutes: 16 * 60,
    sourceId: 'dk-sst-sleep-length-2025',
  },
]

export function getSleepGuidance(ageDays: number): SleepGuidanceBand {
  return (
    DANISH_SLEEP_GUIDANCE.find(
      (band) => ageDays >= band.minAgeDays && ageDays <= band.maxAgeDays,
    ) ?? DANISH_SLEEP_GUIDANCE.at(-1)!
  )
}

export function evaluateRhythm(metrics: DerivedMetrics): RhythmSummary {
  return {
    guidance: getSleepGuidance(metrics.correctedAgeDays),
    sleep: evaluateSleep(metrics),
    meal: evaluateMeal(metrics),
  }
}

function evaluateSleep(metrics: DerivedMetrics): NextEventEstimate {
  const sampleCount = metrics.recentWakeDurations.length
  if (metrics.isSleeping) {
    return {
      kind: 'sleep',
      state: 'onTrack',
      sampleCount,
      title: 'Beba sada spava',
      reason: 'Vrijeme za sljedeće spavanje procijenit ćemo nakon buđenja.',
    }
  }
  if (
    metrics.awakeMinutes === null ||
    metrics.usualWakeMedianMinutes === null ||
    sampleCount < MIN_SAMPLES ||
    !metrics.awakeSince
  ) {
    return {
      kind: 'sleep',
      state: 'notEnoughData',
      sampleCount,
      title: 'Još učimo ritam spavanja',
      reason: `Zabilježite još ${Math.max(0, MIN_SAMPLES - sampleCount)} završena budna razdoblja. Danske smjernice daju dnevnu količinu sna, ne točne prozore budnosti.`,
    }
  }
  const target = metrics.usualWakeMedianMinutes
  const minutesUntilDue = target - metrics.awakeMinutes
  const state = toState(minutesUntilDue)
  return {
    kind: 'sleep',
    state,
    dueAt: new Date(new Date(metrics.awakeSince).getTime() + target * 60_000).toISOString(),
    minutesUntilDue,
    personalTargetMinutes: target,
    sampleCount,
    title: titleFor('sleep', state),
    reason: `Procjena se temelji na medijanu od ${sampleCount} nedavnih budnih razdoblja (${target} min), ne na službenom medicinskom roku.`,
  }
}

function evaluateMeal(metrics: DerivedMetrics): NextEventEstimate {
  const sampleCount = metrics.recentMealIntervals.length
  if (
    !metrics.lastMeal ||
    metrics.lastMealMinutesAgo === null ||
    metrics.usualMealIntervalMinutes === null ||
    sampleCount < MIN_SAMPLES
  ) {
    return {
      kind: 'meal',
      state: 'notEnoughData',
      sampleCount,
      title: 'Još učimo ritam obroka',
      reason: `Zabilježite još ${Math.max(0, MIN_SAMPLES + 1 - (sampleCount + (metrics.lastMeal ? 1 : 0)))} obroka. Hranite prema bebinim znakovima gladi, ne samo prema satu.`,
    }
  }
  const target = metrics.usualMealIntervalMinutes
  const minutesUntilDue = target - metrics.lastMealMinutesAgo
  const state = toState(minutesUntilDue)
  return {
    kind: 'meal',
    state,
    dueAt: new Date(new Date(metrics.lastMeal.at).getTime() + target * 60_000).toISOString(),
    minutesUntilDue,
    personalTargetMinutes: target,
    sampleCount,
    title: titleFor('meal', state),
    reason: `Procjena se temelji na medijanu od ${sampleCount} nedavnih razmaka između obroka (${target} min). Bebini znakovi imaju prednost.`,
  }
}

function toState(minutesUntilDue: number): RhythmState {
  if (minutesUntilDue < -OVERDUE_MINUTES) return 'overdue'
  if (minutesUntilDue <= 0) return 'due'
  if (minutesUntilDue <= APPROACHING_MINUTES) return 'approaching'
  return 'onTrack'
}

function titleFor(kind: 'sleep' | 'meal', state: RhythmState): string {
  const noun = kind === 'sleep' ? 'spavanje' : 'obrok'
  if (state === 'overdue')
    return `${noun === 'spavanje' ? 'Spavanje' : 'Obrok'} je vjerojatno već na redu`
  if (state === 'due') return `Vrijeme je provjeriti treba li ${noun}`
  if (state === 'approaching') return `${noun === 'spavanje' ? 'Spavanje' : 'Obrok'} se približava`
  return `Još nije blizu uobičajenog vremena za ${noun}`
}
