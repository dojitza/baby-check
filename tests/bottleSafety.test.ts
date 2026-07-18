import { describe, expect, it } from 'vitest'
import {
  evaluateActiveBottles,
  evaluateBottleSafety,
} from '../src/domain/bottles/evaluateBottleSafety'
import type { BabyProfile, BottleEntry } from '../src/domain/types'

function profile(overrides: Partial<BabyProfile> = {}): BabyProfile {
  return {
    id: 'primary',
    nickname: '',
    birthDate: '2026-01-01',
    premature: false,
    region: 'hovedstaden',
    bottleKinds: ['powderFormula'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function bottle(overrides: Partial<BottleEntry> = {}): BottleEntry {
  return {
    id: 'bottle-1',
    kind: 'powderFormula',
    status: 'prepared',
    storage: 'fridge',
    preparedAt: '2026-07-17T13:00:00.000Z',
    offeredMl: 120,
    guidanceVersion: 'test',
    createdAt: '2026-07-17T13:00:00.000Z',
    updatedAt: '2026-07-17T13:00:00.000Z',
    ...overrides,
  }
}

const now = new Date('2026-07-18T12:00:00.000Z')

describe('evaluateBottleSafety', () => {
  it('requires a fresh bottle for a baby under two months', () => {
    const result = evaluateBottleSafety(
      bottle({ preparedAt: '2026-07-18T11:30:00.000Z' }),
      profile({ birthDate: '2026-06-15' }),
      now,
    )
    expect(result.state).toBe('discard')
    expect(result.recommendation?.lane).toBe(2)
    expect(result.recommendation?.action).toContain('prva dva mjeseca')
  })

  it('allows a newly prepared fresh bottle for a baby under two months to be used now', () => {
    const result = evaluateBottleSafety(
      bottle({
        storage: 'fresh',
        preparedAt: '2026-07-18T11:55:00.000Z',
      }),
      profile({ birthDate: '2026-06-15' }),
      now,
    )
    expect(result.state).toBe('caution')
    expect(result.recommendation?.title).toContain('sada')
  })

  it('requires fresh powdered formula for premature babies regardless of age', () => {
    const result = evaluateBottleSafety(bottle(), profile({ premature: true }), now)
    expect(result.state).toBe('discard')
    expect(result.recommendation?.action).toContain('prerano rođenu')
  })

  it('discards refrigerated prepared formula at 24 hours', () => {
    const result = evaluateBottleSafety(
      bottle({ preparedAt: '2026-07-17T12:00:00.000Z' }),
      profile(),
      now,
    )
    expect(result.state).toBe('discard')
    expect(result.recommendation?.title).toContain('Bacite')
  })

  it('does not invent a universal expressed-milk expiry', () => {
    const result = evaluateBottleSafety(bottle({ kind: 'expressedMilk' }), profile(), now)
    expect(result.state).toBe('needsLabel')
    expect(result.recommendation?.reason).toContain('nismo kodirali')
  })

  it('always tells users to discard leftovers after feeding starts', () => {
    const result = evaluateBottleSafety(
      bottle({ status: 'feeding', feedingStartedAt: '2026-07-18T11:55:00.000Z' }),
      profile(),
      now,
    )
    expect(result.state).toBe('discard')
    expect(result.recommendation?.action).toContain('Bacite sav ostatak')
  })

  it('selects discard warnings ahead of newer label-only warnings', () => {
    const results = evaluateActiveBottles(
      [
        bottle({ id: 'new', kind: 'readyFormula', preparedAt: '2026-07-18T11:55:00.000Z' }),
        bottle({ id: 'expired', preparedAt: '2026-07-17T11:00:00.000Z' }),
      ],
      profile(),
      now,
    )
    expect(results[0].bottle.id).toBe('expired')
    expect(results[0].result.state).toBe('discard')
  })
})
