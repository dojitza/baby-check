import { describe, expect, it } from 'vitest'
import {
  DANISH_SLEEP_GUIDANCE,
  evaluateRhythm,
  getSleepGuidance,
} from '../src/domain/rhythm/evaluateRhythm'
import type { DerivedMetrics } from '../src/domain/types'

function metrics(overrides: Partial<DerivedMetrics> = {}): DerivedMetrics {
  return {
    ageDays: 100,
    correctedAgeDays: 100,
    isSleeping: false,
    awakeSince: '2026-07-19T10:00:00.000Z',
    awakeMinutes: 80,
    sleepMinutes24h: 850,
    recentWakeDurations: [90, 95, 100, 105, 110],
    usualWakeMedianMinutes: 100,
    lastMeal: {
      id: 'm1',
      kind: 'bottle',
      at: '2026-07-19T09:00:00.000Z',
      amountMl: 120,
      createdAt: '2026-07-19T09:00:00.000Z',
      updatedAt: '2026-07-19T09:00:00.000Z',
    },
    lastMealMinutesAgo: 170,
    recentMealIntervals: [180, 190, 175, 185, 200],
    usualMealIntervalMinutes: 185,
    meals24h: 5,
    ...overrides,
  }
}

describe('Danish sleep guidance', () => {
  it('uses current age boundaries', () => {
    expect(getSleepGuidance(0).recommendedMinMinutes).toBe(14 * 60)
    expect(getSleepGuidance(121).recommendedMaxMinutes).toBe(17 * 60)
    expect(getSleepGuidance(122).recommendedMinMinutes).toBe(12 * 60)
    expect(getSleepGuidance(365).recommendedMinMinutes).toBe(11 * 60)
    expect(DANISH_SLEEP_GUIDANCE).toHaveLength(3)
  })
})

describe('evaluateRhythm', () => {
  it('waits for five personal wake samples', () => {
    const result = evaluateRhythm(
      metrics({ recentWakeDurations: [90, 95, 100, 105], usualWakeMedianMinutes: null }),
    )
    expect(result.sleep.state).toBe('notEnoughData')
  })

  it('marks sleep approaching within twenty minutes', () => {
    const result = evaluateRhythm(metrics())
    expect(result.sleep.state).toBe('approaching')
    expect(result.sleep.minutesUntilDue).toBe(20)
  })

  it('marks a meal overdue from personal intervals', () => {
    const result = evaluateRhythm(metrics({ lastMealMinutesAgo: 220 }))
    expect(result.meal.state).toBe('overdue')
    expect(result.meal.minutesUntilDue).toBe(-35)
  })

  it('does not estimate sleep while the baby is sleeping', () => {
    const result = evaluateRhythm(
      metrics({ isSleeping: true, awakeMinutes: null, awakeSince: undefined }),
    )
    expect(result.sleep.state).toBe('onTrack')
    expect(result.sleep.dueAt).toBeUndefined()
  })
})
