import {
  Bell,
  ChevronLeft,
  Database,
  Download,
  ExternalLink,
  HardDrive,
  Info,
  Moon,
  Smartphone,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { sources } from '../content/sources'
import type { AppSettings, BabyProfile, ReminderKind, ThemePreference } from '../domain/types'
import { formatDateTime } from '../utils/dateTime'

interface Props {
  profile: BabyProfile
  settings: AppSettings
  onBack: () => void
  onTheme: (theme: ThemePreference) => Promise<void>
  onReminder: (kind: ReminderKind, enabled: boolean) => Promise<void>
  onRequestNotifications: () => Promise<void>
  onExport: () => Promise<void>
  onImport: (file: File) => Promise<void>
  onClear: () => Promise<void>
}

export function SettingsScreen({
  profile,
  settings,
  onBack,
  onTheme,
  onReminder,
  onRequestNotifications,
  onExport,
  onImport,
  onClear,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [showSources, setShowSources] = useState(false)

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      if (!window.confirm('Uvoz zamjenjuje sve trenutačne podatke. Nastaviti?')) return
      await onImport(file)
      setMessage('Sigurnosna kopija uspješno je uvezena.')
    } catch {
      setMessage('Datoteka nije valjana BabyCheck sigurnosna kopija.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <main className="screen settings-screen">
      <header className="page-header">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Natrag">
          <ChevronLeft aria-hidden="true" />
        </button>
        <div>
          <p>PRIVATNO I LOKALNO</p>
          <h1>Postavke</h1>
        </div>
      </header>
      <section className="settings-card profile-card">
        <div className="profile-avatar">{profile.nickname?.slice(0, 1).toUpperCase() || 'B'}</div>
        <div>
          <small>Profil bebe</small>
          <strong>{profile.nickname || 'Beba'}</strong>
          <span>
            Rođena{' '}
            {new Intl.DateTimeFormat('hr-HR').format(new Date(`${profile.birthDate}T12:00:00`))}
          </span>
        </div>
      </section>

      <section className="settings-section">
        <h2>Obavijesti</h2>
        <article className="storage-card">
          <Bell aria-hidden="true" />
          <div>
            <strong>{permissionTitle(settings.notificationPermission)}</strong>
            <span>
              Obavijesti se pouzdano prikazuju dok je aplikacija aktivna. Frontend-only PWA ne može
              zajamčeno probuditi zatvorenu aplikaciju.
            </span>
          </div>
        </article>
        {settings.notificationPermission === 'default' ? (
          <button
            className="button button--primary button--large reminder-permission"
            type="button"
            onClick={onRequestNotifications}
          >
            Dopusti obavijesti
          </button>
        ) : null}
        <div className="settings-actions reminder-settings">
          <ReminderToggle
            label="Podsjeti za san"
            checked={settings.sleepRemindersEnabled}
            disabled={settings.notificationPermission !== 'granted'}
            onChange={(value) => onReminder('sleep', value)}
          />
          <ReminderToggle
            label="Podsjeti za obrok"
            checked={settings.mealRemindersEnabled}
            disabled={settings.notificationPermission !== 'granted'}
            onChange={(value) => onReminder('meal', value)}
          />
        </div>
      </section>

      <section className="settings-section">
        <h2>Izgled</h2>
        <div className="theme-picker">
          {(
            [
              ['system', <Smartphone aria-hidden="true" />, 'Sustav'],
              ['light', <Sun aria-hidden="true" />, 'Svijetlo'],
              ['dark', <Moon aria-hidden="true" />, 'Tamno'],
            ] as const
          ).map(([value, icon, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={settings.theme === value}
              className={settings.theme === value ? 'selected' : ''}
              onClick={() => onTheme(value)}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2>Podaci na uređaju</h2>
        <article className="storage-card">
          <HardDrive aria-hidden="true" />
          <div>
            <strong>Lokalna pohrana</strong>
            <span>
              {settings.persistentStorage === 'granted'
                ? 'Preglednik je odobrio trajnu pohranu.'
                : 'Pohrana se može izbrisati; redovito izvezite kopiju.'}
            </span>
          </div>
        </article>
        <div className="settings-actions">
          <button type="button" onClick={onExport}>
            <Download aria-hidden="true" />
            <span>
              <strong>Izvezi sigurnosnu kopiju</strong>
              <small>
                {settings.lastBackupAt
                  ? `Zadnja: ${formatDateTime(settings.lastBackupAt)}`
                  : 'Privatna JSON datoteka'}
              </small>
            </span>
          </button>
          <button type="button" onClick={() => fileRef.current?.click()}>
            <Upload aria-hidden="true" />
            <span>
              <strong>Uvezi sigurnosnu kopiju</strong>
              <small>Podržava BabyCheck verzije 1 i 2</small>
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={importFile}
          />
        </div>
        {message ? (
          <p className="settings-message" role="status">
            {message}
          </p>
        ) : null}
        <p className="privacy-note">
          <Database aria-hidden="true" /> Zapisi ne napuštaju uređaj.
        </p>
      </section>

      <section className="settings-section">
        <h2>Smjernice</h2>
        <button
          className="settings-disclosure"
          type="button"
          aria-expanded={showSources}
          onClick={() => setShowSources((value) => !value)}
        >
          <Info aria-hidden="true" />
          <span>
            <strong>Izvori i ograničenja</strong>
            <small>San u 24 sata + osobni ritam</small>
          </span>
          <ChevronLeft className={showSources ? 'open' : ''} />
        </button>
        {showSources ? (
          <div className="source-list">
            {sources.map((source) => (
              <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
                <span>
                  <strong>{source.title}</strong>
                  <small>{source.authority}</small>
                </span>
                <ExternalLink />
              </a>
            ))}
          </div>
        ) : null}
      </section>
      <section className="settings-section danger-zone">
        <h2>Brisanje</h2>
        <button
          type="button"
          onClick={async () => {
            if (window.confirm('Izbrisati sve zapise sna i obroka?')) await onClear()
          }}
        >
          <Trash2 />
          <span>
            <strong>Izbriši sve podatke</strong>
            <small>Profil, san i obroci</small>
          </span>
        </button>
      </section>
      <footer className="settings-footer">
        <strong>BabyCheck 0.2.0</strong>
        <span>Procjena ritma, ne medicinski raspored</span>
      </footer>
    </main>
  )
}

function ReminderToggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string
  checked: boolean
  disabled: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="settings-toggle">
      <span>
        <strong>{label}</strong>
        <small>
          {disabled ? 'Prvo dopustite obavijesti' : checked ? 'Uključeno' : 'Isključeno'}
        </small>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  )
}

function permissionTitle(permission: AppSettings['notificationPermission']): string {
  if (permission === 'granted') return 'Obavijesti su dopuštene'
  if (permission === 'denied') return 'Obavijesti su blokirane u postavkama uređaja'
  if (permission === 'unsupported') return 'Ovaj preglednik ne podržava obavijesti'
  return 'Obavijesti nisu uključene'
}
