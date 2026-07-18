import { Moon, Sun } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Modal } from '../components/Modal'
import type { SleepEntry } from '../domain/types'
import { fromDateTimeLocal, nowIso, randomId, toDateTimeLocal } from '../utils/dateTime'

interface SleepFormProps {
  openSleep?: SleepEntry
  existingEntries: SleepEntry[]
  onSave: (entry: SleepEntry) => Promise<void>
  onClose: () => void
}

export function SleepForm({ openSleep, existingEntries, onSave, onClose }: SleepFormProps) {
  const isOngoing = Boolean(openSleep && !openSleep.endAt)
  const isEditingCompleted = Boolean(openSleep?.endAt)
  const current = nowIso()
  const [mode, setMode] = useState<'quick' | 'manual'>(isEditingCompleted ? 'manual' : 'quick')
  const [startAt, setStartAt] = useState(toDateTimeLocal(openSleep?.startAt ?? current))
  const [endAt, setEndAt] = useState(toDateTimeLocal(openSleep?.endAt ?? current))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const title = isEditingCompleted
    ? 'Uredi spavanje'
    : isOngoing
      ? 'Probudi bebu'
      : 'Zabilježi spavanje'
  const description = isEditingCompleted
    ? 'Ispravite vrijeme početka ili buđenja.'
    : isOngoing
      ? 'Završite trenutačno spavanje ili ispravite vrijeme.'
      : 'Pokrenite mjerenje jednim dodirom ili unesite završeno spavanje.'

  const quickLabel = isOngoing ? 'Beba je budna' : 'Beba sada spava'

  const maxLocal = useMemo(() => toDateTimeLocal(new Date(Date.now() + 60_000).toISOString()), [])

  async function saveQuick() {
    setSaving(true)
    setError('')
    const timestamp = nowIso()
    try {
      if (isOngoing && openSleep) {
        await onSave({ ...openSleep, endAt: timestamp, updatedAt: timestamp })
      } else {
        await onSave({
          id: randomId('sleep'),
          startAt: timestamp,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      }
      onClose()
    } catch {
      setError('Spavanje nije spremljeno. Pokušajte ponovno.')
      setSaving(false)
    }
  }

  async function saveManual(event: FormEvent) {
    event.preventDefault()
    const startIso = fromDateTimeLocal(startAt)
    const endIso = fromDateTimeLocal(endAt)
    if (new Date(endIso) <= new Date(startIso)) {
      setError('Vrijeme buđenja mora biti nakon početka spavanja.')
      return
    }
    const overlaps = existingEntries.some((entry) => {
      if (entry.id === openSleep?.id) return false
      const entryEnd = entry.endAt ? new Date(entry.endAt).getTime() : Date.now()
      return (
        new Date(startIso).getTime() < entryEnd &&
        new Date(endIso).getTime() > new Date(entry.startAt).getTime()
      )
    })
    if (overlaps) {
      setError('Ovo vrijeme preklapa se s postojećim zapisom spavanja.')
      return
    }

    setSaving(true)
    setError('')
    const timestamp = nowIso()
    try {
      await onSave({
        id: openSleep?.id ?? randomId('sleep'),
        startAt: startIso,
        endAt: endIso,
        createdAt: openSleep?.createdAt ?? timestamp,
        updatedAt: timestamp,
      })
      onClose()
    } catch {
      setError('Spavanje nije spremljeno. Pokušajte ponovno.')
      setSaving(false)
    }
  }

  return (
    <Modal title={title} description={description} onClose={onClose}>
      {!isEditingCompleted ? (
        <div className="segmented-control" aria-label="Način unosa">
          <button
            type="button"
            className={mode === 'quick' ? 'active' : ''}
            onClick={() => setMode('quick')}
          >
            Brzo
          </button>
          <button
            type="button"
            className={mode === 'manual' ? 'active' : ''}
            onClick={() => setMode('manual')}
          >
            Ručno
          </button>
        </div>
      ) : null}

      {mode === 'quick' ? (
        <div className="quick-action-panel">
          <div className={`quick-action-icon${openSleep ? ' quick-action-icon--sun' : ''}`}>
            {openSleep ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          </div>
          <strong>{quickLabel}</strong>
          <p>Vrijeme će se zabilježiti kao sada. Kasnije ga možete ispraviti u povijesti.</p>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <button
            className="button button--primary button--large"
            type="button"
            onClick={saveQuick}
            disabled={saving}
          >
            {saving ? 'Spremanje…' : quickLabel}
          </button>
        </div>
      ) : (
        <form className="form-grid" onSubmit={saveManual}>
          <label className="field">
            <span>Početak spavanja</span>
            <input
              type="datetime-local"
              required
              max={maxLocal}
              value={startAt}
              onChange={(event) => setStartAt(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Buđenje</span>
            <input
              type="datetime-local"
              required
              max={maxLocal}
              value={endAt}
              onChange={(event) => setEndAt(event.target.value)}
            />
          </label>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <button className="button button--primary button--large" type="submit" disabled={saving}>
            {saving ? 'Spremanje…' : 'Spremi spavanje'}
          </button>
        </form>
      )}
    </Modal>
  )
}
