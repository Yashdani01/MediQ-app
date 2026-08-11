import './BookingTicket.css';
export default function BookingTicket({ appointment, doctor, patientsAheadOverride, paymentMethod, upiInfo, onClose }) {
  const patientsAhead = patientsAheadOverride ?? 0;
  const estWaitMinutes = patientsAhead * (doctor.avg_minutes_per_patient || 10);
  return (
    <div className="ticket-overlay">
      <div className="ticket-card">
        <div className="ticket-header">
          <span className="ticket-check">Confirmed</span>
          <h2>Booking Confirmed</h2>
        </div>
        <div className="ticket-token">
          <span className="ticket-token-label">Your Token Number</span>
          <span className="ticket-token-number">#{appointment.queue_number}</span>
        </div>
        {appointment.booking_code && (
          <p style={{ textAlign: 'center', fontSize: 13, color: '#666', margin: '4px 0 0' }}>
            Booking ID: <strong>{appointment.booking_code}</strong>
          </p>
        )}
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
          <div className="ticket-row">
            <span>Payment</span>
            <strong>{paymentMethod === 'upi' ? 'UPI (Online)' : 'Cash on visit'}</strong>
          </div>
        </div>
        {paymentMethod === 'upi' && upiInfo?.upiId && (
          <p style={{ textAlign: 'center', fontSize: 13, color: '#4f6ef7', fontWeight: 600, margin: '8px 0 0' }}>
            Paid to: {upiInfo.upiId}
          </p>
        )}
        <p className="ticket-note">
          We'll show live updates as your queue moves — no need to keep refreshing.
        </p>
        <button className="ticket-close-btn" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}
