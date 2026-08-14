import { useState, useEffect } from 'react';
import { getMyBookings, cancelAppointment, getPatientProfileDetails } from '../hospitalData';
import './Profile.css';

function formatMemberSince(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function Profile({ user, displayName, onClose, onLogout, onSelectBooking }) {
  const [bookings, setBookings] = useState([]);
  const [receiptBooking, setReceiptBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patientDetails, setPatientDetails] = useState(null);

  const loadHistory = async () => {
    if (!user?.id) return;
    setLoading(true);
    const list = await getMyBookings(user.id);
    setBookings(list || []);
    setLoading(false);
  };

  const loadPatientDetails = async () => {
    if (!user?.id) return;
    const details = await getPatientProfileDetails(user.id);
    setPatientDetails(details);
  };

  useEffect(() => {
    loadHistory();
    loadPatientDetails();
  }, [user]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    const { error } = await cancelAppointment(bookingId);
    if (error) {
      alert('Could not cancel booking.');
    } else {
      await loadHistory();
    }
  };

  const patientCode = patientDetails?.patient_code || 'Loading...';
  const memberSince = formatMemberSince(patientDetails?.created_at);
  const nameForAvatar = displayName || user?.name || 'Patient';
  const avatarInitial = nameForAvatar.charAt(0).toUpperCase();

  return (
    <div className="profile-overlay">
      <div className="profile-sheet">
        <div className="profile-handle" />

        {/* Drawer Header */}
        <div className="profile-drawer-header">
          <h3 className="profile-drawer-title">Patient Health Profile</h3>
          <button onClick={onClose} className="profile-x-btn">✕</button>
        </div>

        {/* Avatar + name + email */}
        <div className="profile-header">
          <div className="profile-avatar-large">{avatarInitial}</div>
          <div>
            <p className="profile-name">{nameForAvatar}</p>
            <p className="profile-email">{user?.email}</p>
          </div>
        </div>

        {/* Account section */}
        <p className="profile-section-label">Account</p>
        <div className="profile-info-list">
          <div className="profile-info-row">
            <span className="profile-info-label">Patient Code</span>
            <span className="profile-info-value accent">{patientCode}</span>
          </div>
          {memberSince && (
            <div className="profile-info-row">
              <span className="profile-info-label">Member Since</span>
              <span className="profile-info-value">{memberSince}</span>
            </div>
          )}
        </div>

        {/* Booking History */}
        <p className="profile-section-label">Booking History</p>

        {loading ? (
          <p className="profile-empty">Loading booking history...</p>
        ) : bookings.length === 0 ? (
          <div className="profile-empty-card">
            <p>No bookings found yet.</p>
          </div>
        ) : (
          <div className="history-list">
            {bookings.map((b) => {
              const isWaiting = b.status === 'waiting';
              const isCompleted = b.status === 'completed' || b.status === 'seen';
              const statusClass = isWaiting ? 'waiting' : isCompleted ? 'completed' : 'cancelled';
              const statusLabel = isWaiting ? 'Waiting' : isCompleted ? 'Completed' : 'Cancelled';

              return (
                <div key={b.id} className="history-card">
                  <div className="history-card-top">
                    <div>
                      <p className="history-doctor">
                        {b.doctor?.name ? `Dr. ${b.doctor.name}` : 'Doctor Consultation'}
                      </p>
                      <p className="history-hospital">{b.hospital?.name || 'Clinic'}</p>
                    </div>
                    <span className={`history-status ${statusClass}`}>{statusLabel}</span>
                  </div>

                  <div className="history-card-bottom">
                    <span className="history-meta">
                      Token #{b.queue_number} · {new Date(b.created_at).toLocaleDateString()}
                    </span>

                    <div style={{ display: 'flex', gap: 6 }}>
                      {isWaiting && onSelectBooking && (
                        <button
                          onClick={() => { onSelectBooking(b); onClose(); }}
                          className="history-track-btn"
                        >
                          Track Queue
                        </button>
                      )}
                      <button
                        onClick={() => setReceiptBooking(b)}
                        className="history-receipt-btn"
                      >
                        Receipt
                      </button>
                      {isWaiting && (
                        <button
                          onClick={() => handleCancel(b.id)}
                          className="history-cancel-btn"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {receiptBooking && (
          <div className="receipt-overlay" onClick={() => setReceiptBooking(null)}>
            <div className="receipt-card" onClick={(e) => e.stopPropagation()}>
              <h3 className="receipt-title">Consultation Receipt</h3>
              <p className="receipt-subtitle">
                Booking ID: {receiptBooking.booking_code || 'N/A'}
              </p>

              <div className="receipt-rows">
                <div className="receipt-row">
                  <span>Doctor</span>
                  <strong>{receiptBooking.doctor?.name || 'N/A'}</strong>
                </div>
                <div className="receipt-row">
                  <span>Clinic</span>
                  <strong>{receiptBooking.hospital?.name || 'N/A'}</strong>
                </div>
                <div className="receipt-row">
                  <span>Token Number</span>
                  <strong>#{receiptBooking.queue_number}</strong>
                </div>
                <div className="receipt-row">
                  <span>Date</span>
                  <strong>{new Date(receiptBooking.created_at).toLocaleDateString()}</strong>
                </div>
                {receiptBooking.doctor?.consultation_fee != null && (
                  <div className="receipt-row">
                    <span>Consultation Fee</span>
                    <strong>₹{receiptBooking.doctor.consultation_fee}</strong>
                  </div>
                )}
                <div className="receipt-row">
                  <span>Payment Method</span>
                  <strong>{receiptBooking.payment_method === 'upi' ? 'UPI' : 'Cash'}</strong>
                </div>
                {receiptBooking.payment_method === 'upi' && receiptBooking.transaction_id && (
                  <div className="receipt-row">
                    <span>Transaction ID</span>
                    <strong>{receiptBooking.transaction_id}</strong>
                  </div>
                )}
              </div>

              {receiptBooking.payment_screenshot_url && (
                <a
                  href={receiptBooking.payment_screenshot_url} target="_blank" rel="noopener noreferrer"
                  className="receipt-screenshot-link"
                >
                  View Payment Screenshot
                </a>
              )}

              <button onClick={() => setReceiptBooking(null)} className="receipt-close-btn">
                Close
              </button>
            </div>
          </div>
        )}

        {/* Bottom actions */}
        <div className="profile-actions">
          <button onClick={onClose} className="profile-close-btn">
            Close
          </button>
          <button onClick={onLogout} className="profile-logout-btn">
            Sign Out of Account
          </button>
        </div>

      </div>
    </div>
  );
}
