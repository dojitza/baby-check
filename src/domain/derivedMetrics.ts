import { ageInDays, differenceInMinutes, median } from '../utils/dateTime'
import type { BabyProfile, DerivedMetrics, MealEntry, SleepEntry } from './types'

const DAY_MS = 24 * 60 * 60 * 1000
const TWO_WEEKS_MS = 14 * DAY_MS
const MIN_PERSONAL_SAMPLES = 5

export function calculateDerivedMetrics(
  profile: BabyProfile,
  sleepEntries: SleepEntry[],
  mealEntries: MealEntry[],
  now = new Date(),
): DerivedMetrics {
  const sortedSleep = [...sleepEntries].sort(
    (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
  )
  const sortedMeals = [...mealEntries].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  )
  const currentSleep = sortedSleep.find((entry) => !entry.endAt)
  const latestEndedSleep = sortedSleep.find((entry) => entry.endAt)
  const awakeSince = currentSleep ? undefined : latestEndedSleep?.endAt
  const awakeMinutes = awakeSince ? differenceInMinutes(now, new Date(awakeSince)) : null

  const recentSleep = sortedSleep.filter(
    (entry) => new Date(entry.startAt).getTime() >= now.getTime() - TWO_WEEKS_MS,
  )
  const wakeDurations = calculateWakeDurations(recentSleep).slice(0, 20)
  const recentMeals = sortedMeals.filter(
    (entry) => new Date(entry.at).getTime() >= now.getTime() - TWO_WEEKS_MS,
  )
  const mealIntervals = calculateMealIntervals(recentMeals)
  const lastMeal = sortedMeals[0]

  return {
    ageDays: ageInDays(now, profile.birthDate),
    correctedAgeDays: ageInDays(now, profile.dueDate ?? profile.birthDate),
    isSleeping: Boolean(currentSleep),
    awakeSince,
    awakeMinutes,
    currentSleepStartedAt: currentSleep?.startAt,
    sleepMinutes24h: calculateSleepMinutesInWindow(sortedSleep, now, DAY_MS),
    recentWakeDurations: wakeDurations,
    usualWakeMedianMinutes:
      wakeDurations.length >= MIN_PERSONAL_SAMPLES ? median(wakeDurations) : null,
    lastSleep: sortedSleep[0],
    lastMeal,
    lastMealMinutesAgo: lastMeal ? differenceInMinutes(now, new Date(lastMeal.at)) : null,
    recentMealIntervals: mealIntervals,
    usualMealIntervalMinutes:
      mealIntervals.length >= MIN_PERSONAL_SAMPLES ? median(mealIntervals) : null,
    meals24h: sortedMeals.filter((entry) => new Date(entry.at).getTime() >= now.getTime() - DAY_MS)
      .length,
  }
}

export function calculateSleepMinutesInWindow(
  sleepEntries: SleepEntry[],
  now: Date,
  windowMs: number,
): number {
  const windowStart = now.getTime() - windowMs
  return sleepEntries.reduce((sum, entry) => {
    const start = Math.max(new Date(entry.startAt).getTime(), windowStart)
    const end = Math.min(
      entry.endAt ? new Date(entry.endAt).getTime() : now.getTime(),
      now.getTime(),
    )
    return end > start ? sum + Math.round((end - start) / 60_000) : sum
  }, 0)
}

function calculateWakeDurations(entries: SleepEntry[]): number[] {
  const ascending = [...entries]
    .filter((entry) => entry.endAt)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  const durations: number[] = []
  for (let index = 0; index < ascending.length - 1; index += 1) {
    const awakeAt = ascending[index].endAt
    if (!awakeAt) continue
    const duration = differenceInMinutes(new Date(ascending[index + 1].startAt), new Date(awakeAt))
    if (duration > 0 && duration < 12 * 60) durations.push(duration)
  }
  return durations.reverse()
}

function calculateMealIntervals(entries: MealEntry[]): number[] {
  const ascending = [...entries].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
  const intervals: number[] = []
  for (let index = 1; index < ascending.length; index += 1) {
    const interval = differenceInMinutes(
      new Date(ascending[index].at),
      new Date(ascending[index - 1].at),
    )
    if (interval > 0 && interval < 24 * 60) intervals.push(interval)
  }
  return intervals.reverse().slice(0, 20)
}
