import './BookingTicket.css';

export default function BookingTicket({ appointment, doctor, patientsAheadOverride, onClose }) {
  const patientsAhead = patientsAheadOverride ?? 0;
  const estWaitMinutes = patientsAhead * (doctor.avg_minutes_per_patient || 10);

  return (
    <div className="ticket-overlay">
      <div className="ticket-card">
        <div className="ticket-header">
          <span className="ticket-check">✓</span>
          <h2>Booking Confirmed</h2>
        </div>

        <div className="ticket-token">
          <span className="ticket-token-label">Your Token Number</span>
          <span className="ticket-token-number">#{appointment.queue_number}</span>
        </div>

        <div className="ticket-divider" />

        <div className="ticket-rows">
          <div className="ticket-row">
            <span>Doctor</span>
            <strong>{doctor.name}</strong>
          </div>
          <div className="ticket-row">
            <span>Specialty</span>
            <strong>{doctor.specialty}</strong>
          </div>
          <div className="ticket-row">
            <span>Patients ahead of you</span>
            <strong>{patientsAhead}</strong>
          </div>
          <div className="ticket-row highlight">
            <span>Estimated wait</span>
            <strong>{estWaitMinutes} mins</strong>
          </div>
        </div>

        <p className="ticket-note">
          We'll show live updates as your queue moves — no need to keep refreshing.
        </p>

        <button className="ticket-close-btn" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}