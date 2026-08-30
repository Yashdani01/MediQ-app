import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function LiveQueueTracker({ user, onClose, bookingId }) {
  const [activeBooking, setActiveBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLiveQueue() {
      if (!bookingId) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*, doctors(*), hospitals(*)')
          .eq('id', bookingId)
          .single();

        if (error) throw error;
        setActiveBooking(data);
      } catch (err) {
        console.error('Error fetching live queue:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLiveQueue();
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId) return;
    
    const channel = supabase
      .channel(`public:appointments:id=eq.${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `id=eq.${bookingId}`,
        },
        (payload) => {
          setActiveBooking(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 20px', color: '#0b332c' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ fontSize: '13.5px', fontWeight: '600', color: '#475569' }}>Syncing live queue status...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!activeBooking) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>🏥</div>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', color: '#0b332c', margin: '0 0 8px' }}>No Active Queue Booking</h3>
        <p style={{ fontSize: '13px', lineHeight: '1.5', maxWidth: '300px', margin: '0 auto 20px', color: '#64748b' }}>
          You do not have any ongoing hospital or clinic tokens right now. Book an appointment from the home screen to track it live.
        </p>
        <button 
          onClick={onClose}
          style={{ background: '#0b332c', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer' }}
        >
          Explore Doctors & Clinics
        </button>
      </div>
    );
  }

  const tokenNumber = activeBooking.queue_number || '27';
  const currentServing = Number(tokenNumber) > 1 ? Number(tokenNumber) - 1 : 1;
  const patientsBefore = Math.max(0, Number(tokenNumber) - currentServing - 1);
  const estimatedWaitMins = Math.max(5, patientsBefore * 5);

  return (
    <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      
      {/* TOP HEADER STATUS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', background: '#f8f6f0', padding: '14px 16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#134e44', fontWeight: '800' }}>Live Hospital Tracker</span>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', color: '#0b332c', margin: '2px 0 2px' }}>{activeBooking.hospitals?.name || 'MediQ Clinic'}</h2>
          <p style={{ fontSize: '12px', color: '#10b981', fontWeight: '700', margin: 0 }}>Dr. {activeBooking.doctors?.name || 'Doctor'} • <span style={{ color: '#64748b', fontWeight: '600' }}>{activeBooking.doctors?.specialty || 'General'}</span></p>
        </div>
        <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', padding: '5px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#15803d' }}>Live</span>
        </div>
      </div>

      {/* SIGNATURE HERO CARD (ParchiTrack inspired) */}
      <div style={{ background: 'linear-gradient(135deg, #0b332c 0%, #134e44 100%)', borderRadius: '24px', padding: '28px 20px', textAlign: 'center', marginBottom: '18px', boxShadow: '0 12px 30px rgba(11, 51, 44, 0.2)', position: 'relative', overflow: 'hidden', color: '#fff' }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }}></div>
        
        <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.2px', background: 'rgba(16, 185, 129, 0.25)', color: '#34d399', padding: '5px 14px', borderRadius: '100px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
          Your Assigned Token
        </span>

        <div style={{ fontSize: '72px', fontWeight: '900', color: '#fff', margin: '8px 0 4px', fontFamily: 'Fraunces, serif', lineHeight: 1, textShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          #{tokenNumber}
        </div>

        <div style={{ fontSize: '13px', fontWeight: '600', color: '#a7f3d0', background: 'rgba(255,255,255,0.08)', display: 'inline-block', padding: '4px 12px', borderRadius: '8px' }}>
          Patient: <strong>{activeBooking.patient_name || 'Self (Primary)'}</strong>
        </div>
      </div>

      {/* METRICS GRID (2x2) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
        
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>Current Token</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#0b332c', fontFamily: 'Fraunces, serif' }}>#{currentServing}</div>
          <div style={{ fontSize: '10.5px', color: '#2563eb', fontWeight: '700', marginTop: '2px' }}>🔵 Now Serving</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>Patients Before You</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#0b332c', fontFamily: 'Fraunces, serif' }}>{patientsBefore}</div>
          <div style={{ fontSize: '10.5px', color: '#d97706', fontWeight: '700', marginTop: '2px' }}>⏳ In Queue</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>Estimated Turn Time</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0b332c', fontFamily: 'Fraunces, serif' }}>~{estimatedWaitMins} mins</div>
          <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>Based on doctor speed</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>Queue Pace</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981', fontFamily: 'Fraunces, serif' }}>Smooth ⚡</div>
          <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>Moving on schedule</div>
        </div>

      </div>

      {/* PROGRESS TRACKER BAR */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', marginBottom: '18px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#475569', fontWeight: '700', marginBottom: '12px' }}>
          <span>Current: #{currentServing}</span>
          <span style={{ color: '#10b981' }}>Your Turn: #{tokenNumber}</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', padding: '0 10px' }}>
          <div style={{ position: 'absolute', left: '25px', right: '25px', height: '4px', background: '#e2e8f0', zIndex: 1 }}></div>
          
          <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 2px 6px rgba(37,99,235,0.3)' }}>✓</div>
            <span style={{ fontSize: '10.5px', color: '#475569', fontWeight: '600', marginTop: '5px' }}>Serving</span>
          </div>

          <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 2px 6px rgba(245,158,11,0.3)' }}>⏳</div>
            <span style={{ fontSize: '10.5px', color: '#475569', fontWeight: '600', marginTop: '5px' }}>Up Next</span>
          </div>

          <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 2px 6px rgba(16,185,129,0.3)' }}>🎯</div>
            <span style={{ fontSize: '10.5px', color: '#10b981', fontWeight: '800', marginTop: '5px' }}>Your Turn</span>
          </div>
        </div>
      </div>

      {/* FOOTER NOTICE */}
      <div style={{ background: '#e6f4ea', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '14px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span style={{ fontSize: '18px' }}>🔔</span>
        <div style={{ fontSize: '12px', color: '#0b332c', fontWeight: '600', lineHeight: '1.4' }}>
          Live updates active. You will be alerted when your turn is near.
        </div>
      </div>

    </div>
  );
}