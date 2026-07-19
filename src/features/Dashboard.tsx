import { Baby, Bell, ChevronRight, Clock3, History, Milk, Moon, Plus, Sun } from 'lucide-react'
import { BabyCheckMark } from '../components/Icons'
import { mealKindLabels } from '../content/meals'
import type { BabyProfile, DerivedMetrics, NextEventEstimate, RhythmSummary } from '../domain/types'
import { formatAge, formatClock, formatDuration } from '../utils/dateTime'

interface DashboardProps {
  profile: BabyProfile
  metrics: DerivedMetrics
  rhythm: RhythmSummary
  now: Date
  onSleep: () => void
  onMeal: () => void
  onHistory: () => void
  onSettings: () => void
}

export function Dashboard({
  profile,
  metrics,
  rhythm,
  now,
  onSleep,
  onMeal,
  onHistory,
  onSettings,
}: DashboardProps) {
  const currentDuration =
    metrics.isSleeping && metrics.currentSleepStartedAt
      ? Math.round((now.getTime() - new Date(metrics.currentSleepStartedAt).getTime()) / 60_000)
      : metrics.awakeMinutes
  const targetMidpoint =
    (rhythm.guidance.recommendedMinMinutes + rhythm.guidance.recommendedMaxMinutes) / 2
  const sleepProgress = Math.min(100, Math.round((metrics.sleepMinutes24h / targetMidpoint) * 100))

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
          onClick={onSettings}
          aria-label="Postavke obavijesti"
        >
          <Bell aria-hidden="true" />
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
        <h1>{profile.nickname || 'Beba'} danas</h1>
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
            {metrics.isSleeping && metrics.currentSleepStartedAt
              ? `od ${formatClock(metrics.currentSleepStartedAt)}`
              : metrics.awakeSince
                ? `od ${formatClock(metrics.awakeSince)}`
                : 'dodajte prvi zapis spavanja'}
          </span>
        </div>
        <button className="state-card__action" type="button" onClick={onSleep}>
          {metrics.isSleeping ? 'Beba se probudila' : 'Beba je zaspala'}{' '}
          <ChevronRight aria-hidden="true" />
        </button>
      </section>

      <section className="rhythm-section">
        <div className="section-heading">
          <div>
            <p>ŠTO JE VJEROJATNO SLJEDEĆE?</p>
            <h2>Osobni ritam</h2>
          </div>
        </div>
        <div className="rhythm-grid">
          <RhythmCard estimate={rhythm.sleep} icon={<Moon />} onAction={onSleep} />
          <RhythmCard estimate={rhythm.meal} icon={<Milk />} onAction={onMeal} />
        </div>
      </section>

      <section className="sleep-guidance-card">
        <div className="sleep-guidance-header">
          <div>
            <small>SAN U ZADNJA 24 SATA</small>
            <strong>{formatDuration(metrics.sleepMinutes24h)}</strong>
          </div>
          <span>{sleepProgress}%</span>
        </div>
        <div className="sleep-progress">
          <i style={{ width: `${sleepProgress}%` }} />
        </div>
        <p>
          Danski opći raspon za ovu dob:{' '}
          <strong>
            {formatDuration(rhythm.guidance.recommendedMinMinutes)}–
            {formatDuration(rhythm.guidance.recommendedMaxMinutes)}
          </strong>
          , uključujući drijemanje. Važan je i dojam odmorenosti.
        </p>
      </section>

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
            <strong>{metrics.isSleeping ? 'Buđenje' : 'Spavanje'}</strong>
            <small>jedan dodir ili ručni unos</small>
            <Plus aria-hidden="true" />
          </button>
          <button className="quick-card quick-card--bottle" type="button" onClick={onMeal}>
            <span>
              <Milk aria-hidden="true" />
            </span>
            <strong>Obrok</strong>
            <small>dojenje, bočica ili kruta hrana</small>
            <Plus aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="last-events">
        <div className="section-heading">
          <div>
            <p>ZADNJI ZAPISI</p>
            <h2>San i obroci</h2>
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
              <small>Budni ritam</small>
              <strong>
                {metrics.usualWakeMedianMinutes
                  ? formatDuration(metrics.usualWakeMedianMinutes)
                  : 'Još učimo'}
              </strong>
              <p>{metrics.recentWakeDurations.length}/5 potrebnih razmaka</p>
            </div>
          </article>
          <article>
            <span className="event-icon event-icon--bottle">
              <Milk aria-hidden="true" />
            </span>
            <div>
              <small>Zadnji obrok</small>
              <strong>
                {metrics.lastMeal ? mealKindLabels[metrics.lastMeal.kind] : 'Nije unesen'}
              </strong>
              <p>
                {metrics.lastMeal
                  ? `prije ${formatDuration(metrics.lastMealMinutesAgo)}${metrics.lastMeal.amountMl ? ` · ${metrics.lastMeal.amountMl} ml` : ''}`
                  : 'Dodajte prvi obrok'}
              </p>
            </div>
          </article>
        </div>
      </section>
      <p className="medical-disclaimer">
        Procjene su pomoć za praćenje, ne medicinski rok ili dijagnoza.
      </p>
    </main>
  )
}

function RhythmCard({
  estimate,
  icon,
  onAction,
}: {
  estimate: NextEventEstimate
  icon: React.ReactNode
  onAction: () => void
}) {
  const countdown =
    estimate.minutesUntilDue === undefined
      ? null
      : estimate.minutesUntilDue > 0
        ? `za ${formatDuration(estimate.minutesUntilDue)}`
        : estimate.minutesUntilDue === 0
          ? 'sada'
          : `kasni ${formatDuration(Math.abs(estimate.minutesUntilDue))}`
  return (
    <article className={`rhythm-card rhythm-card--${estimate.kind} rhythm-card--${estimate.state}`}>
      <span className="rhythm-card__icon">{icon}</span>
      <small>{estimate.kind === 'sleep' ? 'SAN' : 'OBROK'}</small>
      <h3>{estimate.title}</h3>
      {countdown ? <strong>{countdown}</strong> : null}
      <p>{estimate.reason}</p>
      <button type="button" onClick={onAction}>
        {estimate.kind === 'sleep' ? 'Zabilježi san' : 'Zabilježi obrok'}
      </button>
    </article>
  )
}
