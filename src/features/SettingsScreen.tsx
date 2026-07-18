import {
  ArchiveRestore,
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
import { regionContacts, sources } from '../content/sources'
import type { AppSettings, BabyProfile, ThemePreference } from '../domain/types'
import { formatDateTime, nowIso } from '../utils/dateTime'

interface SettingsScreenProps {
  profile: BabyProfile
  settings: AppSettings
  onBack: () => void
  onTheme: (theme: ThemePreference) => Promise<void>
  onExport: () => Promise<void>
  onImport: (file: File) => Promise<void>
  onClear: () => Promise<void>
}

export function SettingsScreen({
  profile,
  settings,
  onBack,
  onTheme,
  onExport,
  onImport,
  onClear,
}: SettingsScreenProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [showSources, setShowSources] = useState(false)
  const contact = regionContacts[profile.region]

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      await onImport(file)
      setMessage('Sigurnosna kopija uspješno je uvezena.')
    } catch {
      setMessage('Datoteka nije valjana BabyCheck sigurnosna kopija.')
    } finally {
      event.target.value = ''
    }
  }

  async function clear() {
    if (
      !window.confirm(
        'Izbrisati sve BabyCheck podatke s ovog uređaja? Ova radnja nema poništavanje.',
      )
    )
      return
    if (!window.confirm('Jeste li sigurni? Preporučujemo prvo izvesti sigurnosnu kopiju.')) return
    await onClear()
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
            {new Intl.DateTimeFormat('hr-HR').format(new Date(`${profile.birthDate}T12:00:00`))} ·{' '}
            {contact.label}
          </span>
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
                : settings.persistentStorage === 'notGranted'
                  ? 'Pohrana može biti izbrisana pod pritiskom prostora.'
                  : 'Status trajne pohrane nije poznat.'}
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
                  : 'JSON datoteka s privatnim podacima'}
              </small>
            </span>
          </button>
          <button type="button" onClick={() => fileRef.current?.click()}>
            <Upload aria-hidden="true" />
            <span>
              <strong>Uvezi sigurnosnu kopiju</strong>
              <small>Zamjenjuje trenutačne podatke nakon provjere</small>
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
          <Database aria-hidden="true" /> BabyCheck ne šalje zapise na poslužitelj. Brisanje
          podataka preglednika ili aplikacije može izbrisati sve zapise.
        </p>
      </section>

      <section className="settings-section">
        <h2>Smjernice i pomoć</h2>
        <button
          className="settings-disclosure"
          type="button"
          onClick={() => setShowSources((value) => !value)}
        >
          <Info aria-hidden="true" />
          <span>
            <strong>Danski službeni izvori</strong>
            <small>Provjereno 18. srpnja 2026.</small>
          </span>
          <ChevronLeft className={showSources ? 'open' : ''} aria-hidden="true" />
        </button>
        {showSources ? (
          <div className="source-list">
            {sources.map((source) => (
              <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
                <span>
                  <strong>{source.title}</strong>
                  <small>
                    {source.authority}
                    {source.reviewedAt ? ` · ${source.reviewedAt}` : ''}
                  </small>
                </span>
                <ExternalLink aria-hidden="true" />
              </a>
            ))}
          </div>
        ) : null}
        <a className="settings-link" href={contact.url} target="_blank" rel="noreferrer">
          <ArchiveRestore aria-hidden="true" />
          <span>
            <strong>Dežurna služba: {contact.displayPhone}</strong>
            <small>{contact.availability}</small>
          </span>
          <ExternalLink aria-hidden="true" />
        </a>
      </section>

      <section className="settings-section danger-zone">
        <h2>Brisanje</h2>
        <button type="button" onClick={clear}>
          <Trash2 aria-hidden="true" />
          <span>
            <strong>Izbriši sve podatke</strong>
            <small>Profil, spavanje, bočice i završene provjere</small>
          </span>
        </button>
      </section>
      <footer className="settings-footer">
        <strong>BabyCheck 0.1.0</strong>
        <span>Ne postavlja dijagnozu · Za životnu ugroženost nazovite 112</span>
        <small>{nowIso().slice(0, 10)}</small>
      </footer>
    </main>
  )
}
