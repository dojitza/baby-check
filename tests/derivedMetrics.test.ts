import { describe, expect, it } from 'vitest'
import { calculateDerivedMetrics } from '../src/domain/derivedMetrics'
import type { BabyProfile, BottleEntry, SleepEntry } from '../src/domain/types'

const profile: BabyProfile = {
  id: 'primary',
  nickname: 'Mila',
  birthDate: '2026-04-01',
  premature: false,
  region: 'hovedstaden',
  bottleKinds: ['powderFormula'],
  createdAt: '2026-04-01T10:00:00.000Z',
  updatedAt: '2026-04-01T10:00:00.000Z',
}

function sleep(id: string, startAt: string, endAt?: string): SleepEntry {
  return { id, startAt, endAt, createdAt: startAt, updatedAt: startAt }
}

function bottle(id: string, feedingStartedAt: string, consumedMl: number): BottleEntry {
  return {
    id,
    kind: 'powderFormula',
    status: 'finished',
    storage: 'fresh',
    preparedAt: feedingStartedAt,
    feedingStartedAt,
    finishedAt: feedingStartedAt,
    offeredMl: consumedMl,
    consumedMl,
    guidanceVersion: 'test',
    createdAt: feedingStartedAt,
    updatedAt: feedingStartedAt,
  }
}

describe('calculateDerivedMetrics', () => {
  it('derives awake duration and last bottle without inventing personal baselines', () => {
    const now = new Date('2026-07-18T12:00:00.000Z')
    const result = calculateDerivedMetrics(
      profile,
      [sleep('sleep-1', '2026-07-18T08:00:00.000Z', '2026-07-18T10:00:00.000Z')],
      [bottle('bottle-1', '2026-07-18T09:30:00.000Z', 110)],
      now,
    )

    expect(result.isSleeping).toBe(false)
    expect(result.awakeMinutes).toBe(120)
    expect(result.lastBottleMinutesAgo).toBe(150)
    expect(result.lastBottle?.consumedMl).toBe(110)
    expect(result.usualWakeMedianMinutes).toBeNull()
    expect(result.usualBottleIntervalMinutes).toBeNull()
  })

  it('builds a personal wake baseline only after five completed wake periods', () => {
    const entries = [
      sleep('s1', '2026-07-17T00:00:00.000Z', '2026-07-17T01:00:00.000Z'),
      sleep('s2', '2026-07-17T02:00:00.000Z', '2026-07-17T03:00:00.000Z'),
      sleep('s3', '2026-07-17T04:10:00.000Z', '2026-07-17T05:00:00.000Z'),
      sleep('s4', '2026-07-17T06:20:00.000Z', '2026-07-17T07:00:00.000Z'),
      sleep('s5', '2026-07-17T08:30:00.000Z', '2026-07-17T09:00:00.000Z'),
      sleep('s6', '2026-07-17T10:40:00.000Z', '2026-07-17T11:30:00.000Z'),
    ]
    const result = calculateDerivedMetrics(
      profile,
      entries,
      [],
      new Date('2026-07-17T12:00:00.000Z'),
    )

    expect(result.recentWakeDurations).toEqual([100, 90, 80, 70, 60])
    expect(result.usualWakeMedianMinutes).toBe(80)
  })
})
