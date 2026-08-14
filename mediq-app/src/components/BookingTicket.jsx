import { useState, useEffect } from 'react';
import { cancelAppointment, getWaitingCount, getAppointmentStatus } from '../hospitalData';
import './BookingTicket.css';

function formatTimestamp(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function BookingTicket({ appointment, doctor, patientsAheadOverride, paymentMethod, upiInfo, onClose }) {
  const [patientsAhead, setPatientsAhead] = useState(patientsAheadOverride ?? 0);
  const [currentlyServing, setCurrentlyServing] = useState(0);
  const [cancelling, setCancelling] = useState(false);
  const [checkedInAt, setCheckedInAt] = useState(appointment?.checked_in_at ?? null);
  const [bookedAt, setBookedAt] = useState(appointment?.booked_at ?? appointment?.created_at ?? null);

  useEffect(() => {
    if (!doctor?.id) return;
    let isMounted = true;

    const refreshQueue = async () => {
      const waiting = await getWaitingCount(doctor.id);
      if (isMounted) {
        setPatientsAhead(waiting);
        const tokenNum = appointment?.queue_number || 1;
        const serving = Math.max(0, tokenNum - waiting);
        setCurrentlyServing(serving);
      }
    };

    refreshQueue();
    const interval = setInterval(refreshQueue, 15000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [doctor, appointment]);

  useEffect(() => {
    if (!appointment?.id) return;
    let isMounted = true;

    const refreshStatus = async () => {
      const status = await getAppointmentStatus(appointment.id);
      if (isMounted && status) {
        setCheckedInAt(status.checked_in_at);
        setBookedAt(status.booked_at);
      }
    };

    refreshStatus();
    const interval = setInterval(refreshStatus, 15000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [appointment]);

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
  const isCheckedIn = !!checkedInAt;

  const timelineSteps = [
    {
      key: 'booked',
      label: 'Booked',
      detail: bookedAt ? `Registered in queue at ${formatTimestamp(bookedAt)}` : 'Registered in queue',
      done: true,
    },
    {
      key: 'checked_in',
      label: 'Checked In',
      detail: isCheckedIn ? `Clinic confirmed your arrival at ${formatTimestamp(checkedInAt)}` : 'Waiting for clinic to confirm your arrival',
      done: isCheckedIn,
    },
    {
      key: 'your_turn',
      label: 'Your Turn',
      detail: isNext ? 'Please head to the consultation room now' : "Enter doctor's chamber for consultation",
      done: isNext,
    },
  ];

  return (
    <div className="ticket-page-wrap">

      <div className="confirmed-banner">
        <span className="confirmed-check">✓</span>
        Token Booked Successfully
      </div>

      <div className="token-dashboard-card">

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
            <span className="specs-label">Ahead of You</span>
            <span className="specs-value accent">{patientsAhead}</span>
          </div>
          <div className="specs-row">
            <span className="specs-label">Estimated Wait</span>
            <span className="specs-value accent">{estimatedWaitMins} mins</span>
          </div>
          <div className="specs-row">
            <span className="specs-label">Payment Status</span>
            <span className="specs-value">
              {paymentMethod === 'upi' ? 'UPI Paid' : 'Cash Pending'}
            </span>
          </div>
        </div>

        <div className="queue-timeline">
          <p className="timeline-title">Queue Timeline</p>
          {timelineSteps.map((step, i) => (
            <div key={step.key} className="timeline-item">
              <div className="timeline-marker-col">
                <span className={`timeline-dot ${step.done ? 'done' : ''}`} />
                {i < timelineSteps.length - 1 && <span className={`timeline-line ${step.done ? 'done' : ''}`} />}
              </div>
              <div className="timeline-content">
                <p className={`timeline-label ${step.done ? 'done' : ''}`}>{step.label}</p>
                <p className="timeline-detail">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="ticket-actions">
          {appointment?.hospital?.google_maps_url && (
            <a
              href={appointment.hospital.google_maps_url}
              target="_blank"
              rel="noreferrer"
              className="ticket-action-btn"
            >
              View on Map
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
