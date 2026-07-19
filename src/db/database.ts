import Dexie, { type EntityTable, type Transaction } from 'dexie'
import { z } from 'zod'
import type {
  AppSettings,
  BabyProfile,
  LegacyBottleEntry,
  MealEntry,
  SleepEntry,
} from '../domain/types'
import { nowIso } from '../utils/dateTime'

class BabyCheckDatabase extends Dexie {
  profiles!: EntityTable<BabyProfile, 'id'>
  settings!: EntityTable<AppSettings, 'id'>
  sleepEntries!: EntityTable<SleepEntry, 'id'>
  mealEntries!: EntityTable<MealEntry, 'id'>

  constructor() {
    super('baby-check')
    this.version(1).stores({
      profiles: 'id, birthDate, updatedAt',
      settings: 'id, updatedAt',
      sleepEntries: 'id, startAt, endAt, updatedAt',
      bottleEntries: 'id, kind, status, preparedAt, feedingStartedAt, finishedAt, updatedAt',
      fussySessions: 'id, startedAt, endedAt, resolved',
    })
    this.version(2)
      .stores({
        profiles: 'id, birthDate, updatedAt',
        settings: 'id, updatedAt',
        sleepEntries: 'id, startAt, endAt, updatedAt',
        mealEntries: 'id, kind, at, updatedAt',
        bottleEntries: null,
        fussySessions: null,
      })
      .upgrade(migrateVersionOne)
  }
}

export const db = new BabyCheckDatabase()

function defaultNotificationPermission(): AppSettings['notificationPermission'] {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
}

export function defaultSettings(timestamp = nowIso()): AppSettings {
  return {
    id: 'settings',
    onboardingCompleted: false,
    theme: 'system',
    persistentStorage: 'unknown',
    sleepRemindersEnabled: false,
    mealRemindersEnabled: false,
    notificationPermission: defaultNotificationPermission(),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

async function migrateVersionOne(transaction: Transaction): Promise<void> {
  const profiles = transaction.table('profiles')
  const settingsTable = transaction.table('settings')
  const bottlesTable = transaction.table('bottleEntries')
  const mealsTable = transaction.table('mealEntries')
  const legacyProfile = (await profiles.get('primary')) as Record<string, unknown> | undefined
  if (legacyProfile) {
    const profile = { ...legacyProfile }
    delete profile.region
    delete profile.bottleKinds
    await profiles.put(profile)
  }
  const legacySettings = (await settingsTable.get('settings')) as
    Record<string, unknown> | undefined
  if (legacySettings) {
    await settingsTable.put({
      ...legacySettings,
      sleepRemindersEnabled: false,
      mealRemindersEnabled: false,
      notificationPermission: 'default',
    })
  }
  const bottles = (await bottlesTable.toArray()) as LegacyBottleEntry[]
  const meals = bottles.flatMap(legacyBottleToMeal)
  if (meals.length) await mealsTable.bulkPut(meals)
}

export function legacyBottleToMeal(bottle: LegacyBottleEntry): MealEntry[] {
  if (bottle.status !== 'finished' || !bottle.feedingStartedAt) return []
  return [
    {
      id: `meal-${bottle.id}`,
      kind: 'bottle',
      at: bottle.feedingStartedAt,
      amountMl: bottle.consumedMl ?? bottle.offeredMl,
      notes: bottle.notes,
      createdAt: bottle.createdAt,
      updatedAt: bottle.updatedAt,
    },
  ]
}

const profileSchema = z
  .object({
    id: z.literal('primary'),
    nickname: z.string().max(40),
    birthDate: z.iso.date(),
    dueDate: z.iso.date().optional(),
    premature: z.boolean(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .refine((profile) => !profile.dueDate || profile.premature)

const settingsSchema = z.object({
  id: z.literal('settings'),
  onboardingCompleted: z.boolean(),
  theme: z.enum(['system', 'light', 'dark']),
  persistentStorage: z.enum(['unknown', 'granted', 'notGranted']),
  sleepRemindersEnabled: z.boolean(),
  mealRemindersEnabled: z.boolean(),
  notificationPermission: z.enum(['default', 'denied', 'granted', 'unsupported']),
  lastSleepReminderKey: z.string().optional(),
  lastMealReminderKey: z.string().optional(),
  lastBackupAt: z.iso.datetime().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

const sleepSchema = z
  .object({
    id: z.string().min(1),
    startAt: z.iso.datetime(),
    endAt: z.iso.datetime().optional(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .refine((entry) => !entry.endAt || new Date(entry.endAt) > new Date(entry.startAt))

const mealSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['breast', 'bottle', 'solids']),
  at: z.iso.datetime(),
  amountMl: z.number().positive().max(1000).optional(),
  durationMinutes: z.number().positive().max(240).optional(),
  notes: z.string().max(500).optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

const backupV2Schema = z.object({
  app: z.literal('BabyCheck'),
  schemaVersion: z.literal(2),
  exportedAt: z.iso.datetime(),
  data: z.object({
    profiles: z.array(profileSchema).length(1),
    settings: z.array(settingsSchema).length(1),
    sleepEntries: z.array(sleepSchema),
    mealEntries: z.array(mealSchema),
  }),
})

const legacyBottleSchema = z.object({
  id: z.string(),
  kind: z.enum(['powderFormula', 'readyFormula', 'expressedMilk']),
  status: z.enum(['prepared', 'feeding', 'finished', 'discarded']),
  storage: z.enum(['fresh', 'fridge', 'roomTemperature']),
  preparedAt: z.iso.datetime(),
  feedingStartedAt: z.iso.datetime().optional(),
  finishedAt: z.iso.datetime().optional(),
  discardedAt: z.iso.datetime().optional(),
  offeredMl: z.number(),
  consumedMl: z.number().optional(),
  notes: z.string().optional(),
  guidanceVersion: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

const backupV1Schema = z.object({
  app: z.literal('BabyCheck'),
  schemaVersion: z.literal(1),
  exportedAt: z.iso.datetime(),
  data: z.object({
    profiles: z.array(z.record(z.string(), z.unknown())).length(1),
    settings: z.array(z.record(z.string(), z.unknown())).length(1),
    sleepEntries: z.array(sleepSchema),
    bottleEntries: z.array(legacyBottleSchema),
    fussySessions: z.array(z.unknown()),
  }),
})

export type BabyCheckBackup = z.infer<typeof backupV2Schema>

export async function exportDatabase(): Promise<BabyCheckBackup> {
  return {
    app: 'BabyCheck',
    schemaVersion: 2,
    exportedAt: nowIso(),
    data: {
      profiles: await db.profiles.toArray(),
      settings: await db.settings.toArray(),
      sleepEntries: await db.sleepEntries.toArray(),
      mealEntries: await db.mealEntries.toArray(),
    },
  }
}

export function validateBackup(input: unknown): BabyCheckBackup {
  const version = z.object({ schemaVersion: z.number() }).parse(input).schemaVersion
  if (version === 2) return backupV2Schema.parse(input)
  if (version !== 1) throw new Error('Unsupported BabyCheck backup version')
  const legacy = backupV1Schema.parse(input)
  const timestamp = nowIso()
  const rawProfile = legacy.data.profiles[0]
  const rawSettings = legacy.data.settings[0]
  const profile = profileSchema.parse({
    id: 'primary',
    nickname: typeof rawProfile.nickname === 'string' ? rawProfile.nickname : '',
    birthDate: rawProfile.birthDate,
    dueDate: rawProfile.dueDate,
    premature: Boolean(rawProfile.premature),
    createdAt: rawProfile.createdAt,
    updatedAt: rawProfile.updatedAt,
  })
  const settings = settingsSchema.parse({
    ...defaultSettings(timestamp),
    onboardingCompleted: Boolean(rawSettings.onboardingCompleted),
    theme: rawSettings.theme,
    persistentStorage: rawSettings.persistentStorage,
    createdAt: rawSettings.createdAt,
    updatedAt: rawSettings.updatedAt,
  })
  return backupV2Schema.parse({
    app: 'BabyCheck',
    schemaVersion: 2,
    exportedAt: legacy.exportedAt,
    data: {
      profiles: [profile],
      settings: [settings],
      sleepEntries: legacy.data.sleepEntries,
      mealEntries: legacy.data.bottleEntries.flatMap((entry) =>
        legacyBottleToMeal(entry as LegacyBottleEntry),
      ),
    },
  })
}

export async function importDatabase(backup: BabyCheckBackup): Promise<void> {
  await db.transaction(
    'rw',
    [db.profiles, db.settings, db.sleepEntries, db.mealEntries],
    async () => {
      await Promise.all([
        db.profiles.clear(),
        db.settings.clear(),
        db.sleepEntries.clear(),
        db.mealEntries.clear(),
      ])
      await db.profiles.bulkAdd(backup.data.profiles)
      await db.settings.bulkAdd(backup.data.settings)
      await db.sleepEntries.bulkAdd(backup.data.sleepEntries)
      await db.mealEntries.bulkAdd(backup.data.mealEntries)
    },
  )
}

export async function clearDatabase(): Promise<void> {
  await db.transaction(
    'rw',
    [db.profiles, db.settings, db.sleepEntries, db.mealEntries],
    async () => {
      await Promise.all([
        db.profiles.clear(),
        db.settings.clear(),
        db.sleepEntries.clear(),
        db.mealEntries.clear(),
      ])
    },
  )
}
