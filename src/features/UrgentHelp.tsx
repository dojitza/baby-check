import { ExternalLink, Phone, ShieldAlert } from 'lucide-react'
import { Modal } from '../components/Modal'
import { clinicianSigns, regionContacts, urgentSigns } from '../content/sources'
import type { DanishRegion } from '../domain/types'

interface UrgentHelpProps {
  region: DanishRegion
  onClose: () => void
}

export function UrgentHelp({ region, onClose }: UrgentHelpProps) {
  const contact = regionContacts[region]
  return (
    <Modal
      title="Kada odmah tražiti pomoć"
      description="Vjerujte vlastitom osjećaju. Ako ste zabrinuti, nazovite stručnu pomoć."
      onClose={onClose}
      wide
    >
      <section className="urgent-block urgent-block--danger">
        <div className="urgent-block__title">
          <ShieldAlert aria-hidden="true" />
          <h3>Odmah nazovite 112</h3>
        </div>
        <ul>
          {urgentSigns.map((sign) => (
            <li key={sign}>{sign}</li>
          ))}
        </ul>
        <a className="button button--danger button--large" href="tel:112">
          <Phone aria-hidden="true" /> Nazovi 112
        </a>
      </section>

      <section className="urgent-block">
        <h3>Odmah nazovite liječnika ili dežurnu službu</h3>
        <ul>
          {clinicianSigns.map((sign) => (
            <li key={sign}>{sign}</li>
          ))}
        </ul>
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
        <a className="source-link" href={contact.url} target="_blank" rel="noreferrer">
          Provjeri službene informacije <ExternalLink aria-hidden="true" />
        </a>
      </section>
      <p className="medical-disclaimer">
        BabyCheck ne može procijeniti izgleda li beba ozbiljno bolesno. Ovaj popis nije potpun i ne
        zamjenjuje pregled.
      </p>
    </Modal>
  )
}
