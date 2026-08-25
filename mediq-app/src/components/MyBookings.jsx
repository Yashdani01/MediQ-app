import { useState, useEffect } from 'react';
import { getMyBookings, cancelAppointment } from '../hospitalData';
import BookingTicket from './BookingTicket';
import './MyBookings.css';

export default function MyBookings({ user, displayName }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getMyBookings(user.id);
      setBookings(data || []);
    } catch (err) {
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setCancellingId(appointmentId);
    const { error } = await cancelAppointment(appointmentId);
    setCancellingId(null);
    if (error) {
      alert('Could not cancel appointment. Please try again.');
    } else {
      await fetchBookings();
    }
  };

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter((b) => {
    const status = b.status?.toLowerCase();
    if (activeTab === 'upcoming') {
      return status === 'waiting' || status === 'checked_in';
    }
    if (activeTab === 'completed') {
      return status === 'completed' || status === 'seen';
    }
    if (activeTab === 'cancelled') {
      return status === 'cancelled';
    }
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f8f6f0', color: '#0b332c', fontFamily: 'sans-serif', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '650px', margin: '0 auto', padding: '20px 16px', boxSizing: 'border-box' }}>
        
        {/* HEADER */}
        <div style={{ background: 'linear-gradient(135deg, #e6f4ea 0%, #daf2e1 100%)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '20px', padding: '20px 22px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>MediQ Patient Portal</div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '22px', color: '#0b332c', margin: '0 0 4px' }}>My Bookings</h1>
            <p style={{ fontSize: '11.5px', color: '#475569', margin: 0 }}>View and manage your doctor appointments & priority queue tokens.</p>
          </div>
          <button onClick={fetchBookings} style={{ background: '#fff', border: '1px solid #10b981', padding: '8px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', color: '#0b332c', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
            ↻ Refresh
          </button>
        </div>

        {/* TAB NAVIGATION */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
          {[
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px',
                borderRadius: '14px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                border: activeTab === tab.id ? 'none' : '1px solid #e2e8f0',
                background: activeTab === tab.id ? '#0b332c' : '#fff',
                color: activeTab === tab.id ? '#fff' : '#64748b',
                boxShadow: activeTab === tab.id ? '0 4px 12px rgba(11, 51, 44, 0.15)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* BOOKINGS LIST */}
        {loading ? (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '40px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Loading your bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '40px 20px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', color: '#0b332c', margin: '0 0 4px' }}>No {activeTab} bookings</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Your booked queue tokens will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredBookings.map((booking) => {
              const doctorName = booking.doctor?.name || 'Doctor';
              const specialty = booking.doctor?.specialty || 'General Physician';
              const hospitalName = booking.hospital?.name || 'Clinic';
              const isWaiting = booking.status === 'waiting' || booking.status === 'checked_in';

              return (
                <div
                  key={booking.id}
                  style={{
                    background: booking.is_priority ? '#fffbeb' : '#fff',
                    border: booking.is_priority ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                    borderRadius: '20px',
                    padding: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '45px', height: '45px', background: '#e6f4ea', color: '#0b332c', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700' }}>
                        {doctorName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', color: '#0b332c', margin: '0 0 2px' }}>
                          {doctorName}
                        </h2>
                        <p style={{ fontSize: '12px', color: '#10b981', fontWeight: '600', margin: 0 }}>
                          {specialty} • {hospitalName}
                        </p>
                      </div>
                    </div>

                    {booking.is_priority && (
                      <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '10.5px', fontWeight: '900', padding: '3px 8px', borderRadius: '6px', border: '1px solid #fde047' }}>
                        ⚡ Priority Pass
                      </span>
                    )}
                  </div>

                  {/* PATIENT / CARE CIRCLE BADGE */}
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ background: '#e6f4ea', color: '#0b332c', padding: '4px 10px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '700', border: '1px solid #bbf7d0', display: 'inline-block' }}>
                      👤 Patient: <strong>{booking.patient_name || displayName || 'Self (Primary)'}</strong>
                    </span>
                  </div>

                  {/* DETAILS GRID */}
                  <div style={{ background: '#f8f6f0', padding: '12px 14px', borderRadius: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12.5px', marginBottom: '14px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Queue Number:</span> <strong style={{ color: '#0b332c' }}>#{booking.queue_number || booking.token_number}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Fee Paid:</span> <strong style={{ color: '#0b332c' }}>₹{booking.consultation_fee || booking.doctor?.consultation_fee || 500}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Status:</span> <strong style={{ color: isWaiting ? '#d97706' : '#15803d', textTransform: 'capitalize' }}>{booking.status}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Payment:</span> <strong style={{ color: '#0b332c', textTransform: 'uppercase' }}>{booking.payment_method || 'Cash'}</strong>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setSelectedTicket({
                        appointment: booking,
                        doctor: { name: doctorName, specialty: specialty, avg_minutes_per_patient: booking.doctor?.avg_minutes_per_patient || 10 },
                        paymentMethod: booking.payment_method || 'cash'
                      })}
                      style={{ flex: 1, background: '#0b332c', color: '#fff', border: 'none', padding: '11px', borderRadius: '12px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      🎫 View Digital Ticket
                    </button>

                    {isWaiting && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancellingId === booking.id}
                        style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '11px 14px', borderRadius: '12px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TICKET MODAL POPUP */}
      {selectedTicket && (
        <BookingTicket
          appointment={selectedTicket.appointment}
          doctor={selectedTicket.doctor}
          paymentMethod={selectedTicket.paymentMethod}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
}
