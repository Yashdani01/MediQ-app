import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { getMyBookings, cancelAppointment } from '../hospitalData';
import './MyBookings.css';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'completed' | 'cancelled'
  const [showSupportModal, setShowSupportModal] = useState(false); // Interactive Support Popup State

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        setBookings([]);
        return;
      }

      const data = await getMyBookings(user.id);

      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(appointmentId) {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this appointment?'
    );

    if (!confirmed) return;

    setCancellingId(appointmentId);

    try {
      const result = await cancelAppointment(appointmentId);

      if (result?.error) {
        console.error(result.error);
        alert('Could not cancel the appointment. Please try again.');
        return;
      }

      alert('Appointment cancelled successfully.');

      await loadBookings();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setCancellingId(null);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';

    try {
      return new Date(dateString).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  }

  function getStatusClass(status) {
    switch (status?.toLowerCase()) {
      case 'waiting':
      case 'checked_in':
        return 'status-waiting';

      case 'seen':
      case 'completed':
        return 'status-completed';

      case 'cancelled':
        return 'status-cancelled';

      default:
        return 'status-default';
    }
  }

  // Filter bookings based on selected tab
  const filteredBookings = bookings.filter((b) => {
    const st = b.status?.toLowerCase();
    if (activeTab === 'upcoming') {
      return st === 'waiting' || st === 'checked_in' || !st;
    }
    if (activeTab === 'completed') {
      return st === 'completed' || st === 'seen';
    }
    if (activeTab === 'cancelled') {
      return st === 'cancelled';
    }
    return true;
  });

  if (loading) {
    return (
      <div className="my-bookings-page">
        <div className="bookings-loading">
          <div className="bookings-spinner" />
          <p>Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-bookings-page" style={{ padding: '20px 16px 90px', maxWidth: '650px', margin: '0 auto', boxSizing: 'border-box' }}>
      <div className="my-bookings-container">
        
        {/* 🌟 EXACT MATCH TOP HEADER BANNER */}
        <div style={{
          background: 'linear-gradient(135deg, #e6f4ea 0%, #daf2e1 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '20px',
          padding: '22px 24px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.06)'
        }}>
          <div>
            <p className="bookings-eyebrow" style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '1px', color: '#134e44', fontWeight: '700', margin: '0 0 4px' }}>
              MEDIQ PATIENT PORTAL
            </p>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '22px', color: '#0b332c', margin: '0 0 6px' }}>
              My Bookings
            </h1>
            <p className="bookings-subtitle" style={{ fontSize: '12px', color: '#475569', margin: 0 }}>
              View and manage your doctor appointments.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
            <div style={{
              width: '75px', height: '55px', background: 'rgba(255,255,255,0.7)',
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid rgba(16,185,129,0.15)'
            }}>
              <span style={{ fontSize: '22px' }}>📅⏱️</span>
            </div>
            
            <button
              type="button"
              className="refresh-bookings-btn"
              onClick={loadBookings}
              style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#0b332c', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>↻</span> Refresh
            </button>
          </div>
        </div>

        {/* 📋 FILTER TABS (Upcoming, Completed, Cancelled) */}
        <div style={{ display: 'flex', background: '#fff', padding: '6px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '20px', gap: '6px' }}>
          {[
            { id: 'upcoming', label: 'Upcoming', icon: '📅' },
            { id: 'completed', label: 'Completed', icon: '✅' },
            { id: 'cancelled', label: 'Cancelled', icon: '❌' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                background: activeTab === tab.id ? '#0b332c' : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#475569',
                fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {filteredBookings.length === 0 ? (
          <div className="bookings-empty" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '40px 20px', textAlign: 'center' }}>
            <div className="bookings-empty-icon" style={{ fontSize: '36px', marginBottom: '10px' }}>
              📅
            </div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', color: '#0b332c', margin: '0 0 6px' }}>
              No {activeTab} bookings found
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '300px', margin: '0 auto' }}>
              You don't have any {activeTab} appointments right now. Book an appointment from the Home page.
            </p>
          </div>
        ) : (
          <div className="bookings-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredBookings.map((booking) => {
              const doctorName = booking.doctor?.name || 'Doctor';
              const specialty = booking.doctor?.specialty || 'General Consultation';
              const hospitalName = booking.hospital?.name || 'Hospital';
              const location = booking.hospital?.location || '';
              const city = booking.hospital?.city || '';
              const mapsUrl = booking.hospital?.google_maps_url;
              const isWaiting = booking.status?.toLowerCase() === 'waiting' || booking.status?.toLowerCase() === 'checked_in';

              return (
                <div
                  className="booking-card"
                  key={booking.id}
                  style={{
                    background: booking.is_priority ? '#fffbeb' : '#fff',
                    border: booking.is_priority ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                    borderRadius: '20px',
                    padding: '20px',
                    boxShadow: booking.is_priority ? '0 4px 15px rgba(245, 158, 11, 0.15)' : '0 4px 12px rgba(0,0,0,0.02)'
                  }}
                >
                 <div className="booking-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div className="doctor-info" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div className="doctor-avatar" style={{ width: '45px', height: '45px', background: '#e6f4ea', color: '#0b332c', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700' }}>
                        {doctorName.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', color: '#0b332c', margin: '0 0 2px' }}>
                          {doctorName}
                        </h2>
                        <p className="doctor-specialty" style={{ fontSize: '12px', color: '#10b981', fontWeight: '600', margin: 0 }}>
                          {specialty}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      {/* PRIORITY PASS BADGE ON PATIENT BOOKING */}
                      {booking.is_priority && (
                        <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '10px', fontWeight: '900', padding: '3px 8px', borderRadius: '6px', border: '1px solid #fde047' }}>
                          ⚡ Priority Pass
                        </span>
                      )}
                      <span
                        className={`booking-status ${getStatusClass(booking.status)}`}
                        style={{
                          fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '100px',
                          background: isWaiting ? '#fef9c3' : booking.status === 'cancelled' ? '#fee2e2' : '#dcfce7',
                          color: isWaiting ? '#854d0e' : booking.status === 'cancelled' ? '#991b1b' : '#15803d',
                          textTransform: 'capitalize'
                        }}
                      >
                        {booking.status || 'Waiting'}
                      </span>
                    </div>
                  </div>

                  {/* 👤 PATIENT / CARE CIRCLE NAME BADGE */}
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ background: '#e6f4ea', color: '#0b332c', padding: '4px 10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '700', border: '1px solid #bbf7d0', display: 'inline-block' }}>
                      👤 Patient: <strong>{booking.patient_name || 'Self (Primary)'}</strong>
                    </span>
                  </div>

                  <div className="booking-details" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8f6f0', padding: '14px', borderRadius: '14px', marginBottom: '16px' }}>
                    <div className="booking-detail" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="detail-icon">🏥</span>
                      <div>
                        <span className="detail-label" style={{ display: 'block', fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>Hospital</span>
                        <strong style={{ fontSize: '12.5px', color: '#0b332c' }}>{hospitalName}</strong>
                      </div>
                    </div>

                    <div className="booking-detail" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="detail-icon">🎫</span>
                      <div>
                        <span className="detail-label" style={{ display: 'block', fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>Queue Number</span>
                        <strong className="queue-number" style={{ fontSize: '13px', color: '#10b981' }}>#{booking.queue_number ?? 'N/A'}</strong>
                      </div>
                    </div>

                    <div className="booking-detail" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="detail-icon">💳</span>
                      <div>
                        <span className="detail-label" style={{ display: 'block', fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>Payment</span>
                        <strong style={{ fontSize: '12.5px', color: '#0b332c' }}>{booking.payment_method || 'Cash'}</strong>
                      </div>
                    </div>

                    <div className="booking-detail" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="detail-icon">₹</span>
                      <div>
                        <span className="detail-label" style={{ display: 'block', fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>Fee Paid</span>
                        <strong style={{ fontSize: '12.5px', color: '#0b332c' }}>₹{booking.consultation_fee || booking.doctor?.consultation_fee || 500}</strong>
                      </div>
                    </div>
                  </div>

                  {booking.booked_at && (
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🕒</span> Booked On: <strong>{formatDate(booking.booked_at)}</strong>
                    </div>
                  )}

                  <div className="booking-actions" style={{ display: 'flex', gap: '10px' }}>
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="directions-btn"
                        style={{ flex: 1, background: '#f1f5f9', color: '#0b332c', textAlign: 'center', padding: '10px', borderRadius: '12px', fontSize: '12.5px', fontWeight: '700', textDecoration: 'none' }}
                      >
                        📍 Directions
                      </a>
                    )}

                    {isWaiting && (
                      <button
                        type="button"
                        className="cancel-booking-btn"
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancellingId === booking.id}
                        style={{ flex: 1, background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px', borderRadius: '12px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Appointment'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 🎧 NEED HELP / SUPPORT FOOTER CARD */}
        <div style={{
          background: '#e6f4ea', border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '16px', padding: '16px 20px', marginTop: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🛡️</span>
            <div>
              <h4 style={{ fontFamily: 'Fraunces, serif', fontSize: '14.5px', color: '#0b332c', margin: '0 0 2px' }}>
                Need help?
              </h4>
              <p style={{ fontSize: '11.5px', color: '#475569', margin: 0 }}>
                Contact our support if you need any assistance.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSupportModal(true)}
            style={{ background: '#fff', border: '1px solid #10b981', color: '#0b332c', padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>🎧</span> Support
          </button>
        </div>

      </div>

      {/* 💬 INTERACTIVE SUPPORT OPTIONS MODAL */}
      {showSupportModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(6, 43, 37, 0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            background: '#fff', width: '100%', maxWidth: '380px', borderRadius: '24px',
            padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setShowSupportModal(false)}
              style={{ position: 'absolute', top: '18px', right: '18px', background: '#f1f5f9', border: 'none', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#0b332c', fontWeight: 'bold' }}
            >
              ✕
            </button>

            <h3 style={{ margin: '0 0 6px', fontFamily: 'Fraunces, serif', fontSize: '19px', color: '#0b332c' }}>
              MediQ Helpdesk
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '12.5px', color: '#64748b' }}>
              Choose your preferred channel to connect with our support team:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {/* WhatsApp Option */}
              <a
                href="https://wa.me/918585058779?text=Hello%20MediQ%20Support,%20I%20need%20assistance%20with%20my%20booking."
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', background: '#f0fdf4',
                  border: '1px solid #bbf7d0', padding: '14px 16px', borderRadius: '14px',
                  textDecoration: 'none', color: '#166534', fontWeight: '700', fontSize: '13.5px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                }}
              >
                <span style={{ fontSize: '20px' }}>🟢</span>
                <div style={{ flex: 1 }}>
                  <div>WhatsApp Chat</div>
                  <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 'normal' }}>+91 85850 58779</div>
                </div>
                <span>→</span>
              </a>

              {/* Email Option */}
              <a
                href="mailto:helpdesk.mediq@gmail.com?subject=Support%20Request%20-%20MediQ%20Patient%20Portal"
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', background: '#f8f6f0',
                  border: '1px solid #e2e8f0', padding: '14px 16px', borderRadius: '14px',
                  textDecoration: 'none', color: '#0b332c', fontWeight: '700', fontSize: '13.5px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                }}
              >
                <span style={{ fontSize: '20px' }}>✉️</span>
                <div style={{ flex: 1 }}>
                  <div>Email Support</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>helpdesk.mediq@gmail.com</div>
                </div>
                <span>→</span>
              </a>
            </div>

            <button
              onClick={() => setShowSupportModal(false)}
              style={{
                width: '100%', background: '#0b332c', color: '#fff', border: 'none',
                padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
