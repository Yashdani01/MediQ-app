import { useState } from 'react'
import { slots } from '../i18n.js'

export default function Book({ t, selectedDoctor, onConfirm }) {
  const [selectedSlot, setSelectedSlot] = useState(null)

  if (!selectedDoctor) {
    return <p className="page-sub">Pick a doctor from the home screen first.</p>
  }
  const doctor = selectedDoctor

  return (
    <section>
      <h1 className="page-title">{doctor.name}</h1>
      <p className="page-sub">{doctor.specialty} · {doctor.clinic}</p>

      <div className="section-label">{t.lbl_slots}</div>
      <div className="slot-grid">
        {slots.map(slot => (
          <div
            key={slot}
            className={`slot ${selectedSlot === slot ? 'selected' : ''}`}
            onClick={() => setSelectedSlot(slot)}
          >
            {slot}
          </div>
        ))}
      </div>

      <button
        className="primary-btn"
        onClick={() => onConfirm(doctor, selectedSlot || slots[1])}
      >
        {t.btn_confirm}
      </button>
    </section>
  )
}
