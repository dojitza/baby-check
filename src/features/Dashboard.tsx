import {
  AlertTriangle,
  Baby,
  ChevronRight,
  Clock3,
  HelpCircle,
  History,
  Milk,
  Moon,
  Plus,
  ShieldAlert,
  Sparkles,
  Sun,
} from 'lucide-react'
import { BabyCheckMark } from '../components/Icons'
import { bottleKindLabels } from '../content/hr'
import { evaluateActiveBottles } from '../domain/bottles/evaluateBottleSafety'
import type { BabyProfile, DerivedMetrics } from '../domain/types'
import { formatAge, formatClock, formatDuration } from '../utils/dateTime'

interface DashboardProps {
  profile: BabyProfile
  metrics: DerivedMetrics
  now: Date
  onSleep: () => void
  onBottle: () => void
  onFussy: () => void
  onHistory: () => void
  onUrgentHelp: () => void
}

export function Dashboard({
  profile,
  metrics,
  now,
  onSleep,
  onBottle,
  onFussy,
  onHistory,
  onUrgentHelp,
}: DashboardProps) {
  const activeWarning = evaluateActiveBottles(metrics.activeBottles, profile, now).find(
    ({ result }) => result.state !== 'safe',
  )

  const babyName = profile.nickname || 'Vaša beba'
  const currentDuration = metrics.isSleeping
    ? metrics.currentSleepStartedAt
      ? Math.max(
          0,
          Math.round((now.getTime() - new Date(metrics.currentSleepStartedAt).getTime()) / 60_000),
        )
      : null
    : metrics.awakeMinutes

  return (
    <main className="screen dashboard-screen">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <BabyCheckMark />
          </span>
          <strong>BabyCheck</strong>
        </div>
        <button
          className="status-avatar"
          type="button"
          onClick={onUrgentHelp}
          aria-label="Otvori znakove za hitnu pomoć"
        >
          <ShieldAlert aria-hidden="true" />
        </button>
      </header>

      <section className="greeting">
        <p>
          {new Intl.DateTimeFormat('hr-HR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          }).format(now)}
        </p>
        <h1>Kako je {babyName}?</h1>
        <span>
          <Baby aria-hidden="true" /> {formatAge(metrics.correctedAgeDays)}
          {profile.dueDate ? ' korigirane dobi' : ''}
        </span>
      </section>

      <section className={`state-card${metrics.isSleeping ? ' state-card--sleeping' : ''}`}>
        <div className="state-card__icon">
          {metrics.isSleeping ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
        </div>
        <div className="state-card__body">
          <p>{metrics.isSleeping ? 'TRENUTAČNO SPAVA' : 'TRENUTAČNO JE BUDNA'}</p>
          <strong>{formatDuration(currentDuration)}</strong>
          <span>
            {metrics.isSleeping
              ? metrics.currentSleepStartedAt
                ? `od ${formatClock(metrics.currentSleepStartedAt)}`
                : 'vrijeme početka nije poznato'
              : metrics.awakeSince
                ? `od ${formatClock(metrics.awakeSince)}`
                : 'dodajte prvi zapis spavanja'}
          </span>
        </div>
        <button className="state-card__action" type="button" onClick={onSleep}>
          {metrics.isSleeping ? 'Budna je' : 'Spava'} <ChevronRight aria-hidden="true" />
        </button>
      </section>

      {activeWarning ? (
        <section className={`bottle-alert bottle-alert--${activeWarning.result.state}`}>
          <AlertTriangle aria-hidden="true" />
          <div>
            <strong>Aktivna bočica</strong>
            <span>{activeWarning.result.label}</span>
          </div>
          <button type="button" onClick={onHistory}>
            Detalji
          </button>
        </section>
      ) : null}

      <section className="quick-section">
        <div className="section-heading">
          <div>
            <p>BRZI UNOS</p>
            <h2>Što se upravo dogodilo?</h2>
          </div>
        </div>
        <div className="quick-grid">
          <button className="quick-card quick-card--sleep" type="button" onClick={onSleep}>
            <span>
              <Moon aria-hidden="true" />
            </span>
            <strong>{metrics.isSleeping ? 'Probudi' : 'Spavanje'}</strong>
            <small>{metrics.isSleeping ? 'završi zapis' : 'pokreni ili unesi'}</small>
            <Plus aria-hidden="true" />
          </button>
          <button className="quick-card quick-card--bottle" type="button" onClick={onBottle}>
            <span>
              <Milk aria-hidden="true" />
            </span>
            <strong>Bočica</strong>
            <small>hranjenje ili priprema</small>
            <Plus aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="last-events">
        <div className="section-heading">
          <div>
            <p>DANAS</p>
            <h2>Posljednje</h2>
          </div>
          <button type="button" onClick={onHistory}>
            Sve <History aria-hidden="true" />
          </button>
        </div>
        <div className="event-summary-grid">
          <article>
            <span className="event-icon event-icon--sleep">
              <Clock3 aria-hidden="true" />
            </span>
            <div>
              <small>San u 24 sata</small>
              <strong>{formatDuration(metrics.sleepMinutes24h)}</strong>
              <p>
                {metrics.recentWakeDurations.length >= 5
                  ? 'Osobni obrazac spreman'
                  : `${metrics.recentWakeDurations.length}/5 budnih razdoblja za osobni obrazac`}
              </p>
            </div>
          </article>
          <article>
            <span className="event-icon event-icon--bottle">
              <Milk aria-hidden="true" />
            </span>
            <div>
              <small>Zadnja bočica</small>
              <strong>
                {metrics.lastBottle
                  ? `${metrics.lastBottle.consumedMl ?? metrics.lastBottle.offeredMl} ml`
                  : 'Nije unesena'}
              </strong>
              <p>
                {metrics.lastBottle
                  ? `${bottleKindLabels[metrics.lastBottle.kind]} · prije ${formatDuration(metrics.lastBottleMinutesAgo)}`
                  : 'Dodajte prvi zapis hranjenja'}
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="fussy-callout">
        <div className="fussy-callout__art" aria-hidden="true">
          <Sparkles />
          <HelpCircle />
          <BabyCheckMark />
        </div>
        <div>
          <p>TREBA VAM MIRAN PLAN?</p>
          <h2>Beba je nemirna</h2>
          <span>Prođite najvažnije provjere redom, uz objašnjenje iz vaših zapisa.</span>
        </div>
        <button className="button button--light button--large" type="button" onClick={onFussy}>
          Započni provjeru <ChevronRight aria-hidden="true" />
        </button>
        <small>Ne postavlja dijagnozu · Za hitnu pomoć nazovite 112</small>
      </section>
    </main>
  )
}
