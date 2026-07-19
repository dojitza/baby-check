import { Baby, ChevronLeft, ChevronRight, Database, MoonStar, Sparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { BabyCheckMark } from '../components/Icons'
import type { AppSettings, BabyProfile } from '../domain/types'
import { nowIso } from '../utils/dateTime'

interface OnboardingProps {
  onComplete: (profile: BabyProfile, settings: AppSettings) => Promise<void>
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [nickname, setNickname] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [premature, setPremature] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function finish(event: FormEvent) {
    event.preventDefault()
    if (!birthDate || !accepted) return
    const born = new Date(`${birthDate}T12:00:00`)
    const oldest = new Date()
    oldest.setMonth(oldest.getMonth() - 24)
    if (born < oldest) {
      setError('BabyCheck je namijenjen bebama i djeci do 24 mjeseca.')
      return
    }
    if (premature && !dueDate) {
      setError('Unesite očekivani datum poroda za korigiranu dob.')
      return
    }
    setSaving(true)
    const timestamp = nowIso()
    let persistent: AppSettings['persistentStorage'] = 'unknown'
    try {
      try {
        persistent = (await navigator.storage?.persist?.()) ? 'granted' : 'notGranted'
      } catch {
        persistent = 'notGranted'
      }
      await onComplete(
        {
          id: 'primary',
          nickname: nickname.trim(),
          birthDate,
          dueDate: premature ? dueDate : undefined,
          premature,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        {
          id: 'settings',
          onboardingCompleted: true,
          theme: 'system',
          persistentStorage: persistent,
          sleepRemindersEnabled: false,
          mealRemindersEnabled: false,
          notificationPermission:
            typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      )
    } catch {
      setError('Podatke nije moguće spremiti. Provjerite lokalnu pohranu preglednika.')
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
            <p className="eyebrow">SAN I OBROCI, BEZ NAGAĐANJA</p>
            <h1>Upoznajte bebin ritam</h1>
            <p className="onboarding-lead">
              Brzo bilježite san i obroke. BabyCheck zatim pokazuje što bi moglo biti sljedeće.
            </p>
            <div className="feature-list">
              <article>
                <Database aria-hidden="true" />
                <div>
                  <strong>Sve ostaje na uređaju</strong>
                  <span>Bez računa i slanja bebinih zapisa.</span>
                </div>
              </article>
              <article>
                <Sparkles aria-hidden="true" />
                <div>
                  <strong>Procjena iz osobnih zapisa</strong>
                  <span>Vrijeme postaje preciznije nakon najmanje pet razmaka.</span>
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
            <h1>Dob daje kontekst</h1>
            <p className="onboarding-copy">
              Danske smjernice daju širok raspon ukupnog sna u 24 sata. Točan ritam učimo iz zapisa.
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
                  <strong>Rođena prije termina</strong>
                  <small>Koristit ćemo korigiranu dob.</small>
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
            <div className="step-icon">
              <MoonStar aria-hidden="true" />
            </div>
            <p className="eyebrow">KAKO RADI PROCJENA</p>
            <h1>Ritam, ne strogi raspored</h1>
            <div className="feature-list">
              <article>
                <span>
                  <strong>San</strong>
                  <span>
                    Uspoređujemo san u zadnja 24 sata s danskim rasponom i osobnim budnim
                    razdobljima.
                  </span>
                </span>
              </article>
              <article>
                <span>
                  <strong>Obroci</strong>
                  <span>
                    Procjenu gradimo iz nedavnih razmaka. Znakovi gladi uvijek imaju prednost pred
                    satom.
                  </span>
                </span>
              </article>
            </div>
            <label className="check-row check-row--notice">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
              />
              <span>
                <strong>Razumijem ograničenja</strong>
                <small>
                  Procjene nisu medicinski rokovi. Obavijesti frontend PWA-e nisu zajamčene dok je
                  aplikacija zatvorena.
                </small>
              </span>
            </label>
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
