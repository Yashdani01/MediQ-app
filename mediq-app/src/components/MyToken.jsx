import { useState, useEffect } from 'react';
import { getMyCurrentBooking } from '../hospitalData';
import './MyToken.css';

const STATUS_STYLES = {
  available: { label: 'Available', color: '#22c55e' },
  delayed: { label: 'Delayed', color: '#f59e0b' },
  on_break: { label: 'On Break', color: '#6b7280' },
  not_started: { label: 'Not Started', color: '#ef4444' },
  on_leave: { label: 'On Leave / Holiday', color: '#dc2626' },
  completed: { label: 'Done for Today', color: '#374151' },
};

export default function MyToken({ user }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = (silent) => {
    if (!user) { setLoading(false); return; }
    if (silent) setRefreshing(true);
    getMyCurrentBooking(user.id).then((data) => {
      setBooking(data);
      setLoading(false);
      setRefreshing(false);
    });
  };

  useEffect(() => {
    load(false);
    const interval = setInterval(() => load(true), 60000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return <div className="token-page"><p style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Loading your token...</p></div>;
  }

  if (!booking) {
    return (
      <div className="token-page">
        <div className="token-empty-state">
          <div className="token-empty-icon">🎟️</div>
          <h3 style={{ color: '#0f172a', margin: '0 0 6px' }}>No active token</h3>
          <p style={{ margin: 0 }}>You haven't booked a queue token yet.</p>
        </div>
      </div>
    );
  }

  const currentServing = Math.max(booking.queue_number - booking.patientsAhead - 1, 0);
  const estWaitMinutes = booking.patientsAhead * (booking.doctor?.avg_minutes_per_patient || 10);
  const progressPercent = booking.patientsAhead === 0
    ? 100
    : Math.min(95, Math.max(5, ((booking.queue_number - currentServing - booking.patientsAhead) / (booking.queue_number - currentServing || 1)) * 100));

  const doctorInitial = booking.doctor?.name?.replace('Dr. ', '').charAt(0) || 'D';
  const statusInfo = STATUS_STYLES[booking.doctor?.status] || STATUS_STYLES.available;
  const isNext = booking.patientsAhead === 0;

  const mapsUrl = booking.hospital?.location
    ? (booking.hospital.location.startsWith('http')
        ? booking.hospital.location
        : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${booking.hospital.name}, ${booking.hospital.location}`)}`)
    : null;

  return (
    <div className="token-page">
      <div className="token-topbar">
        <div className="token-topbar-inner">
          <div>
            <p className="token-hospital-name">{booking.hospital?.name}</p>
            <h2 style={{ margin: '2px 0 0', fontSize: '18px', color: '#fff' }}>Live Queue Command Center</h2>
          </div>
          <span className="token-live-badge">
            <span className="token-live-dot" />
            {refreshing ? 'Refreshing...' : 'Live'}
          </span>
        </div>
      </div>

      <div className="token-content">
        <div className="token-activity-banner" style={{ borderLeftColor: statusInfo.color }}>
          <span className="token-activity-dot" style={{ background: statusInfo.color }} />
          <span>
            Dr. {booking.doctor?.name?.replace('Dr. ', '')} is currently <strong style={{ color: statusInfo.color }}>{statusInfo.label}</strong>
            {booking.doctor?.status === 'delayed' && booking.doctor?.delay_minutes ? ` (~${booking.doctor.delay_minutes}m)` : ''}
          </span>
        </div>

        <div className="token-circle-wrap">
          <div className="token-circle" style={{
            background: `conic-gradient(#0d9488 ${progressPercent}%, #e2e8f0 ${progressPercent}%)`,
          }}>
            <div className="token-circle-inner">
              <span className="token-circle-label">Your Token Number</span>
              <span className="token-circle-number">{booking.queue_number}</span>
              <span className="token-circle-sub">
                {isNext ? "You're next!" : 'You are in queue'}
              </span>
            </div>
          </div>
        </div>

        <div className="token-stats-grid">
          <div className="token-stat-card">
            <div className="token-stat-label">Currently Serving</div>
            <div className="token-stat-value">{currentServing}</div>
          </div>
          <div className="token-stat-card">
            <div className="token-stat-label">Patients Before You</div>
            <div className="token-stat-value">{booking.patientsAhead}</div>
          </div>
          <div className="token-stat-card">
            <div className="token-stat-label">Estimated Wait</div>
            <div className="token-stat-value">{estWaitMinutes} min</div>
          </div>
          <div className="token-stat-card">
            <div className="token-stat-label">Queue Status</div>
            <div className="token-stat-value" style={{ fontSize: 15, color: '#0d9488' }}>Moving</div>
          </div>
        </div>

        <div className="token-progress-card">
          <div className="token-progress-labels">
            <div>Current Token<br /><strong>{currentServing}</strong></div>
            <div style={{ textAlign: 'right' }}>Your Token<br /><strong>{booking.queue_number}</strong></div>
          </div>
          <div className="token-progress-track">
            <div className="token-progress-fill" style={{ width: `${progressPercent}%` }} />
            <div className="token-progress-dot" style={{ left: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="token-doctor-card">
          <div className="token-doctor-avatar">{doctorInitial}</div>
          <div style={{ flex: 1 }}>
            <p className="token-doctor-name">{booking.doctor?.name}</p>
            <p className="token-doctor-specialty">{booking.doctor?.specialty}</p>
          </div>
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="token-directions-btn">
              📍 Directions
            </a>
          )}
        </div>

        {/* Quick Action Strip */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px', marginBottom: '30px' }}>
          <button 
            onClick={() => alert(`Contact phone for clinic: ${booking.contact_phone || 'Available at clinic reception'}`)}
            style={{
              flex: 1, padding: '12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
              fontWeight: 600, fontSize: '13px', color: '#0f172a', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}
          >
            📞 Clinic Info
          </button>
          <button 
            onClick={() => window.location.reload()}
            style={{
              flex: 1, padding: '12px', background: '#0d9488', border: 'none', borderRadius: '12px',
              fontWeight: 600, fontSize: '13px', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)'
            }}
          >
            🔄 Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
}
