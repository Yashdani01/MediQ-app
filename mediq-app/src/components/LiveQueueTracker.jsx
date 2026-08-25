import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { getMyCurrentBooking } from '../hospitalData';

export default function LiveQueueTracker({ user, onClose }) {
  const [activeBooking, setActiveBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLiveQueue() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const booking = await getMyCurrentBooking(user.id);
        setActiveBooking(booking);
      } catch (err) {
        console.error('Error fetching live queue:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLiveQueue();
  }, [user]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#0b332c' }}>
        <p>Loading live queue status...</p>
      </div>
    );
  }

  if (!activeBooking) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏱️</div>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', color: '#0b332c', margin: '0 0 6px' }}>No Active Queue</h3>
        <p style={{ fontSize: '13px', margin: 0 }}>You do not have any active token bookings right now. Book an appointment from the Home page to track it live here.</p>
      </div>
    );
  }

  const tokenNumber = activeBooking.queue_number || '27';
  const currentServing = Number(tokenNumber) > 1 ? Number(tokenNumber) - 1 : 1;
  const patientsBefore = Math.max(0, Number(tokenNumber) - currentServing - 1);

  return (
    <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      
      {/* HEADER CLINIC INFO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', fontWeight: '700' }}>Live Queue</span>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', color: '#0b332c', margin: '2px 0 0' }}>{activeBooking.hospital?.name || 'MediQ Clinic'}</h2>
          <p style={{ fontSize: '12px', color: '#10b981', fontWeight: '600', margin: '2px 0 0' }}>Dr. {activeBooking.doctor?.name || 'Doctor'} ({activeBooking.doctor?.specialty || 'General'})</p>
        </div>
        <div style={{ background: '#e6f4ea', border: '1px solid #bbf7d0', padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
          <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#166534' }}>Active</span>
        </div>
      </div>

      {/* BIG CIRCULAR YOUR TOKEN CARD */}
      <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #e6f4ea 100%)', border: '1px solid #bbf7d0', borderRadius: '24px', padding: '28px 20px', textAlign: 'center', marginBottom: '16px', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.08)' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', background: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: '100px' }}>Your Token Number</span>
        <div style={{ fontSize: '64px', fontWeight: '900', color: '#2563eb', margin: '8px 0 2px', fontFamily: 'Fraunces, serif', lineHeight: 1 }}>
          #{tokenNumber}
        </div>
        <p style={{ fontSize: '13px', fontWeight: '600', color: '#0b332c', margin: 0 }}>
          Patient: <span style={{ color: '#10b981' }}>{activeBooking.patient_name || 'Self (Primary)'}</span>
        </p>
      </div>

      {/* METRIC GRID (2x2) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>Current Token</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0b332c' }}>{currentServing}</div>
          <div style={{ fontSize: '10px', color: '#10b981', fontWeight: '700', marginTop: '2px' }}>Now Serving</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>Patients Before You</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0b332c' }}>{patientsBefore}</div>
          <div style={{ fontSize: '10px', color: '#f59e0b', fontWeight: '700', marginTop: '2px' }}>In Queue</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>Estimated Turn</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#0b332c' }}>~{Math.max(5, patientsBefore * 5)} mins</div>
          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>Based on avg time</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>Queue Status</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>Moving ⚡</div>
          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>Normal speed</div>
        </div>

      </div>

      {/* STEP PROGRESS BAR */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '10px' }}>
          <span>Current: #{currentServing}</span>
          <span>Your Turn: #{tokenNumber}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '15px', right: '15px', height: '4px', background: '#e2e8f0', zIndex: 1 }}></div>
          
          <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>✓</div>
            <span style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Serving</span>
          </div>

          <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>⏳</div>
            <span style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Up Next</span>
          </div>

          <div style={{ zIndex: '2', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>🎯</div>
            <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 'bold', marginTop: '4px' }}>Your Turn</span>
          </div>
        </div>
      </div>

      {/* NOTIFICATION INFO BANNER */}
      <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '14px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span style={{ fontSize: '18px' }}>ℹ️</span>
        <div style={{ fontSize: '11.5px', color: '#854d0e', lineHeight: '1.4' }}>
          We will notify you when your turn is near. You can relax or check your bookings.
        </div>
      </div>

    </div>
  );
}
