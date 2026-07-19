import { Milk, Soup, Waves } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Modal } from '../components/Modal'
import { mealKindLabels } from '../content/meals'
import type { MealEntry, MealKind } from '../domain/types'
import { fromDateTimeLocal, nowIso, randomId, toDateTimeLocal } from '../utils/dateTime'

interface MealFormProps {
  entry?: MealEntry
  onSave: (entry: MealEntry) => Promise<void>
  onClose: () => void
}

export function MealForm({ entry, onSave, onClose }: MealFormProps) {
  const [kind, setKind] = useState<MealKind>(entry?.kind ?? 'bottle')
  const [at, setAt] = useState(toDateTimeLocal(entry?.at ?? nowIso()))
  const [amountMl, setAmountMl] = useState(entry?.amountMl?.toString() ?? '')
  const [durationMinutes, setDurationMinutes] = useState(entry?.durationMinutes?.toString() ?? '')
  const [notes, setNotes] = useState(entry?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const maxLocal = useMemo(() => toDateTimeLocal(new Date(Date.now() + 60_000).toISOString()), [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const timestamp = nowIso()
    try {
      await onSave({
        id: entry?.id ?? randomId('meal'),
        kind,
        at: fromDateTimeLocal(at),
        amountMl: amountMl ? Number(amountMl) : undefined,
        durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
        notes: notes.trim() || undefined,
        createdAt: entry?.createdAt ?? timestamp,
        updatedAt: timestamp,
      })
      onClose()
    } catch {
      setError('Obrok nije spremljen. Pokušajte ponovno.')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={entry ? 'Uredi obrok' : 'Zabilježi obrok'}
      description="Vrijeme je obavezno; ostalo dodajte samo ako vam koristi."
      onClose={onClose}
    >
      <form className="form-grid" onSubmit={submit}>
        <fieldset className="choice-fieldset">
          <legend>Vrsta obroka</legend>
          <div className="choice-grid">
            {(['breast', 'bottle', 'solids'] as MealKind[]).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={kind === option}
                className={`choice-card${kind === option ? ' selected' : ''}`}
                onClick={() => setKind(option)}
              >
                {option === 'breast' ? (
                  <Waves aria-hidden="true" />
                ) : option === 'bottle' ? (
                  <Milk aria-hidden="true" />
                ) : (
                  <Soup aria-hidden="true" />
                )}
                <span>{mealKindLabels[option]}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <label className="field">
          <span>Vrijeme obroka</span>
          <input
            type="datetime-local"
            required
            max={maxLocal}
            value={at}
            onChange={(event) => setAt(event.target.value)}
          />
        </label>
        <div className="form-grid form-grid--two">
          {kind === 'bottle' ? (
            <label className="field">
              <span>
                Količina, ml <small>neobavezno</small>
              </span>
              <input
                type="number"
                min="1"
                max="1000"
                step="5"
                value={amountMl}
                onChange={(event) => setAmountMl(event.target.value)}
              />
            </label>
          ) : null}
          {kind === 'breast' ? (
            <label className="field">
              <span>
                Trajanje, min <small>neobavezno</small>
              </span>
              <input
                type="number"
                min="1"
                max="240"
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
              />
            </label>
          ) : null}
        </div>
        <label className="field">
          <span>
            Bilješka <small>neobavezno</small>
          </span>
          <input
            maxLength={500}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="npr. obje strane, kašica…"
          />
        </label>
        <aside className="inline-note">
          Procjena sljedećeg obroka prati osobni ritam. Bebini znakovi gladi uvijek imaju prednost.
        </aside>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <button className="button button--primary button--large" type="submit" disabled={saving}>
          {saving ? 'Spremanje…' : 'Spremi obrok'}
        </button>
      </form>
    </Modal>
  )
}
