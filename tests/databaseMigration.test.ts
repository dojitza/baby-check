import { describe, expect, it } from 'vitest'
import { legacyBottleToMeal, validateBackup } from '../src/db/database'
import type { LegacyBottleEntry } from '../src/domain/types'

const bottle: LegacyBottleEntry = {
  id: 'b1',
  kind: 'powderFormula',
  status: 'finished',
  storage: 'fresh',
  preparedAt: '2026-07-19T08:55:00.000Z',
  feedingStartedAt: '2026-07-19T09:00:00.000Z',
  finishedAt: '2026-07-19T09:15:00.000Z',
  offeredMl: 120,
  consumedMl: 100,
  guidanceVersion: 'v1',
  createdAt: '2026-07-19T08:55:00.000Z',
  updatedAt: '2026-07-19T09:15:00.000Z',
}

describe('legacy migration', () => {
  it('converts only completed bottles to meals', () => {
    expect(legacyBottleToMeal(bottle)[0]).toMatchObject({
      kind: 'bottle',
      amountMl: 100,
      at: bottle.feedingStartedAt,
    })
    expect(legacyBottleToMeal({ ...bottle, status: 'discarded' })).toEqual([])
  })

  it('upgrades version-one backups', () => {
    const migrated = validateBackup({
      app: 'BabyCheck',
      schemaVersion: 1,
      exportedAt: '2026-07-19T10:00:00.000Z',
      data: {
        profiles: [
          {
            id: 'primary',
            nickname: 'Mila',
            birthDate: '2026-04-01',
            premature: false,
            region: 'hovedstaden',
            bottleKinds: ['powderFormula'],
            createdAt: '2026-04-01T10:00:00.000Z',
            updatedAt: '2026-04-01T10:00:00.000Z',
          },
        ],
        settings: [
          {
            id: 'settings',
            onboardingCompleted: true,
            theme: 'system',
            persistentStorage: 'granted',
            createdAt: '2026-04-01T10:00:00.000Z',
            updatedAt: '2026-04-01T10:00:00.000Z',
          },
        ],
        sleepEntries: [],
        bottleEntries: [bottle],
        fussySessions: [],
      },
    })
    expect(migrated.schemaVersion).toBe(2)
    expect(migrated.data.mealEntries).toHaveLength(1)
    expect(migrated.data.profiles[0]).not.toHaveProperty('region')
  })
})
