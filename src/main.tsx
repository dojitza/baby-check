import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { db } from './db/database'
import './styles/global.css'

async function start() {
  const root = createRoot(document.getElementById('root')!)
  try {
    await db.open()
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  } catch {
    root.render(
      <main className="app-loading" role="alert">
        <strong>Lokalna pohrana nije dostupna</strong>
        <span>BabyCheck ne može sigurno spremati podatke u ovom načinu preglednika.</span>
        <button className="button button--primary" type="button" onClick={() => location.reload()}>
          Pokušaj ponovno
        </button>
      </main>,
    )
  }
}

void start()
