import { describe, expect, it } from 'vitest'
import { evaluateFussyChecks } from '../src/domain/fussy/evaluateFussyChecks'
import type { BabyProfile, DerivedMetrics, FussySession } from '../src/domain/types'

const profile: BabyProfile = {
  id: 'primary',
  nickname: 'Mila',
  birthDate: '2026-03-01',
  premature: false,
  region: 'hovedstaden',
  bottleKinds: ['powderFormula'],
  createdAt: '2026-03-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
}

const metrics: DerivedMetrics = {
  ageDays: 139,
  correctedAgeDays: 139,
  isSleeping: false,
  awakeSince: '2026-07-18T09:30:00.000Z',
  awakeMinutes: 150,
  sleepMinutes24h: 720,
  recentWakeDurations: [95, 100, 105, 90, 110],
  usualWakeMedianMinutes: 100,
  lastBottleMinutesAgo: 45,
  recentBottleIntervals: [180, 190, 175, 185, 200],
  usualBottleIntervalMinutes: 185,
  recentBottleAmounts: [120, 120, 110, 120, 130],
  activeBottles: [],
}

function helpedSession(category: FussySession['resolvedBy'], index: number): FussySession {
  return {
    id: `session-${index}`,
    startedAt: `2026-07-${String(index + 1).padStart(2, '0')}T10:00:00.000Z`,
    endedAt: `2026-07-${String(index + 1).padStart(2, '0')}T10:05:00.000Z`,
    resolved: true,
    resolvedBy: category,
    recommendationOrder: ['urgent', category!],
    snapshot: {
      babyAgeDays: 130,
      correctedAgeDays: 130,
      awakeMinutes: 100,
      lastBottleMinutesAgo: 60,
      lastBottleMl: 120,
      sleepMinutes24h: 720,
      activeBottleIds: [],
    },
    results: [
      {
        category: category!,
        outcome: 'helped',
        completedAt: `2026-07-${String(index + 1).padStart(2, '0')}T10:05:00.000Z`,
      },
    ],
  }
}

describe('evaluateFussyChecks', () => {
  it('always places urgent review first and professional care near the end', () => {
    const result = evaluateFussyChecks(profile, metrics, [], new Date('2026-07-18T12:00:00.000Z'))
    expect(result[0].category).toBe('urgent')
    expect(result[0].lane).toBe(1)
    expect(result.at(-2)?.category).toBe('professionalCare')
    expect(result.at(-1)?.category).toBe('caregiverSafety')
  })

  it('uses personal wake history to rank tiredness ahead of hunger', () => {
    const result = evaluateFussyChecks(profile, metrics, [], new Date('2026-07-18T12:00:00.000Z'))
    const tired = result.findIndex((item) => item.category === 'tired')
    const hungry = result.findIndex((item) => item.category === 'hungry')
    expect(tired).toBeLessThan(hungry)
    expect(result[tired].reason).toContain('osobni obrazac')
  })

  it('allows bounded outcome learning only after three helped outcomes', () => {
    const sessions = [0, 1, 2].map((index) => helpedSession('nappy', index))
    const result = evaluateFussyChecks(
      profile,
      metrics,
      sessions,
      new Date('2026-07-18T12:00:00.000Z'),
    )
    const nappy = result.find((item) => item.category === 'nappy')
    expect(nappy?.score).toBe(86)
    expect(result[0].category).toBe('urgent')
  })
})
