import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './components/Login';
import HospitalFlow from './components/HospitalFlow';
import MyToken from './components/MyToken';
import './components/MyToken.css';

export default function App() {
  const [session, setSession] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user) ensurePatientRecord(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      setLoading(false);
      if (session?.user) ensurePatientRecord(session.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const ensurePatientRecord = async (user) => {
    const { data: existing } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existing) {
      const patientCode = 'MDQ-' + Math.floor(1000 + Math.random() * 9000);
      await supabase.from('patients').insert({
        user_id: user.id,
        name: user.email?.split('@')[0] || 'Patient',
        patient_code: patientCode,
      });
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 50 }}>Loading MediQ...</div>;

  if (!session && !isGuest) {
    return <Login onGuestContinue={() => setIsGuest(true)} />;
  }

  const handleLogout = () => {
    supabase.auth.signOut();
    setIsGuest(false);
    setActiveTab('home');
  };

  return (
    <>
      {activeTab === 'home' && (
        <HospitalFlow user={session?.user || null} isGuest={isGuest} onLogout={handleLogout} />
      )}
      {activeTab === 'token' && (
        <MyToken user={session?.user || null} />
      )}

      <div className="tabbar">
        <button
          className={`tabbar-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <span className="tabbar-icon">🏠</span>
          Home
        </button>
        <button
          className={`tabbar-item ${activeTab === 'token' ? 'active' : ''}`}
          onClick={() => setActiveTab('token')}
        >
          <span className="tabbar-icon">🎟️</span>
          My Token
        </button>
      </div>
    </>
  );
}