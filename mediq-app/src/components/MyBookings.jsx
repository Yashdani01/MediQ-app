import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { getMyBookings, cancelAppointment } from '../hospitalData';
import './MyBookings.css';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'completed' | 'cancelled'

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
    <div className="my-bookings-page" style={{ padding: '20px 16px 80px', maxWidth: '650px', margin: '0 auto', boxSizing: 'border-box' }}>
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
                  style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
                >
                  <div className="booking-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
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

                    {booking.doctor?.consultation_fee && (
                      <div className="booking-detail" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className="detail-icon">₹</span>
                        <div>
                          <span className="detail-label" style={{ display: 'block', fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase' }}>Fee</span>
                          <strong style={{ fontSize: '12.5px', color: '#0b332c' }}>₹{booking.doctor.consultation_fee}</strong>
                        </div>
                      </div>
                    )}
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
            onClick={() => alert('Support line: support@med-iq.in')}
            style={{ background: '#fff', border: '1px solid #10b981', color: '#0b332c', padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
          >
            🎧 Support
          </button>
        </div>

      </div>
    </div>
  );
}
