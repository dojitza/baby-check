import type { AppSettings, NextEventEstimate, ReminderKind, RhythmSummary } from '../domain/types'

export function notificationSupport(): AppSettings['notificationPermission'] {
  return typeof Notification === 'undefined' || !('serviceWorker' in navigator)
    ? 'unsupported'
    : Notification.permission
}

export async function requestNotificationPermission(): Promise<
  AppSettings['notificationPermission']
> {
  if (notificationSupport() === 'unsupported') return 'unsupported'
  return Notification.requestPermission()
}

export async function showDueReminder(
  estimate: NextEventEstimate,
  settings: AppSettings,
): Promise<string | null> {
  const enabled =
    estimate.kind === 'sleep' ? settings.sleepRemindersEnabled : settings.mealRemindersEnabled
  if (!enabled || settings.notificationPermission !== 'granted') return null
  if (estimate.state !== 'due' && estimate.state !== 'overdue') return null
  const key = reminderKey(estimate)
  const previous =
    estimate.kind === 'sleep' ? settings.lastSleepReminderKey : settings.lastMealReminderKey
  if (!key || previous === key) return null
  const registration = await navigator.serviceWorker.ready
  await registration.showNotification(
    estimate.kind === 'sleep' ? 'Možda je vrijeme za san' : 'Možda je vrijeme za obrok',
    {
      body: estimate.reason,
      icon: '/baby-check/pwa-192x192.png',
      tag: `babycheck-${estimate.kind}`,
      data: { url: '/baby-check/#/today', kind: estimate.kind },
    },
  )
  return key
}

export function reminderKey(estimate: NextEventEstimate): string | null {
  return estimate.dueAt ? `${estimate.kind}:${estimate.dueAt}` : null
}

export async function updateAppBadge(rhythm: RhythmSummary): Promise<void> {
  if (!('setAppBadge' in navigator) || !('clearAppBadge' in navigator)) return
  const due = [rhythm.sleep, rhythm.meal].filter(
    (estimate) => estimate.state === 'due' || estimate.state === 'overdue',
  ).length
  if (due) await navigator.setAppBadge(due)
  else await navigator.clearAppBadge()
}

export function reminderSettingKey(
  kind: ReminderKind,
): 'sleepRemindersEnabled' | 'mealRemindersEnabled' {
  return kind === 'sleep' ? 'sleepRemindersEnabled' : 'mealRemindersEnabled'
}
