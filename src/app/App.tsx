import { useLiveQuery } from 'dexie-react-hooks'
import { Baby, History, Home, Settings as SettingsIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { clearDatabase, db, exportDatabase, importDatabase, validateBackup } from '../db/database'
import { calculateDerivedMetrics } from '../domain/derivedMetrics'
import { evaluateRhythm } from '../domain/rhythm/evaluateRhythm'
import type { MealEntry, ReminderKind, SleepEntry, ThemePreference } from '../domain/types'
import { Dashboard } from '../features/Dashboard'
import { HistoryScreen } from '../features/HistoryScreen'
import { MealForm } from '../features/MealForm'
import { Onboarding } from '../features/Onboarding'
import { SettingsScreen } from '../features/SettingsScreen'
import { SleepForm } from '../features/SleepForm'
import {
  requestNotificationPermission,
  showDueReminder,
  updateAppBadge,
} from '../notifications/reminders'
import { nowIso } from '../utils/dateTime'

export type Route = 'today' | 'history' | 'settings'
type Overlay = 'sleep' | 'meal' | null

function routeFromHash(): Route {
  const value = window.location.hash.replace('#/', '')
  return value === 'history' || value === 'settings' ? value : 'today'
}

export function App() {
  const profile = useLiveQuery(() => db.profiles.get('primary'))
  const settings = useLiveQuery(() => db.settings.get('settings'))
  const sleepEntries = useLiveQuery(
    () => db.sleepEntries.orderBy('startAt').reverse().toArray(),
    [],
  )
  const mealEntries = useLiveQuery(() => db.mealEntries.orderBy('at').reverse().toArray(), [])
  const [route, setRoute] = useState<Route>(routeFromHash)
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [editingSleep, setEditingSleep] = useState<SleepEntry>()
  const [editingMeal, setEditingMeal] = useState<MealEntry>()
  const [now, setNow] = useState(() => new Date())
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    const refresh = () => setNow(new Date())
    const timer = window.setInterval(refresh, 30_000)
    const hash = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', hash)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('hashchange', hash)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])

  useEffect(() => {
    if (!settings) return
    const dark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [settings])

  const metrics = useMemo(
    () =>
      profile ? calculateDerivedMetrics(profile, sleepEntries ?? [], mealEntries ?? [], now) : null,
    [profile, sleepEntries, mealEntries, now],
  )
  const rhythm = useMemo(() => (metrics ? evaluateRhythm(metrics) : null), [metrics])

  useEffect(() => {
    if (!settings || !rhythm) return
    const currentSettings = settings
    const currentRhythm = rhythm
    void updateAppBadge(currentRhythm)
    async function notify() {
      for (const estimate of [currentRhythm.sleep, currentRhythm.meal]) {
        const key = await showDueReminder(estimate, currentSettings)
        if (key)
          await db.settings.update(
            'settings',
            estimate.kind === 'sleep'
              ? { lastSleepReminderKey: key, updatedAt: nowIso() }
              : { lastMealReminderKey: key, updatedAt: nowIso() },
          )
      }
    }
    void notify()
  }, [settings, rhythm])

  const navigate = useCallback((next: Route) => {
    location.hash = `/${next}`
    setRoute(next)
    scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  if (sleepEntries === undefined || mealEntries === undefined)
    return (
      <div className="app-loading">
        <Baby />
        <span>Učitavanje lokalnih podataka…</span>
      </div>
    )
  if (!profile || !settings?.onboardingCompleted)
    return (
      <Onboarding
        onComplete={async (newProfile, newSettings) => {
          await db.transaction('rw', [db.profiles, db.settings], async () => {
            await db.profiles.put(newProfile)
            await db.settings.put(newSettings)
          })
        }}
      />
    )
  if (!metrics || !rhythm) return null
  const openSleep = sleepEntries.find((entry) => !entry.endAt)

  async function updateReminder(kind: ReminderKind, enabled: boolean) {
    await db.settings.update(
      'settings',
      kind === 'sleep'
        ? { sleepRemindersEnabled: enabled, updatedAt: nowIso() }
        : { mealRemindersEnabled: enabled, updatedAt: nowIso() },
    )
  }

  return (
    <div className="app-shell">
      {route === 'today' ? (
        <Dashboard
          profile={profile}
          metrics={metrics}
          rhythm={rhythm}
          now={now}
          onSleep={() => {
            setEditingSleep(openSleep)
            setOverlay('sleep')
          }}
          onMeal={() => {
            setEditingMeal(undefined)
            setOverlay('meal')
          }}
          onHistory={() => navigate('history')}
          onSettings={() => navigate('settings')}
        />
      ) : null}
      {route === 'history' ? (
        <HistoryScreen
          sleepEntries={sleepEntries}
          mealEntries={mealEntries}
          onBack={() => navigate('today')}
          onDeleteSleep={(id) => db.sleepEntries.delete(id)}
          onDeleteMeal={(id) => db.mealEntries.delete(id)}
          onEditSleep={(entry) => {
            setEditingSleep(entry)
            setOverlay('sleep')
          }}
          onEditMeal={(entry) => {
            setEditingMeal(entry)
            setOverlay('meal')
          }}
        />
      ) : null}
      {route === 'settings' ? (
        <SettingsScreen
          profile={profile}
          settings={settings}
          onBack={() => navigate('today')}
          onTheme={async (theme: ThemePreference) => {
            await db.settings.update('settings', { theme, updatedAt: nowIso() })
          }}
          onReminder={updateReminder}
          onRequestNotifications={async () => {
            const permission = await requestNotificationPermission()
            await db.settings.update('settings', {
              notificationPermission: permission,
              updatedAt: nowIso(),
            })
          }}
          onExport={async () => {
            const backup = await exportDatabase()
            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const anchor = document.createElement('a')
            anchor.href = url
            anchor.download = `babycheck-backup-${new Date().toISOString().slice(0, 10)}.json`
            document.body.append(anchor)
            anchor.click()
            anchor.remove()
            setTimeout(() => URL.revokeObjectURL(url), 1000)
            await db.settings.update('settings', { lastBackupAt: nowIso(), updatedAt: nowIso() })
          }}
          onImport={async (file) => {
            const backup = validateBackup(JSON.parse(await file.text()))
            backup.data.settings[0].persistentStorage = settings.persistentStorage
            backup.data.settings[0].notificationPermission = settings.notificationPermission
            await importDatabase(backup)
          }}
          onClear={async () => {
            await clearDatabase()
            location.hash = ''
            location.reload()
          }}
        />
      ) : null}

      <nav className="bottom-nav" aria-label="Glavna navigacija">
        <button
          className={route === 'today' ? 'active' : ''}
          aria-current={route === 'today' ? 'page' : undefined}
          onClick={() => navigate('today')}
        >
          <Home />
          <span>Danas</span>
        </button>
        <button
          className={route === 'history' ? 'active' : ''}
          aria-current={route === 'history' ? 'page' : undefined}
          onClick={() => navigate('history')}
        >
          <History />
          <span>Povijest</span>
        </button>
        <button
          className={route === 'settings' ? 'active' : ''}
          aria-current={route === 'settings' ? 'page' : undefined}
          onClick={() => navigate('settings')}
        >
          <SettingsIcon />
          <span>Postavke</span>
        </button>
      </nav>
      {overlay === 'sleep' ? (
        <SleepForm
          openSleep={editingSleep}
          existingEntries={sleepEntries}
          onSave={async (entry) => {
            await db.sleepEntries.put(entry)
          }}
          onClose={() => {
            setOverlay(null)
            setEditingSleep(undefined)
          }}
        />
      ) : null}
      {overlay === 'meal' ? (
        <MealForm
          entry={editingMeal}
          onSave={async (entry) => {
            await db.mealEntries.put(entry)
          }}
          onClose={() => {
            setOverlay(null)
            setEditingMeal(undefined)
          }}
        />
      ) : null}
      {needRefresh ? (
        <aside className="update-toast" role="status">
          <div>
            <strong>Dostupna je nova verzija</strong>
            <span>Zapisi ostaju sačuvani.</span>
          </div>
          <button onClick={() => updateServiceWorker(true)}>Ažuriraj</button>
        </aside>
      ) : null}
    </div>
  )
}
