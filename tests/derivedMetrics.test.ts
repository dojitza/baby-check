import { describe, expect, it } from 'vitest'
import { calculateDerivedMetrics } from '../src/domain/derivedMetrics'
import type { BabyProfile, MealEntry, SleepEntry } from '../src/domain/types'

const profile: BabyProfile = {
  id: 'primary',
  nickname: 'Mila',
  birthDate: '2026-04-01',
  premature: false,
  createdAt: '2026-04-01T10:00:00.000Z',
  updatedAt: '2026-04-01T10:00:00.000Z',
}
const sleep = (id: string, startAt: string, endAt?: string): SleepEntry => ({
  id,
  startAt,
  endAt,
  createdAt: startAt,
  updatedAt: startAt,
})
const meal = (id: string, at: string): MealEntry => ({
  id,
  kind: 'bottle',
  at,
  amountMl: 110,
  createdAt: at,
  updatedAt: at,
})

describe('calculateDerivedMetrics', () => {
  it('derives awake duration, rolling sleep and last meal', () => {
    const result = calculateDerivedMetrics(
      profile,
      [sleep('s1', '2026-07-18T08:00:00.000Z', '2026-07-18T10:00:00.000Z')],
      [meal('m1', '2026-07-18T09:30:00.000Z')],
      new Date('2026-07-18T12:00:00.000Z'),
    )
    expect(result.awakeMinutes).toBe(120)
    expect(result.sleepMinutes24h).toBe(120)
    expect(result.lastMealMinutesAgo).toBe(150)
    expect(result.usualMealIntervalMinutes).toBeNull()
  })

  it('learns wake and meal medians after five intervals', () => {
    const sleeps = [
      sleep('s1', '2026-07-17T00:00:00Z', '2026-07-17T01:00:00Z'),
      sleep('s2', '2026-07-17T02:00:00Z', '2026-07-17T03:00:00Z'),
      sleep('s3', '2026-07-17T04:10:00Z', '2026-07-17T05:00:00Z'),
      sleep('s4', '2026-07-17T06:20:00Z', '2026-07-17T07:00:00Z'),
      sleep('s5', '2026-07-17T08:30:00Z', '2026-07-17T09:00:00Z'),
      sleep('s6', '2026-07-17T10:40:00Z', '2026-07-17T11:30:00Z'),
    ]
    const meals = [0, 180, 370, 545, 730, 930].map((minutes, index) =>
      meal(
        `m${index}`,
        new Date(Date.parse('2026-07-17T00:00:00Z') + minutes * 60_000).toISOString(),
      ),
    )
    const result = calculateDerivedMetrics(profile, sleeps, meals, new Date('2026-07-17T12:00:00Z'))
    expect(result.usualWakeMedianMinutes).toBe(80)
    expect(result.usualMealIntervalMinutes).toBe(185)
  })
})
