import { useState } from 'react';
import { cancelAppointment } from '../hospitalData';
import './BookingTicket.css';

export default function BookingTicket({ appointment, doctor, patientsAheadOverride, paymentMethod, upiInfo, onClose }) {
  const [cancelling, setCancelling] = useState(false);
  const [isCancelled, setIsCancelled] = useState(appointment?.status === 'cancelled');
  const [error, setError] = useState('');

  const patientsAhead = patientsAheadOverride ?? 0;
  const estWaitMinutes = patientsAhead * (doctor.avg_minutes_per_patient || 10);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this token?')) return;
    
    setCancelling(true);
    setError('');
    const { error: cancelErr } = await cancelAppointment(appointment.id);
    setCancelling(false);

    if (cancelErr) {
      setError('Could not cancel booking. Please try again.');
      return;
    }

    setIsCancelled(true);
  };

  return (
    <div className="ticket-overlay">
      <div className="ticket-card">
        <div className="ticket-header">
          <span className="ticket-check" style={{ background: isCancelled ? '#ef4444' : '#22c55e' }}>
            {isCancelled ? 'Cancelled' : 'Confirmed'}
          </span>
          <h2>{isCancelled ? 'Booking Cancelled' : 'Booking Confirmed'}</h2>
        </div>

        <div className="ticket-token" style={{ opacity: isCancelled ? 0.5 : 1 }}>
          <span className="ticket-token-label">Your Token Number</span>
          <span className="ticket-token-number">#{appointment.queue_number}</span>
        </div>

        {appointment.booking_code && (
          <p style={{ textAlign: 'center', fontSize: 13, color: '#666', margin: '4px 0 0' }}>
            Booking ID: <strong>{appointment.booking_code}</strong>
          </p>
        )}

        <div className="ticket-divider" />

        <div className="ticket-rows" style={{ opacity: isCancelled ? 0.6 : 1 }}>
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
            <strong>{isCancelled ? '—' : patientsAhead}</strong>
          </div>
          <div className="ticket-row highlight">
            <span>Estimated wait</span>
            <strong>{isCancelled ? 'Cancelled' : `${estWaitMinutes} mins`}</strong>
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
          {isCancelled
            ? 'This appointment token has been cancelled.'
            : "We'll show live updates as your queue moves — no need to keep refreshing."}
        </p>

        {error && <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', margin: '6px 0' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button className="ticket-close-btn" onClick={onClose} style={{ flex: 1, margin: 0 }}>
            Done
          </button>

          {!isCancelled && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #fca5a5',
                background: '#fff5f5',
                color: '#ef4444',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Token'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}