import type { BabyProfile, BottleEntry, DerivedMetrics, SleepEntry } from './types'
import { ageInDays, differenceInMinutes, median } from '../utils/dateTime'

const DAY_MS = 24 * 60 * 60 * 1000
const TWO_WEEKS_MS = 14 * DAY_MS
const MIN_PERSONAL_SAMPLES = 5

export function calculateDerivedMetrics(
  profile: BabyProfile,
  sleepEntries: SleepEntry[],
  bottleEntries: BottleEntry[],
  now = new Date(),
): DerivedMetrics {
  const sortedSleep = [...sleepEntries].sort(
    (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
  )
  const sortedBottles = [...bottleEntries].sort((a, b) => bottleEventTime(b) - bottleEventTime(a))

  const currentSleep = sortedSleep.find((entry) => !entry.endAt)
  const latestEndedSleep = sortedSleep.find((entry) => entry.endAt)
  const awakeSince = currentSleep ? undefined : latestEndedSleep?.endAt
  const awakeMinutes = awakeSince ? differenceInMinutes(now, new Date(awakeSince)) : null

  const recentSleep = sortedSleep.filter(
    (entry) => new Date(entry.startAt).getTime() >= now.getTime() - TWO_WEEKS_MS,
  )
  const wakeDurations = calculateWakeDurations(recentSleep)
  const personalWakeDurations = wakeDurations.slice(0, 20)

  const completedBottles = sortedBottles.filter(
    (entry) => entry.status === 'finished' && entry.feedingStartedAt,
  )
  const recentCompletedBottles = completedBottles.filter(
    (entry) => bottleEventTime(entry) >= now.getTime() - TWO_WEEKS_MS,
  )
  const bottleIntervals = calculateBottleIntervals(recentCompletedBottles)
  const lastBottle = completedBottles[0]
  const lastBottleTime = lastBottle?.feedingStartedAt ?? lastBottle?.finishedAt

  return {
    ageDays: ageInDays(now, profile.birthDate),
    correctedAgeDays: profile.dueDate
      ? ageInDays(now, profile.dueDate)
      : ageInDays(now, profile.birthDate),
    isSleeping: Boolean(currentSleep),
    awakeSince,
    awakeMinutes,
    currentSleepStartedAt: currentSleep?.startAt,
    sleepMinutes24h: calculateSleepMinutesInWindow(sortedSleep, now, DAY_MS),
    recentWakeDurations: personalWakeDurations,
    usualWakeMedianMinutes:
      personalWakeDurations.length >= MIN_PERSONAL_SAMPLES ? median(personalWakeDurations) : null,
    lastBottle,
    lastBottleMinutesAgo: lastBottleTime
      ? differenceInMinutes(now, new Date(lastBottleTime))
      : null,
    recentBottleIntervals: bottleIntervals,
    usualBottleIntervalMinutes:
      bottleIntervals.length >= MIN_PERSONAL_SAMPLES ? median(bottleIntervals) : null,
    recentBottleAmounts: recentCompletedBottles
      .map((entry) => entry.consumedMl ?? entry.offeredMl)
      .filter((amount) => amount > 0)
      .slice(0, 20),
    activeBottles: sortedBottles.filter(
      (entry) => entry.status === 'prepared' || entry.status === 'feeding',
    ),
  }
}

function calculateSleepMinutesInWindow(
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
    if (end <= start) return sum
    return sum + Math.round((end - start) / 60_000)
  }, 0)
}

function calculateWakeDurations(entries: SleepEntry[]): number[] {
  const ascending = [...entries]
    .filter((entry) => entry.endAt)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())

  const durations: number[] = []
  for (let index = 0; index < ascending.length - 1; index += 1) {
    const awakeAt = ascending[index].endAt
    const nextSleepAt = ascending[index + 1].startAt
    if (!awakeAt) continue
    const duration = differenceInMinutes(new Date(nextSleepAt), new Date(awakeAt))
    if (duration > 0 && duration < 12 * 60) durations.push(duration)
  }
  return durations.reverse()
}

function calculateBottleIntervals(entries: BottleEntry[]): number[] {
  const ascending = [...entries].sort((a, b) => bottleEventTime(a) - bottleEventTime(b))
  const intervals: number[] = []
  for (let index = 1; index < ascending.length; index += 1) {
    const interval = Math.round(
      (bottleEventTime(ascending[index]) - bottleEventTime(ascending[index - 1])) / 60_000,
    )
    if (interval > 0 && interval < 24 * 60) intervals.push(interval)
  }
  return intervals.reverse().slice(0, 20)
}

function bottleEventTime(entry: BottleEntry): number {
  return new Date(entry.feedingStartedAt ?? entry.finishedAt ?? entry.preparedAt).getTime()
}
