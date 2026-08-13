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
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      <div className="token-dashboard-card">
        
        {/* Live Operational Status Pulse */}
        <div className="token-live-pulse-badge">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          LIVE QUEUE SYNC ACTIVE
        </div>

        {/* Dynamic Progress Ring */}
        <div className="token-ring-container">
          <svg className="token-ring-svg" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" stroke="#e2e8f0" strokeWidth="8" fill="none" />
            <circle
              cx="50" cy="50" r="42"
              stroke={isNext ? '#10b981' : '#0d9488'}
              strokeWidth="8"
              strokeDasharray="264"
              strokeDashoffset={Math.max(0, 264 - (264 * (currentlyServing / tokenNum)))}
              strokeLinecap="round"
              fill="none"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>

          <div className="token-number-display">
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Your Token</span>
            <div className="token-number-big">#{tokenNum}</div>
            {isNext && <div className="token-next-badge">🎉 You're Next!</div>}
          </div>
        </div>

        {/* Real-Time Queue Metrics */}
        <div className="queue-metrics-grid">
          <div className="metric-box">
            <div className="metric-box-label">Currently Serving</div>
            <div className="metric-box-value">#{currentlyServing}</div>
          </div>
          <div className="metric-box">
            <div className="metric-box-label">Patients Ahead</div>
            <div className="metric-box-value">{patientsAhead}</div>
          </div>
          <div className="metric-box">
            <div className="metric-box-label">Estimated Wait</div>
            <div className="metric-box-value">{estimatedWaitMins} min</div>
          </div>
          <div className="metric-box">
            <div className="metric-box-label">Payment Status</div>
            <div className="metric-box-value" style={{ fontSize: 13, color: paymentMethod === 'upi' ? '#047857' : '#b45309' }}>
              {paymentMethod === 'upi' ? '🟢 UPI Paid' : '🪙 Cash Pending'}
            </div>
          </div>
        </div>

        {/* Doctor & Clinic Info Card */}
        <div style={{ background: '#f8fafc', borderRadius: 16, padding: 14, border: '1px solid #e2e8f0', textAlign: 'left', marginBottom: 16 }}>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{doctor?.name || 'Doctor'}</h4>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>{doctor?.specialty || 'General'}</p>
          {appointment?.hospital?.name && (
            <p style={{ margin: '6px 0 0', fontSize: 12, fontWeight: 700, color: '#0d9488' }}>
              🏥 {appointment.hospital.name}
            </p>
          )}
        </div>

        {/* Actions: Get Directions & Cancel Token */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {appointment?.hospital?.google_maps_url && (
            <a
              href={appointment.hospital.google_maps_url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'block', padding: 12, borderRadius: 12, background: '#0d9488',
                color: 'white', fontWeight: 700, fontSize: 13, textDecoration: 'none', textAlign: 'center',
              }}
            >
              📍 Open Directions in Google Maps
            </a>
          )}

          <button
            onClick={handleCancelBooking}
            disabled={cancelling}
            className="cancel-token-btn"
          >
            {cancelling ? 'Cancelling Token...' : '✕ Cancel Token / Leave Queue'}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              style={{ padding: 10, borderRadius: 12, border: 'none', background: 'none', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Close Ticket
            </button>
          )}
        </div>

      </div>
    </div>
  );
}