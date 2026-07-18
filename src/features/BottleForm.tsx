import { Baby, Milk, Refrigerator, TimerReset } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Modal } from '../components/Modal'
import { GUIDANCE_VERSION } from '../content/sources'
import { bottleKindLabels, bottleStorageLabels } from '../content/hr'
import type { BabyProfile, BottleEntry, BottleKind, BottleStorage } from '../domain/types'
import { fromDateTimeLocal, nowIso, randomId, toDateTimeLocal } from '../utils/dateTime'

interface BottleFormProps {
  profile: BabyProfile
  onSave: (entry: BottleEntry) => Promise<void>
  onClose: () => void
}

export function BottleForm({ profile, onSave, onClose }: BottleFormProps) {
  const availableKinds = profile.bottleKinds.length
    ? profile.bottleKinds
    : (['powderFormula'] as BottleKind[])
  const [kind, setKind] = useState<BottleKind>(availableKinds[0])
  const [offeredMl, setOfferedMl] = useState(120)
  const [consumedMl, setConsumedMl] = useState(120)
  const [preparedAt, setPreparedAt] = useState(toDateTimeLocal(nowIso()))
  const [feedingStartedAt, setFeedingStartedAt] = useState(toDateTimeLocal(nowIso()))
  const [storage, setStorage] = useState<BottleStorage>('fresh')
  const [mode, setMode] = useState<'completed' | 'prepared'>('completed')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const maxLocal = useMemo(() => toDateTimeLocal(new Date(Date.now() + 60_000).toISOString()), [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (consumedMl > offeredMl) {
      setError('Popijena količina ne može biti veća od ponuđene.')
      return
    }
    const prepared = fromDateTimeLocal(preparedAt)
    const feeding = mode === 'completed' ? fromDateTimeLocal(feedingStartedAt) : undefined
    if (feeding && new Date(feeding) < new Date(prepared)) {
      setError('Početak hranjenja ne može biti prije pripreme bočice.')
      return
    }

    setSaving(true)
    setError('')
    const timestamp = nowIso()
    try {
      await onSave({
        id: randomId('bottle'),
        kind,
        status: mode === 'completed' ? 'finished' : 'prepared',
        storage: mode === 'prepared' ? storage : 'fresh',
        preparedAt: prepared,
        feedingStartedAt: feeding,
        finishedAt: mode === 'completed' ? timestamp : undefined,
        offeredMl,
        consumedMl: mode === 'completed' ? consumedMl : undefined,
        guidanceVersion: GUIDANCE_VERSION,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      onClose()
    } catch {
      setError('Bočica nije spremljena. Pokušajte ponovno.')
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Zabilježi bočicu"
      description="Spremite završeno hranjenje ili bočicu koju ste upravo pripremili."
      onClose={onClose}
    >
      <div className="segmented-control" aria-label="Vrsta zapisa bočice">
        <button
          type="button"
          className={mode === 'completed' ? 'active' : ''}
          onClick={() => setMode('completed')}
        >
          Hranjenje
        </button>
        <button
          type="button"
          className={mode === 'prepared' ? 'active' : ''}
          onClick={() => setMode('prepared')}
        >
          Pripremljena
        </button>
      </div>
      <form className="form-grid" onSubmit={submit}>
        <fieldset className="choice-fieldset">
          <legend>Vrsta mlijeka</legend>
          <div className="choice-grid">
            {availableKinds.map((option) => (
              <button
                key={option}
                type="button"
                className={`choice-card${kind === option ? ' selected' : ''}`}
                onClick={() => setKind(option)}
              >
                {option === 'powderFormula' ? (
                  <Milk aria-hidden="true" />
                ) : option === 'readyFormula' ? (
                  <Baby aria-hidden="true" />
                ) : (
                  <Refrigerator aria-hidden="true" />
                )}
                <span>{bottleKindLabels[option]}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <div className="form-grid form-grid--two">
          <label className="field">
            <span>Ponuđeno, ml</span>
            <input
              type="number"
              min="0"
              max="1000"
              step="5"
              value={offeredMl}
              onChange={(event) => setOfferedMl(Number(event.target.value))}
            />
          </label>
          {mode === 'completed' ? (
            <label className="field">
              <span>Popijeno, ml</span>
              <input
                type="number"
                min="0"
                max="1000"
                step="5"
                value={consumedMl}
                onChange={(event) => setConsumedMl(Number(event.target.value))}
              />
            </label>
          ) : null}
        </div>
        <label className="field">
          <span>Vrijeme pripreme / otvaranja</span>
          <input
            type="datetime-local"
            required
            max={maxLocal}
            value={preparedAt}
            onChange={(event) => setPreparedAt(event.target.value)}
          />
        </label>
        {mode === 'completed' ? (
          <label className="field">
            <span>Početak hranjenja</span>
            <input
              type="datetime-local"
              required
              max={maxLocal}
              value={feedingStartedAt}
              onChange={(event) => setFeedingStartedAt(event.target.value)}
            />
          </label>
        ) : (
          <fieldset className="choice-fieldset">
            <legend>Kako je spremljena?</legend>
            {(['fresh', 'fridge', 'roomTemperature'] as BottleStorage[]).map((option) => (
              <button
                key={option}
                type="button"
                className={`choice-pill${storage === option ? ' selected' : ''}`}
                onClick={() => setStorage(option)}
              >
                {option === 'fridge' ? (
                  <Refrigerator aria-hidden="true" />
                ) : (
                  <TimerReset aria-hidden="true" />
                )}
                {bottleStorageLabels[option]}
              </button>
            ))}
          </fieldset>
        )}
        {kind === 'powderFormula' ? (
          <aside className="inline-note">
            Prah nije sterilan. Slijedite upute na pakiranju. U prva dva mjeseca i za prerano rođenu
            bebu pripremajte jednu bočicu neposredno prije svakog obroka.
          </aside>
        ) : null}
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <button className="button button--primary button--large" type="submit" disabled={saving}>
          {saving ? 'Spremanje…' : mode === 'completed' ? 'Spremi hranjenje' : 'Spremi bočicu'}
        </button>
      </form>
    </Modal>
  )
}
