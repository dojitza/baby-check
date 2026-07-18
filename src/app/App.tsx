import { useLiveQuery } from 'dexie-react-hooks'
import { Baby, History, Home, Settings as SettingsIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { db, clearDatabase, exportDatabase, importDatabase, validateBackup } from '../db/database'
import { calculateDerivedMetrics } from '../domain/derivedMetrics'
import { evaluateFussyChecks } from '../domain/fussy/evaluateFussyChecks'
import type { BottleEntry, FussySession, SleepEntry, ThemePreference } from '../domain/types'
import { nowIso } from '../utils/dateTime'
import { BottleForm } from '../features/BottleForm'
import { Dashboard } from '../features/Dashboard'
import { FussyFlow } from '../features/FussyFlow'
import { HistoryScreen } from '../features/HistoryScreen'
import { Onboarding } from '../features/Onboarding'
import { SettingsScreen } from '../features/SettingsScreen'
import { SleepForm } from '../features/SleepForm'
import { UrgentHelp } from '../features/UrgentHelp'

export type Route = 'today' | 'history' | 'settings'
type Overlay = 'sleep' | 'bottle' | 'fussy' | 'urgent' | null

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
  const bottleEntries = useLiveQuery(
    () => db.bottleEntries.orderBy('preparedAt').reverse().toArray(),
    [],
  )
  const fussySessions = useLiveQuery(
    () => db.fussySessions.orderBy('startedAt').reverse().toArray(),
    [],
  )
  const [route, setRoute] = useState<Route>(routeFromHash)
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [urgentOverFussy, setUrgentOverFussy] = useState(false)
  const [editingSleep, setEditingSleep] = useState<SleepEntry | undefined>()
  const [now, setNow] = useState(() => new Date())

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    const onHash = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', onHash)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('hashchange', onHash)
    }
  }, [])

  useEffect(() => {
    if (!settings) return
    const dark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [settings])

  const metrics = useMemo(
    () =>
      profile
        ? calculateDerivedMetrics(profile, sleepEntries ?? [], bottleEntries ?? [], now)
        : null,
    [profile, sleepEntries, bottleEntries, now],
  )
  const recommendations = useMemo(
    () =>
      profile && metrics ? evaluateFussyChecks(profile, metrics, fussySessions ?? [], now) : [],
    [profile, metrics, fussySessions, now],
  )

  const navigate = useCallback((next: Route) => {
    window.location.hash = `/${next}`
    setRoute(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  if (sleepEntries === undefined || bottleEntries === undefined || fussySessions === undefined) {
    return (
      <div className="app-loading">
        <Baby aria-hidden="true" />
        <span>Učitavanje lokalnih podataka…</span>
      </div>
    )
  }

  if (!profile || !settings?.onboardingCompleted) {
    return (
      <Onboarding
        onComplete={async (newProfile, newSettings) => {
          await db.transaction('rw', [db.profiles, db.settings], async () => {
            await db.profiles.put(newProfile)
            await db.settings.put(newSettings)
          })
          const [savedProfile, savedSettings] = await Promise.all([
            db.profiles.get('primary'),
            db.settings.get('settings'),
          ])
          if (!savedProfile || !savedSettings?.onboardingCompleted) {
            throw new Error('Local profile verification failed')
          }
        }}
      />
    )
  }

  if (!metrics) return null

  const openSleep = sleepEntries.find((entry) => !entry.endAt)

  return (
    <div className="app-shell">
      {route === 'today' ? (
        <Dashboard
          profile={profile}
          metrics={metrics}
          now={now}
          onSleep={() => {
            setEditingSleep(openSleep)
            setOverlay('sleep')
          }}
          onBottle={() => setOverlay('bottle')}
          onFussy={() => setOverlay('fussy')}
          onHistory={() => navigate('history')}
          onUrgentHelp={() => setOverlay('urgent')}
        />
      ) : null}

      {route === 'history' ? (
        <HistoryScreen
          sleepEntries={sleepEntries}
          bottleEntries={bottleEntries}
          fussySessions={fussySessions}
          onBack={() => navigate('today')}
          onDeleteSleep={(id) => db.sleepEntries.delete(id)}
          onDeleteBottle={(id) => db.bottleEntries.delete(id)}
          onUpdateBottle={async (entry) => {
            await db.bottleEntries.put(entry)
          }}
          onDeleteFussy={(id) => db.fussySessions.delete(id)}
          onEditSleep={(entry) => {
            setEditingSleep(entry)
            setOverlay('sleep')
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
            window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
            await db.settings.update('settings', { lastBackupAt: nowIso(), updatedAt: nowIso() })
          }}
          onImport={async (file) => {
            const backup = validateBackup(JSON.parse(await file.text()))
            const localPersistence = settings.persistentStorage
            await importDatabase({
              ...backup,
              data: {
                ...backup.data,
                settings: [
                  {
                    ...backup.data.settings[0],
                    persistentStorage: localPersistence,
                    updatedAt: nowIso(),
                  },
                ],
              },
            })
          }}
          onClear={async () => {
            await clearDatabase()
            window.location.hash = ''
            window.location.reload()
          }}
        />
      ) : null}

      <nav className="bottom-nav" aria-label="Glavna navigacija">
        <button
          className={route === 'today' ? 'active' : ''}
          aria-current={route === 'today' ? 'page' : undefined}
          type="button"
          onClick={() => navigate('today')}
        >
          <Home aria-hidden="true" />
          <span>Danas</span>
        </button>
        <button
          className={route === 'history' ? 'active' : ''}
          aria-current={route === 'history' ? 'page' : undefined}
          type="button"
          onClick={() => navigate('history')}
        >
          <History aria-hidden="true" />
          <span>Povijest</span>
        </button>
        <button
          className={route === 'settings' ? 'active' : ''}
          aria-current={route === 'settings' ? 'page' : undefined}
          type="button"
          onClick={() => navigate('settings')}
        >
          <SettingsIcon aria-hidden="true" />
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
      {overlay === 'bottle' ? (
        <BottleForm
          profile={profile}
          onSave={async (entry: BottleEntry) => {
            await db.bottleEntries.put(entry)
          }}
          onClose={() => setOverlay(null)}
        />
      ) : null}
      {overlay === 'fussy' ? (
        <FussyFlow
          profile={profile}
          metrics={metrics}
          recommendations={recommendations}
          onSave={async (session: FussySession) => {
            await db.fussySessions.put(session)
          }}
          onUrgentHelp={() => setUrgentOverFussy(true)}
          onClose={() => {
            setUrgentOverFussy(false)
            setOverlay(null)
          }}
        />
      ) : null}
      {overlay === 'urgent' ? (
        <UrgentHelp region={profile.region} onClose={() => setOverlay(null)} />
      ) : null}
      {urgentOverFussy ? (
        <UrgentHelp region={profile.region} onClose={() => setUrgentOverFussy(false)} />
      ) : null}

      {needRefresh ? (
        <aside className="update-toast" role="status">
          <div>
            <strong>Dostupna je nova verzija</strong>
            <span>Podaci na uređaju ostat će sačuvani.</span>
          </div>
          <button type="button" onClick={() => updateServiceWorker(true)}>
            Ažuriraj
          </button>
        </aside>
      ) : null}
    </div>
  )
}
