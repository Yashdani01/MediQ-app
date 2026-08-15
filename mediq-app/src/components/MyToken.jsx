import { useState, useEffect } from 'react';
import { getMyCurrentBooking, cancelAppointment, getAppointmentStatus } from '../hospitalData';
import './MyToken.css';

const STATUS_STYLES = {
  available: { label: 'Available', color: '#10b981' },
  delayed: { label: 'Delayed', color: '#f59e0b' },
  on_break: { label: 'On Break', color: '#94a3b8' },
  not_started: { label: 'Not Started', color: '#ef4444' },
  on_leave: { label: 'On Leave / Holiday', color: '#ef4444' },
  completed: { label: 'Done for Today', color: '#64748b' },
};

export default function MyToken({ user }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apptStatus, setApptStatus] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const load = (silent) => {
    if (!user) { setLoading(false); return; }
    if (silent) setRefreshing(true);
    getMyCurrentBooking(user.id).then(async (data) => {
      if (data && data.status !== 'cancelled' && data.status !== 'completed') {
        setBooking(data);
        const statusData = await getAppointmentStatus(data.id);
        setApptStatus(statusData);
      } else {
        setBooking(null);
      }
      setLoading(false);
      setRefreshing(false);
    });
  };

  useEffect(() => {
    load(false);
    const interval = setInterval(() => load(true), 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleCancel = async () => {
    if (!booking) return;
    if (!window.confirm('Are you sure you want to cancel this token?')) return;
    setCancelling(true);
    const { error } = await cancelAppointment(booking.id);
    setCancelling(false);
    if (!error) {
      setBooking(null);
    } else {
      alert('Could not cancel appointment. Please try again.');
    }
  };

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0b0f0e', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', zIndex: 100 }}>
        Loading Live Tracker...
      </div>
    );
  }

  if (!booking) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0b0f0e', color: '#fff', padding: '40px 20px', textAlign: 'center', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', zIndex: 10, overflowY: 'auto' }}>
        <div style={{ maxWidth: '420px', margin: '100px auto', background: '#131b18', border: '1px solid #1f2f29', borderRadius: '24px', padding: '32px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🎟️</div>
          <h3 style={{ margin: '0 0 6px', color: '#fff', fontSize: '18px' }}>No Active Token</h3>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '13.5px' }}>You do not have any active queue tokens for today.</p>
        </div>
      </div>
    );
  }

  const currentServing = Math.max(booking.queue_number - booking.patientsAhead - 1, 0);
  const estWaitMinutes = booking.patientsAhead * (booking.doctor?.avg_minutes_per_patient || 10);
  const statusInfo = STATUS_STYLES[booking.doctor?.status] || STATUS_STYLES.available;

  const isCheckedIn = apptStatus?.checked_in_at || booking.status === 'checked_in' || booking.status === 'serving';
  const isTurn = booking.status === 'serving';

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0b0f0e', color: '#fff', overflowY: 'auto', paddingBottom: '100px', fontFamily: 'Inter, sans-serif', zIndex: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 10px', maxWidth: '480px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>Live Queue Tracker</h2>
        <button 
          onClick={() => load(true)} 
          style={{ background: '#131b18', border: '1px solid #1f2f29', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', cursor: 'pointer' }}
          title="Refresh Queue"
        >
          🔄
        </button>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 16px', boxSizing: 'border-box' }}>
        <div style={{ background: '#131b18', border: '1px solid #1f2f29', borderRadius: '24px', padding: '24px', textAlign: 'center', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
          
          <div style={{ width: '150px', height: '150px', borderRadius: '50%', border: '4px solid #10b981', margin: '0 auto 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 25px rgba(16, 185, 129, 0.15)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Token</span>
            <span style={{ fontSize: '42px', fontWeight: 800, color: '#fff', lineHeight: '1.1' }}>#{currentServing > 0 ? currentServing : booking.queue_number}</span>
            <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>Active Now</span>
          </div>

          <h3 style={{ margin: '0 0 2px', fontSize: '16px', fontWeight: 700, color: '#fff' }}>{booking.doctor?.name}</h3>
          <p style={{ margin: 0, fontSize: '12.5px', color: '#94a3b8' }}>{booking.hospital?.name}</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px', background: '#0b0f0e', padding: '12px', borderRadius: '14px', border: '1px solid #1f2f29' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Ahead of You</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#10b981' }}>{booking.patientsAhead} Patients</div>
            </div>
            <div style={{ borderLeft: '1px solid #1f2f29' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Est. Wait Time</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{estWaitMinutes} mins</div>
            </div>
          </div>
        </div>

        <div style={{ background: '#131b18', border: '1px solid #1f2f29', borderRadius: '24px', padding: '20px', marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: '#fff' }}>Queue Timeline</h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#10b981', color: '#0b0f0e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>✓</div>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '13.5px', fontWeight: 600, color: '#fff' }}>Booked</p>
                <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8' }}>Successfully registered in queue at token #{booking.queue_number}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: isCheckedIn ? '#10b981' : '#1f2f29', color: isCheckedIn ? '#0b0f0e' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>{isCheckedIn ? '✓' : '•'}</div>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '13.5px', fontWeight: 600, color: isCheckedIn ? '#fff' : '#94a3b8' }}>Checked In</p>
                <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8' }}>Clinic verified your presence in queue</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: isTurn ? '#10b981' : '#1f2f29', color: isTurn ? '#0b0f0e' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>{isTurn ? '✓' : '○'}</div>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '13.5px', fontWeight: 600, color: isTurn ? '#fff' : '#94a3b8' }}>Your Turn</p>
                <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8' }}>Enter doctor's chamber for consultation</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleCancel}
          disabled={cancelling}
          style={{
            width: '100%',
            padding: '14px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '14px',
            color: '#ef4444',
            fontWeight: 600,
            fontSize: '13.5px',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          {cancelling ? 'Cancelling...' : 'Cancel Ticket'}
        </button>
      </div>
    </div>
  );
}
