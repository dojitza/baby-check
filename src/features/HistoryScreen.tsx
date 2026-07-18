import { Baby, CheckCircle2, ChevronLeft, Clock3, Milk, Moon, Pencil, Trash2 } from 'lucide-react'
import { bottleKindLabels } from '../content/hr'
import type { BottleEntry, FussySession, SleepEntry } from '../domain/types'
import { differenceInMinutes, formatClock, formatDate, formatDuration } from '../utils/dateTime'

interface HistoryScreenProps {
  sleepEntries: SleepEntry[]
  bottleEntries: BottleEntry[]
  fussySessions: FussySession[]
  onBack: () => void
  onDeleteSleep: (id: string) => Promise<void>
  onDeleteBottle: (id: string) => Promise<void>
  onEditSleep: (entry: SleepEntry) => void
}

type HistoryItem =
  | { type: 'sleep'; at: string; data: SleepEntry }
  | { type: 'bottle'; at: string; data: BottleEntry }
  | { type: 'fussy'; at: string; data: FussySession }

export function HistoryScreen({
  sleepEntries,
  bottleEntries,
  fussySessions,
  onBack,
  onDeleteSleep,
  onDeleteBottle,
  onEditSleep,
}: HistoryScreenProps) {
  const items: HistoryItem[] = [
    ...sleepEntries.map((data): HistoryItem => ({ type: 'sleep', at: data.startAt, data })),
    ...bottleEntries.map((data): HistoryItem => ({
      type: 'bottle',
      at: data.feedingStartedAt ?? data.preparedAt,
      data,
    })),
    ...fussySessions.map((data): HistoryItem => ({ type: 'fussy', at: data.startedAt, data })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

  const groups = items.reduce<Record<string, HistoryItem[]>>((result, item) => {
    const date = new Date(item.at).toISOString().slice(0, 10)
    result[date] = [...(result[date] ?? []), item]
    return result
  }, {})

  return (
    <main className="screen history-screen">
      <header className="page-header">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Natrag">
          <ChevronLeft aria-hidden="true" />
        </button>
        <div>
          <p>LOKALNI ZAPISI</p>
          <h1>Povijest</h1>
        </div>
      </header>

      {items.length === 0 ? (
        <section className="empty-state">
          <Clock3 aria-hidden="true" />
          <h2>Još nema zapisa</h2>
          <p>Spavanje, bočice i završene provjere pojavit će se ovdje.</p>
        </section>
      ) : (
        <div className="timeline-groups">
          {Object.entries(groups).map(([date, group]) => (
            <section key={date} className="timeline-day">
              <h2>{formatDate(`${date}T12:00:00`)}</h2>
              <div className="timeline-list">
                {group.map((item) => (
                  <HistoryRow
                    key={`${item.type}-${item.data.id}`}
                    item={item}
                    onDeleteSleep={onDeleteSleep}
                    onDeleteBottle={onDeleteBottle}
                    onEditSleep={onEditSleep}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}

function HistoryRow({
  item,
  onDeleteSleep,
  onDeleteBottle,
  onEditSleep,
}: {
  item: HistoryItem
  onDeleteSleep: (id: string) => Promise<void>
  onDeleteBottle: (id: string) => Promise<void>
  onEditSleep: (entry: SleepEntry) => void
}) {
  if (item.type === 'sleep') {
    const minutes = item.data.endAt
      ? differenceInMinutes(new Date(item.data.endAt), new Date(item.data.startAt))
      : null
    return (
      <article className="timeline-row">
        <span className="timeline-icon timeline-icon--sleep">
          <Moon aria-hidden="true" />
        </span>
        <div className="timeline-content">
          <small>{formatClock(item.data.startAt)}</small>
          <strong>{item.data.endAt ? 'Spavanje' : 'Trenutačno spava'}</strong>
          <p>
            {item.data.endAt
              ? `${formatClock(item.data.startAt)}–${formatClock(item.data.endAt)} · ${formatDuration(minutes)}`
              : 'Zapis je još otvoren'}
          </p>
        </div>
        <div className="timeline-actions">
          <button type="button" onClick={() => onEditSleep(item.data)} aria-label="Uredi spavanje">
            <Pencil aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteSleep(item.data.id)}
            aria-label="Izbriši spavanje"
          >
            <Trash2 aria-hidden="true" />
          </button>
        </div>
      </article>
    )
  }
  if (item.type === 'bottle') {
    const amount = item.data.consumedMl ?? item.data.offeredMl
    return (
      <article className="timeline-row">
        <span className="timeline-icon timeline-icon--bottle">
          <Milk aria-hidden="true" />
        </span>
        <div className="timeline-content">
          <small>{formatClock(item.at)}</small>
          <strong>
            {item.data.status === 'prepared' ? 'Pripremljena bočica' : `${amount} ml`}
          </strong>
          <p>
            {bottleKindLabels[item.data.kind]} ·{' '}
            {item.data.status === 'discarded'
              ? 'bačena'
              : item.data.status === 'prepared'
                ? 'čeka hranjenje'
                : 'hranjenje završeno'}
          </p>
        </div>
        <div className="timeline-actions">
          <button
            type="button"
            onClick={() => onDeleteBottle(item.data.id)}
            aria-label="Izbriši bočicu"
          >
            <Trash2 aria-hidden="true" />
          </button>
        </div>
      </article>
    )
  }
  return (
    <article className="timeline-row">
      <span className="timeline-icon timeline-icon--check">
        {item.data.resolved ? <CheckCircle2 aria-hidden="true" /> : <Baby aria-hidden="true" />}
      </span>
      <div className="timeline-content">
        <small>{formatClock(item.data.startedAt)}</small>
        <strong>Provjera nemira</strong>
        <p>
          {item.data.resolved
            ? `Pomoglo: ${item.data.resolvedBy ?? 'zabilježena provjera'}`
            : `${item.data.results.length} provjerenih stavki`}
        </p>
      </div>
    </article>
  )
}
