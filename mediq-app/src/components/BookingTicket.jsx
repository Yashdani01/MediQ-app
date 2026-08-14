import { useState, useEffect } from 'react';
import { cancelAppointment, getWaitingCount } from '../hospitalData';
import './BookingTicket.css';

export default function BookingTicket({ appointment, doctor, patientsAheadOverride, paymentMethod, upiInfo, onClose }) {
  const [patientsAhead, setPatientsAhead] = useState(patientsAheadOverride ?? 0);
  const [currentlyServing, setCurrentlyServing] = useState(0);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!doctor?.id) return;
    let isMounted = true;

    const refreshQueue = async () => {
      const waiting = await getWaitingCount(doctor.id);
      if (isMounted) {
        setPatientsAhead(waiting);
        // Estimate current serving token
        const tokenNum = appointment?.queue_number || 1;
        const serving = Math.max(0, tokenNum - waiting);
        setCurrentlyServing(serving);
      }
    };

    refreshQueue();
    const interval = setInterval(refreshQueue, 15000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [doctor, appointment]);

  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel this token?')) return;
    setCancelling(true);
    const { error } = await cancelAppointment(appointment.id);
    setCancelling(false);
    if (error) {
      alert('Could not cancel booking. Please try again.');
    } else {
      alert('Your token has been cancelled.');
      if (onClose) onClose();
    }
  };

  const tokenNum = appointment?.queue_number || 1;
  const isNext = patientsAhead === 0 || patientsAhead === 1;
  const avgMins = doctor?.avg_minutes_per_patient || 10;
  const estimatedWaitMins = patientsAhead * avgMins;

  return (
    <div className="ticket-page-wrap">

      {/* Confirmed banner */}
      <div className="confirmed-banner">
        <span className="confirmed-check">✓</span>
        Token Booked Successfully
      </div>

      <div className="token-dashboard-card">

        {/* Dynamic Progress Ring */}
        <div className="token-ring-container">
          <svg className="token-ring-svg" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
            <circle
              cx="50" cy="50" r="42"
              stroke={isNext ? '#10b981' : '#059669'}
              strokeWidth="8"
              strokeDasharray="264"
              strokeDashoffset={Math.max(0, 264 - (264 * (currentlyServing / tokenNum)))}
              strokeLinecap="round"
              fill="none"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>

          <div className="token-number-display">
            <span className="token-number-label">Your Ticket Token</span>
            <div className="token-number-big">#{tokenNum}</div>
            <div className="token-status-tag">
              <span className="token-status-dot" />
              {isNext ? 'Your Turn!' : 'In Queue'}
            </div>
          </div>
        </div>

        {/* Spec rows: doctor, hospital, schedule, live queue */}
        <div className="specs-list">
          <div className="specs-row">
            <span className="specs-label">Doctor</span>
            <span className="specs-value">{doctor?.name || 'Doctor'}</span>
          </div>
          <div className="specs-row">
            <span className="specs-label">Specialty</span>
            <span className="specs-value">{doctor?.specialty || 'General'}</span>
          </div>
          {appointment?.hospital?.name && (
            <div className="specs-row">
              <span className="specs-label">Hospital</span>
              <span className="specs-value">{appointment.hospital.name}</span>
            </div>
          )}
          <div className="specs-divider" />
          <div className="specs-row">
            <span className="specs-label">Currently Serving</span>
            <span className="specs-value accent">#{currentlyServing}</span>
          </div>
          <div className="specs-row">
            <span className="specs-label">Live Queue Position</span>
            <span className="specs-value accent">{patientsAhead} ahead of you</span>
          </div>
          <div className="specs-row">
            <span className="specs-label">Estimated Wait Time</span>
            <span className="specs-value accent">{estimatedWaitMins} mins</span>
          </div>
          <div className="specs-row">
            <span className="specs-label">Payment Status</span>
            <span className="specs-value">
              {paymentMethod === 'upi' ? '🟢 UPI Paid' : '🪙 Cash Pending'}
            </span>
          </div>
        </div>

        {/* Actions: Get Directions & Cancel Token */}
        <div className="ticket-actions">
          {appointment?.hospital?.google_maps_url && (
            
              href={appointment.hospital.google_maps_url}
              target="_blank"
              rel="noreferrer"
              className="ticket-action-btn"
            >
              📍 View on Map
            </a>
          )}

          <button
            onClick={handleCancelBooking}
            disabled={cancelling}
            className="cancel-token-btn"
          >
            {cancelling ? 'Cancelling Token...' : 'Cancel Booking'}
          </button>

          {onClose && (
            <button onClick={onClose} className="ticket-close-link">
              Close
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
