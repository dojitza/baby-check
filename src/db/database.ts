import Dexie, { type EntityTable } from 'dexie'
import { z } from 'zod'
import type {
  AppSettings,
  BabyProfile,
  BottleEntry,
  FussySession,
  SleepEntry,
} from '../domain/types'
import { nowIso } from '../utils/dateTime'

class BabyCheckDatabase extends Dexie {
  profiles!: EntityTable<BabyProfile, 'id'>
  settings!: EntityTable<AppSettings, 'id'>
  sleepEntries!: EntityTable<SleepEntry, 'id'>
  bottleEntries!: EntityTable<BottleEntry, 'id'>
  fussySessions!: EntityTable<FussySession, 'id'>

  constructor() {
    super('baby-check')
    this.version(1).stores({
      profiles: 'id, birthDate, updatedAt',
      settings: 'id, updatedAt',
      sleepEntries: 'id, startAt, endAt, updatedAt',
      bottleEntries: 'id, kind, status, preparedAt, feedingStartedAt, finishedAt, updatedAt',
      fussySessions: 'id, startedAt, endedAt, resolved',
    })
  }
}

export const db = new BabyCheckDatabase()

export async function ensureDefaultSettings(): Promise<AppSettings> {
  const existing = await db.settings.get('settings')
  if (existing) return existing

  const timestamp = nowIso()
  const settings: AppSettings = {
    id: 'settings',
    onboardingCompleted: false,
    theme: 'system',
    persistentStorage: 'unknown',
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await db.settings.add(settings)
  return settings
}

const profileSchema = z.object({
  id: z.literal('primary'),
  nickname: z.string().max(40),
  birthDate: z.iso.date(),
  dueDate: z.iso.date().optional(),
  premature: z.boolean(),
  region: z.enum(['hovedstaden', 'sjaelland', 'syddanmark', 'midtjylland', 'nordjylland']),
  bottleKinds: z.array(z.enum(['powderFormula', 'readyFormula', 'expressedMilk'])),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

const settingsSchema = z.object({
  id: z.literal('settings'),
  onboardingCompleted: z.boolean(),
  theme: z.enum(['system', 'light', 'dark']),
  persistentStorage: z.enum(['unknown', 'granted', 'notGranted']),
  lastBackupAt: z.iso.datetime().optional(),
  lastGuidanceReviewAcknowledged: z.string().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

const sleepSchema = z.object({
  id: z.string(),
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

const bottleSchema = z.object({
  id: z.string(),
  kind: z.enum(['powderFormula', 'readyFormula', 'expressedMilk']),
  status: z.enum(['prepared', 'feeding', 'finished', 'discarded']),
  storage: z.enum(['fresh', 'fridge', 'roomTemperature']),
  preparedAt: z.iso.datetime(),
  feedingStartedAt: z.iso.datetime().optional(),
  finishedAt: z.iso.datetime().optional(),
  discardedAt: z.iso.datetime().optional(),
  offeredMl: z.number().min(0).max(1000),
  consumedMl: z.number().min(0).max(1000).optional(),
  notes: z.string().max(500).optional(),
  guidanceVersion: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

const fussySessionSchema = z.object({
  id: z.string(),
  startedAt: z.iso.datetime(),
  endedAt: z.iso.datetime().optional(),
  resolved: z.boolean(),
  resolvedBy: z
    .enum([
      'urgent',
      'bottleSafety',
      'tired',
      'hungry',
      'nappy',
      'wind',
      'temperature',
      'contact',
      'stimulation',
      'discomfort',
      'professionalCare',
      'caregiverSafety',
    ])
    .optional(),
  recommendationOrder: z.array(z.string()),
  snapshot: z.object({
    babyAgeDays: z.number(),
    correctedAgeDays: z.number(),
    awakeMinutes: z.number().nullable(),
    lastBottleMinutesAgo: z.number().nullable(),
    lastBottleMl: z.number().nullable(),
    sleepMinutes24h: z.number(),
    activeBottleIds: z.array(z.string()),
  }),
  results: z.array(
    z.object({
      category: z.string(),
      outcome: z.enum(['notIt', 'helped', 'skipped']),
      completedAt: z.iso.datetime(),
    }),
  ),
})

const backupSchema = z.object({
  app: z.literal('BabyCheck'),
  schemaVersion: z.literal(1),
  exportedAt: z.iso.datetime(),
  data: z.object({
    profiles: z.array(profileSchema).max(1),
    settings: z.array(settingsSchema).max(1),
    sleepEntries: z.array(sleepSchema),
    bottleEntries: z.array(bottleSchema),
    fussySessions: z.array(fussySessionSchema),
  }),
})

export type BabyCheckBackup = z.infer<typeof backupSchema>

export async function exportDatabase(): Promise<BabyCheckBackup> {
  return {
    app: 'BabyCheck',
    schemaVersion: 1,
    exportedAt: nowIso(),
    data: {
      profiles: await db.profiles.toArray(),
      settings: await db.settings.toArray(),
      sleepEntries: await db.sleepEntries.toArray(),
      bottleEntries: await db.bottleEntries.toArray(),
      fussySessions: await db.fussySessions.toArray(),
    },
  }
}

export function validateBackup(input: unknown): BabyCheckBackup {
  return backupSchema.parse(input)
}

export async function importDatabase(backup: BabyCheckBackup): Promise<void> {
  await db.transaction(
    'rw',
    [db.profiles, db.settings, db.sleepEntries, db.bottleEntries, db.fussySessions],
    async () => {
      await Promise.all([
        db.profiles.clear(),
        db.settings.clear(),
        db.sleepEntries.clear(),
        db.bottleEntries.clear(),
        db.fussySessions.clear(),
      ])
      await db.profiles.bulkAdd(backup.data.profiles as BabyProfile[])
      await db.settings.bulkAdd(backup.data.settings as AppSettings[])
      await db.sleepEntries.bulkAdd(backup.data.sleepEntries as SleepEntry[])
      await db.bottleEntries.bulkAdd(backup.data.bottleEntries as BottleEntry[])
      await db.fussySessions.bulkAdd(backup.data.fussySessions as FussySession[])
    },
  )
}

export async function clearDatabase(): Promise<void> {
  await db.transaction(
    'rw',
    [db.profiles, db.settings, db.sleepEntries, db.bottleEntries, db.fussySessions],
    async () => {
      await Promise.all([
        db.profiles.clear(),
        db.settings.clear(),
        db.sleepEntries.clear(),
        db.bottleEntries.clear(),
        db.fussySessions.clear(),
      ])
    },
  )
}
