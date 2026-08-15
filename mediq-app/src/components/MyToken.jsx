import { useState, useEffect } from 'react';
import { getMyCurrentBooking, cancelAppointment, getAppointmentStatus } from '../hospitalData';
import './MyToken.css';

const STATUS_STYLES = {
  available: { label: 'Available', color: '#10b981' },
  delayed: { label: 'Delayed', color: '#f59e0b' },
  on_break: { label: 'On Break', color: '#64748b' },
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
      <div style={{ padding: '60px', textAlign: 'center', color: '#0b332c', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
        Loading Live Tracker...
      </div>
    );
  }

  if (!booking) {
    return (
      <div style={{ maxWidth: '640px', margin: '40px auto 100px', padding: '0 20px', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}>
        {/* Top Header Card Matching Reports & Home */}
        <div style={{ background: '#0b332c', borderRadius: '20px', padding: '24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', boxShadow: '0 10px 25px rgba(11, 51, 44, 0.15)' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontFamily: 'Fraunces, serif' }}>Live Queue Tracker</h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Active appointment and queue status</p>
          </div>
          <button 
            onClick={() => load(true)} 
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '8px 12px', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Empty State Card */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '48px 24px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '42px', marginBottom: '12px' }}>🎟️</div>
          <h3 style={{ margin: '0 0 6px', color: '#0b332c', fontSize: '18px', fontFamily: 'Fraunces, serif' }}>No Active Token</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13.5px' }}>You do not have any active queue tokens for today.</p>
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
    <div style={{ maxWidth: '640px', margin: '40px auto 100px', padding: '0 20px', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}>
      
      {/* Top Header Card */}
      <div style={{ background: '#0b332c', borderRadius: '20px', padding: '24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', boxShadow: '0 10px 25px rgba(11, 51, 44, 0.15)' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontFamily: 'Fraunces, serif' }}>Live Queue Tracker</h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{booking.hospital?.name}</p>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '6px 12px', borderRadius: '20px' }}>
          ● {refreshing ? 'Refreshing...' : 'Live'}
        </span>
      </div>

      {/* Main Tracker Card */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', textAlign: 'center', marginBottom: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        
        {/* Token Circular Badge */}
        <div style={{ width: '140px', height: '140px', borderRadius: '50%', border: '4px solid #0b332c', margin: '0 auto 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#0b332c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Token</span>
          <span style={{ fontSize: '38px', fontWeight: 800, color: '#0b332c', lineHeight: '1.1' }}>#{currentServing > 0 ? currentServing : booking.queue_number}</span>
          <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Active Now</span>
        </div>

        <h3 style={{ margin: '0 0 2px', fontSize: '18px', fontWeight: 700, color: '#0b332c', fontFamily: 'Fraunces, serif' }}>{booking.doctor?.name}</h3>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{booking.doctor?.specialty}</p>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px', background: '#f8fafc', padding: '14px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px', fontWeight: 600 }}>Ahead of You</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0b332c' }}>{booking.patientsAhead} Patients</div>
          </div>
          <div style={{ borderLeft: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px', fontWeight: 600 }}>Est. Wait Time</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0b332c' }}>{estWaitMinutes} mins</div>
          </div>
        </div>
      </div>

      {/* Queue Timeline Card */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', marginBottom: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#0b332c', fontFamily: 'Fraunces, serif' }}>Queue Timeline</h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#0b332c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>✓</div>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '13.5px', fontWeight: 600, color: '#0b332c' }}>Booked</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Successfully registered in queue at token #{booking.queue_number}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: isCheckedIn ? '#0b332c' : '#e2e8f0', color: isCheckedIn ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>{isCheckedIn ? '✓' : '•'}</div>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '13.5px', fontWeight: 600, color: isCheckedIn ? '#0b332c' : '#94a3b8' }}>Checked In</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Clinic verified your presence in queue</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: isTurn ? '#0b332c' : '#e2e8f0', color: isTurn ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>{isTurn ? '✓' : '○'}</div>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '13.5px', fontWeight: 600, color: isTurn ? '#0b332c' : '#94a3b8' }}>Your Turn</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Enter doctor's chamber for consultation</p>
            </div>
          </div>

        </div>
      </div>

      {/* Cancel Ticket Button */}
      <button
        onClick={handleCancel}
        disabled={cancelling}
        style={{
          width: '100%',
          padding: '14px',
          background: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: '16px',
          color: '#dc2626',
          fontWeight: 600,
          fontSize: '14px',
          cursor: 'pointer',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(220, 38, 38, 0.05)'
        }}
      >
        {cancelling ? 'Cancelling...' : 'Cancel Ticket'}
      </button>

    </div>
  );
}
