const MINUTE_MS = 60_000
const DAY_MS = 24 * 60 * MINUTE_MS

export function nowIso(): string {
  return new Date().toISOString()
}

export function randomId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

export function differenceInMinutes(later: Date, earlier: Date): number {
  return Math.max(0, Math.round((later.getTime() - earlier.getTime()) / MINUTE_MS))
}

export function ageInDays(date: Date, calendarDate: string): number {
  const [year, month, day] = calendarDate.split('-').map(Number)
  if (!year || !month || !day) return 0

  const birthUtc = Date.UTC(year, month - 1, day)
  const todayUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.max(0, Math.floor((todayUtc - birthUtc) / DAY_MS))
}

export function toDateTimeLocal(iso: string): string {
  const date = new Date(iso)
  const offset = date.getTimezoneOffset() * MINUTE_MS
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function fromDateTimeLocal(value: string): string {
  return new Date(value).toISOString()
}

export function formatClock(iso: string): string {
  return new Intl.DateTimeFormat('hr-HR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('hr-HR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('hr-HR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatDuration(totalMinutes: number | null): string {
  if (totalMinutes === null) return 'Nema podataka'
  if (totalMinutes < 60) return `${totalMinutes} min`

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes ? `${hours} h ${minutes} min` : `${hours} h`
}

export function formatAge(days: number): string {
  if (days < 14) return `${days} ${plural(days, 'dan', 'dana', 'dana')}`
  if (days < 60) {
    const weeks = Math.floor(days / 7)
    return `${weeks} ${plural(weeks, 'tjedan', 'tjedna', 'tjedana')}`
  }
  if (days < 730) {
    const months = Math.floor(days / 30.4375)
    return `${months} ${plural(months, 'mjesec', 'mjeseca', 'mjeseci')}`
  }
  const years = Math.floor(days / 365.25)
  return `${years} ${plural(years, 'godina', 'godine', 'godina')}`
}

export function plural(value: number, one: string, few: string, many: string): string {
  const mod10 = value % 10
  const mod100 = value % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[middle - 1] + sorted[middle]) / 2)
  }
  return sorted[middle]
}
