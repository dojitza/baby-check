export type DanishRegion =
  'hovedstaden' | 'sjaelland' | 'syddanmark' | 'midtjylland' | 'nordjylland'

export type ThemePreference = 'system' | 'light' | 'dark'

export type BottleKind = 'powderFormula' | 'readyFormula' | 'expressedMilk'

export type BottleStorage = 'fresh' | 'fridge' | 'roomTemperature'

export type BottleStatus = 'prepared' | 'feeding' | 'finished' | 'discarded'

export interface BabyProfile {
  id: 'primary'
  nickname: string
  birthDate: string
  dueDate?: string
  premature: boolean
  region: DanishRegion
  bottleKinds: BottleKind[]
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

export interface BottleEntry {
  id: string
  kind: BottleKind
  status: BottleStatus
  storage: BottleStorage
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

export type FussyCheckCategory =
  | 'urgent'
  | 'bottleSafety'
  | 'tired'
  | 'hungry'
  | 'nappy'
  | 'wind'
  | 'temperature'
  | 'contact'
  | 'stimulation'
  | 'discomfort'
  | 'professionalCare'
  | 'caregiverSafety'

export type FussyCheckOutcome = 'notIt' | 'helped' | 'skipped'

export interface FussyCheckResult {
  category: FussyCheckCategory
  outcome: FussyCheckOutcome
  completedAt: string
}

export interface FussySessionSnapshot {
  babyAgeDays: number
  correctedAgeDays: number
  awakeMinutes: number | null
  lastBottleMinutesAgo: number | null
  lastBottleMl: number | null
  sleepMinutes24h: number
  activeBottleIds: string[]
}

export interface FussySession {
  id: string
  startedAt: string
  endedAt?: string
  resolved: boolean
  resolvedBy?: FussyCheckCategory
  recommendationOrder: FussyCheckCategory[]
  snapshot: FussySessionSnapshot
  results: FussyCheckResult[]
}

export interface AppSettings {
  id: 'settings'
  onboardingCompleted: boolean
  theme: ThemePreference
  persistentStorage: 'unknown' | 'granted' | 'notGranted'
  lastBackupAt?: string
  lastGuidanceReviewAcknowledged?: string
  createdAt: string
  updatedAt: string
}

export interface SourceReference {
  id: string
  authority: string
  title: string
  url: string
  reviewedAt?: string
  accessedAt: string
  topic: 'crying' | 'formula' | 'sleep' | 'urgentCare' | 'regionalCare'
  note: string
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
  lastBottle?: BottleEntry
  lastBottleMinutesAgo: number | null
  recentBottleIntervals: number[]
  usualBottleIntervalMinutes: number | null
  recentBottleAmounts: number[]
  activeBottles: BottleEntry[]
}

export interface CheckRecommendation {
  category: FussyCheckCategory
  lane: 1 | 2 | 3 | 4 | 5
  score: number
  title: string
  action: string
  reason: string
  sourceIds: string[]
  urgent?: boolean
}
