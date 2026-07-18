import { Baby, Check, ChevronLeft, ChevronRight, Database, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { BabyCheckMark } from '../components/Icons'
import { regionContacts } from '../content/sources'
import type { AppSettings, BabyProfile, BottleKind, DanishRegion } from '../domain/types'
import { nowIso } from '../utils/dateTime'

interface OnboardingProps {
  onComplete: (profile: BabyProfile, settings: AppSettings) => Promise<void>
}

const bottleOptions: Array<{ value: BottleKind; label: string }> = [
  { value: 'powderFormula', label: 'Praškasta formula' },
  { value: 'readyFormula', label: 'Gotova tekuća formula' },
  { value: 'expressedMilk', label: 'Izdojeno mlijeko' },
]

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [nickname, setNickname] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [premature, setPremature] = useState(false)
  const [region, setRegion] = useState<DanishRegion>('hovedstaden')
  const [bottleKinds, setBottleKinds] = useState<BottleKind[]>(['powderFormula'])
  const [accepted, setAccepted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function finish(event: FormEvent) {
    event.preventDefault()
    if (!birthDate || !accepted) return
    const born = new Date(`${birthDate}T12:00:00`)
    const oldestSupported = new Date()
    oldestSupported.setMonth(oldestSupported.getMonth() - 24)
    if (born < oldestSupported) {
      setError('BabyCheck je namijenjen bebama i djeci do 24 mjeseca.')
      return
    }
    if (premature) {
      if (!dueDate) {
        setError('Unesite očekivani datum poroda za korigiranu dob.')
        return
      }
      const due = new Date(`${dueDate}T12:00:00`)
      if (due <= born || due.getTime() - born.getTime() > 17 * 7 * 86_400_000) {
        setError('Očekivani datum mora biti nakon rođenja i unutar 17 tjedana.')
        return
      }
    }

    setSaving(true)
    setError('')
    const timestamp = nowIso()
    let persistent: AppSettings['persistentStorage'] = 'unknown'
    try {
      if (navigator.storage?.persist) {
        try {
          persistent = (await navigator.storage.persist()) ? 'granted' : 'notGranted'
        } catch {
          persistent = 'notGranted'
        }
      }
      await onComplete(
        {
          id: 'primary',
          nickname: nickname.trim(),
          birthDate,
          dueDate: premature ? dueDate : undefined,
          premature,
          region,
          bottleKinds,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        {
          id: 'settings',
          onboardingCompleted: true,
          theme: 'system',
          persistentStorage: persistent,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      )
    } catch {
      setError(
        'Podatke nije bilo moguće spremiti. Provjerite dopušta li preglednik lokalnu pohranu.',
      )
      setSaving(false)
    }
  }

  return (
    <main className="onboarding">
      <div className="onboarding-glow" aria-hidden="true" />
      <div className="onboarding-card">
        <div className="onboarding-progress" aria-label={`Korak ${step + 1} od 3`}>
          {[0, 1, 2].map((item) => (
            <span key={item} className={item <= step ? 'active' : ''} />
          ))}
        </div>

        {step === 0 ? (
          <section className="onboarding-panel onboarding-welcome">
            <div className="brand-mark brand-mark--large">
              <BabyCheckMark />
            </div>
            <p className="eyebrow">MIRAN SLJEDEĆI KORAK</p>
            <h1>Upoznajte BabyCheck</h1>
            <p className="onboarding-lead">
              Brzo zabilježite spavanje i bočice, a kada je beba nemirna provjerite najvažnije
              stvari jednu po jednu.
            </p>
            <div className="feature-list">
              <article>
                <Database aria-hidden="true" />
                <div>
                  <strong>Sve ostaje na ovom uređaju</strong>
                  <span>Bez računa, oglasa i slanja bebinih zapisa.</span>
                </div>
              </article>
              <article>
                <ShieldCheck aria-hidden="true" />
                <div>
                  <strong>Smjernice za Dansku</strong>
                  <span>Uz izvor i datum provjere, bez postavljanja dijagnoze.</span>
                </div>
              </article>
            </div>
            <button
              className="button button--primary button--large"
              type="button"
              onClick={() => setStep(1)}
            >
              Postavi BabyCheck <ChevronRight aria-hidden="true" />
            </button>
          </section>
        ) : null}

        {step === 1 ? (
          <section className="onboarding-panel">
            <button className="text-back" type="button" onClick={() => setStep(0)}>
              <ChevronLeft aria-hidden="true" /> Natrag
            </button>
            <div className="step-icon">
              <Baby aria-hidden="true" />
            </div>
            <p className="eyebrow">O VAŠOJ BEBI</p>
            <h1>Prilagodimo preporuke</h1>
            <p className="onboarding-copy">
              Datum rođenja potreban je za dobno prikladne sigurnosne informacije.
            </p>
            <div className="form-grid">
              <label className="field">
                <span>
                  Nadimak <small>neobavezno</small>
                </span>
                <input
                  value={nickname}
                  maxLength={40}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="npr. Mila"
                  autoComplete="off"
                />
              </label>
              <label className="field">
                <span>Datum rođenja</span>
                <input
                  type="date"
                  required
                  max={new Date().toISOString().slice(0, 10)}
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                />
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={premature}
                  onChange={(event) => {
                    setPremature(event.target.checked)
                    if (!event.target.checked) setDueDate('')
                  }}
                />
                <span>
                  <strong>Rođena je prije termina</strong>
                  <small>Formula i dob računat će se konzervativnije.</small>
                </span>
              </label>
              {premature ? (
                <label className="field">
                  <span>Očekivani datum poroda</span>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                  />
                </label>
              ) : null}
            </div>
            <button
              className="button button--primary button--large"
              type="button"
              disabled={!birthDate}
              onClick={() => setStep(2)}
            >
              Dalje <ChevronRight aria-hidden="true" />
            </button>
          </section>
        ) : null}

        {step === 2 ? (
          <form className="onboarding-panel" onSubmit={finish}>
            <button className="text-back" type="button" onClick={() => setStep(1)}>
              <ChevronLeft aria-hidden="true" /> Natrag
            </button>
            <p className="eyebrow">SMJERNICE I BOČICE</p>
            <h1>Još dvije postavke</h1>
            <div className="form-grid">
              <label className="field">
                <span>Danska regija</span>
                <select
                  value={region}
                  onChange={(event) => setRegion(event.target.value as DanishRegion)}
                >
                  {Object.values(regionContacts).map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.label}
                    </option>
                  ))}
                </select>
                <small>Za točan broj dežurne liječničke službe.</small>
              </label>
              <fieldset className="choice-fieldset">
                <legend>Koje bočice koristite?</legend>
                {bottleOptions.map((option) => {
                  const selected = bottleKinds.includes(option.value)
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      className={`choice-pill${selected ? ' selected' : ''}`}
                      onClick={() =>
                        setBottleKinds((current) =>
                          selected
                            ? current.filter((kind) => kind !== option.value)
                            : [...current, option.value],
                        )
                      }
                    >
                      {selected ? <Check aria-hidden="true" /> : null}
                      {option.label}
                    </button>
                  )
                })}
              </fieldset>
              <label className="check-row check-row--notice">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(event) => setAccepted(event.target.checked)}
                />
                <span>
                  <strong>Razumijem ograničenja</strong>
                  <small>
                    BabyCheck pomaže složiti provjere, ali ne zna uzrok plača i ne zamjenjuje
                    liječnika. Za životnu ugroženost zovem 112.
                  </small>
                </span>
              </label>
            </div>
            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}
            <button
              className="button button--primary button--large"
              type="submit"
              disabled={!accepted || saving}
            >
              {saving ? 'Spremanje…' : 'Započni'} <ChevronRight aria-hidden="true" />
            </button>
          </form>
        ) : null}
      </div>
    </main>
  )
}
