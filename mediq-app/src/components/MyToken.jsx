import { useState, useEffect } from 'react';
import { getMyCurrentBooking } from '../hospitalData';
import './MyToken.css';

export default function MyToken({ user }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getMyCurrentBooking(user.id).then((data) => {
      setBooking(data);
      setLoading(false);
    });
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

  return (
    <div className="token-page">
      <div className="token-topbar">
        <div className="token-topbar-inner">
          <p className="token-hospital-name">{booking.hospital?.name}</p>
          <span className="token-live-badge">
            <span className="token-live-dot" />
            Live Queue
          </span>
        </div>
      </div>

      <div className="token-content">
        <div className="token-circle-wrap">
          <div className="token-circle">
            <span className="token-circle-label">Your Token Number</span>
            <span className="token-circle-number">{booking.queue_number}</span>
            <span className="token-circle-sub">
              {booking.patientsAhead === 0 ? "You're next!" : 'You are in queue'}
            </span>
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
            <div className="token-stat-value" style={{ fontSize: 15, color: '#16a34a' }}>Moving</div>
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
          <div>
            <p className="token-doctor-name">{booking.doctor?.name}</p>
            <p className="token-doctor-specialty">{booking.doctor?.specialty}</p>
          </div>
        </div>
      </div>
    </div>
  );
}