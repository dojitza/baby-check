import {
  ArrowLeft,
  Check,
  ChevronDown,
  CircleHelp,
  ExternalLink,
  Heart,
  ListChecks,
  Phone,
  ShieldAlert,
  SkipForward,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Modal } from '../components/Modal'
import { outcomeLabels } from '../content/hr'
import { regionContacts, sources } from '../content/sources'
import type {
  BabyProfile,
  CheckRecommendation,
  DerivedMetrics,
  FussyCheckOutcome,
  FussySession,
} from '../domain/types'
import { nowIso, randomId } from '../utils/dateTime'

interface FussyFlowProps {
  profile: BabyProfile
  metrics: DerivedMetrics
  recommendations: CheckRecommendation[]
  onSave: (session: FussySession) => Promise<void>
  onUrgentHelp: () => void
  onClose: () => void
}

export function FussyFlow({
  profile,
  metrics,
  recommendations,
  onSave,
  onUrgentHelp,
  onClose,
}: FussyFlowProps) {
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<FussySession['results']>([])
  const [resolved, setResolved] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const startedAt = useMemo(() => nowIso(), [])
  const current = recommendations[index]
  const contact = regionContacts[profile.region]

  async function record(outcome: FussyCheckOutcome) {
    if (saving) return
    const nextResults = [...results, { category: current.category, outcome, completedAt: nowIso() }]
    if (outcome === 'helped') {
      if (await persist(nextResults, true, current.category)) {
        setResults(nextResults)
        setResolved(true)
        setCompleted(true)
      }
      return
    }
    if (index >= recommendations.length - 1) {
      if (await persist(nextResults, false)) {
        setResults(nextResults)
        setCompleted(true)
      }
      return
    }
    setResults(nextResults)
    setIndex((value) => value + 1)
  }

  async function persist(
    sessionResults: FussySession['results'],
    isResolved: boolean,
    resolvedBy?: FussySession['resolvedBy'],
  ): Promise<boolean> {
    setSaving(true)
    setSaveError('')
    try {
      await onSave({
        id: randomId('fussy'),
        startedAt,
        endedAt: nowIso(),
        resolved: isResolved,
        resolvedBy,
        recommendationOrder: recommendations.map((item) => item.category),
        snapshot: {
          babyAgeDays: metrics.ageDays,
          correctedAgeDays: metrics.correctedAgeDays,
          awakeMinutes: metrics.awakeMinutes,
          lastBottleMinutesAgo: metrics.lastBottleMinutesAgo,
          lastBottleMl: metrics.lastBottle
            ? (metrics.lastBottle.consumedMl ?? metrics.lastBottle.offeredMl)
            : null,
          sleepMinutes24h: metrics.sleepMinutes24h,
          activeBottleIds: metrics.activeBottles.map((bottle) => bottle.id),
        },
        results: sessionResults,
      })
      return true
    } catch {
      setSaveError('Provjera nije spremljena. Podaci nisu izgubljeni — pokušajte ponovno.')
      return false
    } finally {
      setSaving(false)
    }
  }

  if (completed) {
    return (
      <Modal
        title={resolved ? 'Drago nam je da je pomoglo' : 'Prošli ste sve osnovne provjere'}
        onClose={onClose}
        wide
      >
        <div className="session-complete">
          <div className={`completion-icon${resolved ? ' completion-icon--success' : ''}`}>
            {resolved ? <Heart aria-hidden="true" /> : <CircleHelp aria-hidden="true" />}
          </div>
          {resolved ? (
            <>
              <h3>Označeno je što je pomoglo</h3>
              <p>
                To može malo utjecati na poredak budućih provjera tek nakon više ponavljanja. Nije
                dokaz uzroka.
              </p>
            </>
          ) : (
            <>
              <h3>Aplikacija ne može isključiti bol ili bolest</h3>
              <p>
                Ako je plač neobičan, uporan ili beba izgleda bolesno, nazovite liječnika ili
                dežurnu službu.
              </p>
              <div className="contact-card">
                <div>
                  <small>{contact.label}</small>
                  <strong>{contact.displayPhone}</strong>
                  <span>{contact.availability}</span>
                </div>
                <a className="button button--secondary" href={`tel:${contact.phone}`}>
                  <Phone aria-hidden="true" /> Nazovi
                </a>
              </div>
            </>
          )}
          <aside className="caregiver-note">
            <ShieldAlert aria-hidden="true" />
            <div>
              <strong>Osjećate da gubite kontrolu?</strong>
              <span>
                Položite bebu na leđa u siguran krevetić, nakratko se udaljite i nazovite nekoga.
                Nikada ne tresite bebu.
              </span>
            </div>
          </aside>
          <button className="button button--primary button--large" type="button" onClick={onClose}>
            Završi
          </button>
        </div>
      </Modal>
    )
  }

  const sourceItems = current.sourceIds
    .map((id) => sources.find((source) => source.id === id))
    .filter(Boolean)
  return (
    <Modal
      title="Beba je nemirna"
      description="Ne tražimo dijagnozu — samo mirno prolazimo kroz najvažnije provjere."
      onClose={onClose}
      wide
    >
      <div className="fussy-progress">
        <span>
          {index + 1} od {recommendations.length}
        </span>
        <div
          role="progressbar"
          aria-label="Napredak provjere"
          aria-valuemin={1}
          aria-valuemax={recommendations.length}
          aria-valuenow={index + 1}
        >
          <i style={{ width: `${((index + 1) / recommendations.length) * 100}%` }} />
        </div>
        <button type="button" aria-expanded={showAll} onClick={() => setShowAll((value) => !value)}>
          <ListChecks aria-hidden="true" /> Cijeli popis <ChevronDown aria-hidden="true" />
        </button>
      </div>
      {showAll ? (
        <ol className="recommendation-overview">
          {recommendations.map((item, itemIndex) => (
            <li
              key={item.category}
              className={itemIndex === index ? 'active' : itemIndex < index ? 'done' : ''}
            >
              <span>{itemIndex < index ? <Check aria-hidden="true" /> : itemIndex + 1}</span>
              <button
                type="button"
                onClick={() => itemIndex <= index && setIndex(itemIndex)}
                disabled={itemIndex > index}
              >
                {item.title}
              </button>
            </li>
          ))}
        </ol>
      ) : null}
      <article className={`recommendation-card recommendation-card--lane-${current.lane}`}>
        <div className="recommendation-number">{index + 1}</div>
        <p className="eyebrow">PROVJERITE SADA</p>
        <h3>{current.title}</h3>
        <p className="recommendation-action">{current.action}</p>
        <aside className="reason-box">
          <strong>Zašto je ovdje?</strong>
          <span>{current.reason}</span>
        </aside>
        {current.urgent ? (
          <button className="urgent-link" type="button" onClick={onUrgentHelp}>
            <ShieldAlert aria-hidden="true" /> Otvori znakove za hitnu pomoć
          </button>
        ) : null}
        {sourceItems.length ? (
          <div className="source-chips">
            {sourceItems.map((source) =>
              source ? (
                <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
                  {source.authority}
                  <ExternalLink aria-hidden="true" />
                </a>
              ) : null,
            )}
          </div>
        ) : null}
      </article>
      <div className="outcome-actions">
        <button
          className="button button--success button--large"
          type="button"
          onClick={() => record('helped')}
          disabled={saving}
        >
          <Heart aria-hidden="true" /> {outcomeLabels.helped}
        </button>
        <button
          className="button button--secondary"
          type="button"
          onClick={() => record('notIt')}
          disabled={saving}
        >
          <Check aria-hidden="true" /> {outcomeLabels.notIt}
        </button>
        <button
          className="button button--ghost"
          type="button"
          onClick={() => record('skipped')}
          disabled={saving}
        >
          <SkipForward aria-hidden="true" /> {outcomeLabels.skipped}
        </button>
      </div>
      {saveError ? (
        <p className="form-error" role="alert">
          {saveError}
        </p>
      ) : null}
      {index > 0 ? (
        <button className="text-back" type="button" onClick={() => setIndex((value) => value - 1)}>
          <ArrowLeft aria-hidden="true" /> Prethodna provjera
        </button>
      ) : null}
    </Modal>
  )
}
