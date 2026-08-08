import { useState, useEffect } from 'react';
import { getPatientProfileDetails, getBookingHistory } from '../hospitalData';
import './Profile.css';

export default function Profile({ user, displayName, onClose, onLogout }) {
  const [details, setDetails] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([
      getPatientProfileDetails(user.id),
      getBookingHistory(user.id),
    ]).then(([profileDetails, bookingHistory]) => {
      setDetails(profileDetails);
      setHistory(bookingHistory);
      setLoading(false);
    });
  }, [user]);

  const avatarInitial = (displayName || 'P').charAt(0).toUpperCase();

  const memberSince = details?.created_at
    ? new Date(details.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="profile-handle" />

        <div className="profile-header">
          <div className="profile-avatar-large">{avatarInitial}</div>
          <div>
            <p className="profile-name">{displayName}</p>
            <p className="profile-email">{user?.email}</p>
          </div>
        </div>

        {loading ? (
          <p className="profile-empty">Loading profile...</p>
        ) : (
          <>
            <p className="profile-section-label">Account</p>
            <div className="profile-info-list">
              <div className="profile-info-row">
                <span className="profile-info-label">Patient Code</span>
                <span className="profile-info-value">{details?.patient_code || '—'}</span>
              </div>
              <div className="profile-info-row">
                <span className="profile-info-label">Member Since</span>
                <span className="profile-info-value">{memberSince}</span>
              </div>
            </div>

            <p className="profile-section-label">Booking History</p>
            {history.length === 0 ? (
              <p className="profile-empty">No bookings yet.</p>
            ) : (
              <div className="history-list">
                {history.map((appt) => (
                  <div key={appt.id} className="history-card">
                    <div className="history-card-top">
                      <div>
                        <p className="history-doctor">{appt.doctor?.name || 'Doctor'}</p>
                        <p className="history-hospital">{appt.hospital?.name || 'Hospital'}</p>
                      </div>
                      <span className={`history-status ${appt.status}`}>{appt.status}</span>
                    </div>
                    <p className="history-meta">
                      Token #{appt.queue_number} · {new Date(appt.booked_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <button className="profile-close-btn" onClick={onClose}>Close</button>
        <button className="profile-logout-btn" onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}