import { ChevronLeft, Clock3, Milk, Moon, Pencil, Trash2 } from 'lucide-react'
import { mealKindLabels } from '../content/meals'
import type { MealEntry, SleepEntry } from '../domain/types'
import { differenceInMinutes, formatClock, formatDate, formatDuration } from '../utils/dateTime'

interface HistoryScreenProps {
  sleepEntries: SleepEntry[]
  mealEntries: MealEntry[]
  onBack: () => void
  onDeleteSleep: (id: string) => Promise<void>
  onDeleteMeal: (id: string) => Promise<void>
  onEditSleep: (entry: SleepEntry) => void
  onEditMeal: (entry: MealEntry) => void
}

type Item =
  { type: 'sleep'; at: string; data: SleepEntry } | { type: 'meal'; at: string; data: MealEntry }

export function HistoryScreen({
  sleepEntries,
  mealEntries,
  onBack,
  onDeleteSleep,
  onDeleteMeal,
  onEditSleep,
  onEditMeal,
}: HistoryScreenProps) {
  const items: Item[] = [
    ...sleepEntries.map((data): Item => ({ type: 'sleep', at: data.startAt, data })),
    ...mealEntries.map((data): Item => ({ type: 'meal', at: data.at, data })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  const groups = items.reduce<Record<string, Item[]>>((result, item) => {
    const date = new Date(item.at)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    result[key] = [...(result[key] ?? []), item]
    return result
  }, {})

  return (
    <main className="screen history-screen">
      <header className="page-header">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Natrag">
          <ChevronLeft aria-hidden="true" />
        </button>
        <div>
          <p>SAN I OBROCI</p>
          <h1>Povijest</h1>
        </div>
      </header>
      {items.length === 0 ? (
        <section className="empty-state">
          <Clock3 aria-hidden="true" />
          <h2>Još nema zapisa</h2>
          <p>Spavanje i obroci pojavit će se ovdje.</p>
        </section>
      ) : (
        <div className="timeline-groups">
          {Object.entries(groups).map(([date, group]) => (
            <section key={date} className="timeline-day">
              <h2>{formatDate(`${date}T12:00:00`)}</h2>
              <div className="timeline-list">
                {group.map((item) =>
                  item.type === 'sleep' ? (
                    <SleepRow
                      key={item.data.id}
                      entry={item.data}
                      onEdit={onEditSleep}
                      onDelete={onDeleteSleep}
                    />
                  ) : (
                    <MealRow
                      key={item.data.id}
                      entry={item.data}
                      onEdit={onEditMeal}
                      onDelete={onDeleteMeal}
                    />
                  ),
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}

function SleepRow({
  entry,
  onEdit,
  onDelete,
}: {
  entry: SleepEntry
  onEdit: (entry: SleepEntry) => void
  onDelete: (id: string) => Promise<void>
}) {
  const minutes = entry.endAt
    ? differenceInMinutes(new Date(entry.endAt), new Date(entry.startAt))
    : null
  return (
    <article className="timeline-row">
      <span className="timeline-icon timeline-icon--sleep">
        <Moon aria-hidden="true" />
      </span>
      <div className="timeline-content">
        <small>{formatClock(entry.startAt)}</small>
        <strong>{entry.endAt ? 'Spavanje' : 'Trenutačno spava'}</strong>
        <p>
          {entry.endAt
            ? `${formatClock(entry.startAt)}–${formatClock(entry.endAt)} · ${formatDuration(minutes)}`
            : 'Zapis je otvoren'}
        </p>
      </div>
      <div className="timeline-actions">
        <button type="button" onClick={() => onEdit(entry)} aria-label="Uredi spavanje">
          <Pencil aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => window.confirm('Izbrisati zapis spavanja?') && void onDelete(entry.id)}
          aria-label="Izbriši spavanje"
        >
          <Trash2 aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}

function MealRow({
  entry,
  onEdit,
  onDelete,
}: {
  entry: MealEntry
  onEdit: (entry: MealEntry) => void
  onDelete: (id: string) => Promise<void>
}) {
  return (
    <article className="timeline-row">
      <span className="timeline-icon timeline-icon--bottle">
        <Milk aria-hidden="true" />
      </span>
      <div className="timeline-content">
        <small>{formatClock(entry.at)}</small>
        <strong>{mealKindLabels[entry.kind]}</strong>
        <p>
          {entry.amountMl
            ? `${entry.amountMl} ml`
            : entry.durationMinutes
              ? `${entry.durationMinutes} min`
              : (entry.notes ?? 'Zabilježen obrok')}
        </p>
      </div>
      <div className="timeline-actions">
        <button type="button" onClick={() => onEdit(entry)} aria-label="Uredi obrok">
          <Pencil aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => window.confirm('Izbrisati ovaj obrok?') && void onDelete(entry.id)}
          aria-label="Izbriši obrok"
        >
          <Trash2 aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}
