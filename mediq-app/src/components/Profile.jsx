import { useState, useEffect } from 'react';
import { getMyBookings, cancelAppointment } from '../hospitalData';
import './Profile.css';

export default function Profile({ user, displayName, onClose, onLogout, onSelectBooking }) {
  const [bookings, setBookings] = useState([]);
  const [receiptBooking, setReceiptBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    if (!user?.id) return;
    setLoading(true);
    const list = await getMyBookings(user.id);
    setBookings(list || []);
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
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

  // Generate deterministic Patient Code from User ID / Email
  const patientCode = user?.id 
    ? `MDQ-${user.id.slice(0, 4).toUpperCase()}` 
    : 'MDQ-8207';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#f8fafc', borderTopLeftRadius: 32, borderTopRightRadius: 32,
        padding: '24px 20px 32px', width: '100%', maxWidth: 480, maxHeight: '88vh',
        overflowY: 'auto', boxShadow: '0 -20px 50px -10px rgba(0,0,0,0.3)',
      }}>
        
        {/* Drawer Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Patient Health Profile</h3>
          <button onClick={onClose} style={{ border: 'none', background: '#e2e8f0', borderRadius: '50%', width: 32, height: 32, fontWeight: 700, cursor: 'pointer' }}>✕</button>
        </div>

        {/* 1. DIGITAL HEALTH PASS CARD */}
        <div className="patient-pass-card">
          <div className="patient-pass-header">
            <div>
              <p style={{ margin: 0, fontSize: 11, color: '#99f6e4', fontWeight: 700, letterSpacing: 0.5 }}>MEDIQ DIGITAL HEALTH PASS</p>
              <h2 style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 800 }}>{displayName || user?.name || 'Patient'}</h2>
            </div>
            <span className="patient-pass-badge">Member Active</span>
          </div>

          <p style={{ margin: '0 0 14px', fontSize: 12, opacity: 0.8 }}>{user?.email}</p>

          <div className="patient-code-box">
            <div>
              <span style={{ fontSize: 10, opacity: 0.7, display: 'block', textTransform: 'uppercase' }}>Patient ID Code</span>
              <strong style={{ fontSize: 16, letterSpacing: 1.5 }}>{patientCode}</strong>
            </div>
            <span style={{ fontSize: 22 }}>💳</span>
          </div>
        </div>

        {/* 2. RECENT BOOKING HISTORY */}
        <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>Consultation History</h4>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading booking history...</p>
        ) : bookings.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 16, padding: 20, textAlign: 'center', border: '1px solid #e2e8f0', marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>No bookings found yet.</p>
          </div>
        ) : (
          <div style={{ marginBottom: 20 }}>
            {bookings.map((b) => {
              const isWaiting = b.status === 'waiting';
              const isCompleted = b.status === 'completed' || b.status === 'seen';
              
              return (
                <div key={b.id} className="history-card-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <h5 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                        {b.doctor?.name ? `Dr. ${b.doctor.name}` : 'Doctor Consultation'}
                      </h5>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{b.hospital?.name || 'Clinic'}</p>
                    </div>

                    <span className={`history-status-badge ${
                      isWaiting ? 'history-status-waiting' : isCompleted ? 'history-status-completed' : 'history-status-cancelled'
                    }`}>
                      {isWaiting ? '⏱️ Waiting' : isCompleted ? '🟢 Completed' : '✕ Cancelled'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0d9488' }}>
                      Token #{b.queue_number} · {new Date(b.created_at).toLocaleDateString()}
                    </span>

                    {isWaiting && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        {onSelectBooking && (
                          <button
                            onClick={() => { onSelectBooking(b); onClose(); }}
                            style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#0d9488', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                          >
                            🎟️ Track Queue
                          </button>
                        )}
                        <button
                          onClick={() => handleCancel(b.id)}
                          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #fca5a5', background: '#fff5f5', color: '#ef4444', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {receiptBooking && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15,23,42,0.75)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1100, padding: 20,
          }} onClick={() => setReceiptBooking(null)}>
            <div style={{
              background: '#fff', borderRadius: 20, padding: 24, maxWidth: 360, width: '100%',
            }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Consultation Receipt</h3>
              <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748b' }}>
                Booking ID: {receiptBooking.booking_code || '�'}
              </p>

              <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Doctor</span>
                  <strong>{receiptBooking.doctor?.name || '�'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Clinic</span>
                  <strong>{receiptBooking.hospital?.name || '�'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Token Number</span>
                  <strong>#{receiptBooking.queue_number}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Date</span>
                  <strong>{new Date(receiptBooking.created_at).toLocaleDateString()}</strong>
                </div>
                {receiptBooking.doctor?.consultation_fee != null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Consultation Fee</span>
                    <strong>?{receiptBooking.doctor.consultation_fee}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Payment Method</span>
                  <strong>{receiptBooking.payment_method === 'upi' ? 'UPI' : 'Cash'}</strong>
                </div>
                {receiptBooking.payment_method === 'upi' && receiptBooking.transaction_id && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Transaction ID</span>
                    <strong>{receiptBooking.transaction_id}</strong>
                  </div>
                )}
              </div>

              {receiptBooking.payment_screenshot_url && (
                
                  href={receiptBooking.payment_screenshot_url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', textAlign: 'center', marginTop: 14, fontSize: 12, color: '#0d9488', fontWeight: 700 }}
                >
                  View Payment Screenshot
                </a>
              )}

              <button
                onClick={() => setReceiptBooking(null)}
                style={{ width: '100%', marginTop: 18, padding: 12, borderRadius: 12, border: 'none', background: '#f1f5f9', color: '#334155', fontWeight: 700, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* 3. LOGOUT BUTTON */}
        <button
          onClick={onLogout}
          style={{
            width: '100%', padding: 14, borderRadius: 16, border: '1px solid #fca5a5',
            background: '#fff5f5', color: '#ef4444', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Sign Out of Account
        </button>

      </div>
    </div>
  );
}


