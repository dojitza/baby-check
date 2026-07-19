export type ThemePreference = 'system' | 'light' | 'dark'

export interface BabyProfile {
  id: 'primary'
  nickname: string
  birthDate: string
  dueDate?: string
  premature: boolean
  createdAt: string
  updatedAt: string
}

export interface SleepEntry {
  id: string
  startAt: string
  endAt?: string
  createdAt: string
  updatedAt: string
}

export type MealKind = 'breast' | 'bottle' | 'solids'

export interface MealEntry {
  id: string
  kind: MealKind
  at: string
  amountMl?: number
  durationMinutes?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export type ReminderKind = 'sleep' | 'meal'
export type NotificationPermissionState = NotificationPermission | 'unsupported'

export interface AppSettings {
  id: 'settings'
  onboardingCompleted: boolean
  theme: ThemePreference
  persistentStorage: 'unknown' | 'granted' | 'notGranted'
  sleepRemindersEnabled: boolean
  mealRemindersEnabled: boolean
  notificationPermission: NotificationPermissionState
  lastSleepReminderKey?: string
  lastMealReminderKey?: string
  lastBackupAt?: string
  createdAt: string
  updatedAt: string
}

export type RhythmState = 'notEnoughData' | 'onTrack' | 'approaching' | 'due' | 'overdue'

export interface SleepGuidanceBand {
  minAgeDays: number
  maxAgeDays: number
  recommendedMinMinutes: number
  recommendedMaxMinutes: number
  possibleMinMinutes: number
  possibleMaxMinutes: number
  sourceId: string
}

export interface NextEventEstimate {
  kind: ReminderKind
  state: RhythmState
  dueAt?: string
  minutesUntilDue?: number
  personalTargetMinutes?: number
  sampleCount: number
  title: string
  reason: string
}

export interface DerivedMetrics {
  ageDays: number
  correctedAgeDays: number
  isSleeping: boolean
  awakeSince?: string
  awakeMinutes: number | null
  currentSleepStartedAt?: string
  sleepMinutes24h: number
  recentWakeDurations: number[]
  usualWakeMedianMinutes: number | null
  lastSleep?: SleepEntry
  lastMeal?: MealEntry
  lastMealMinutesAgo: number | null
  recentMealIntervals: number[]
  usualMealIntervalMinutes: number | null
  meals24h: number
}

export interface RhythmSummary {
  guidance: SleepGuidanceBand
  sleep: NextEventEstimate
  meal: NextEventEstimate
}

export interface SourceReference {
  id: string
  authority: string
  title: string
  url: string
  reviewedAt?: string
  accessedAt: string
  topic: 'sleep' | 'feeding' | 'notifications'
  note: string
}

// Retained only for schema-v1 IndexedDB and backup migration.
export type LegacyBottleKind = 'powderFormula' | 'readyFormula' | 'expressedMilk'
export type LegacyBottleStorage = 'fresh' | 'fridge' | 'roomTemperature'
export type LegacyBottleStatus = 'prepared' | 'feeding' | 'finished' | 'discarded'

export interface LegacyBottleEntry {
  id: string
  kind: LegacyBottleKind
  status: LegacyBottleStatus
  storage: LegacyBottleStorage
  preparedAt: string
  feedingStartedAt?: string
  finishedAt?: string
  discardedAt?: string
  offeredMl: number
  consumedMl?: number
  notes?: string
  guidanceVersion: string
  createdAt: string
  updatedAt: string
}
