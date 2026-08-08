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
  const [patientProfile, setPatientProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user) loadPatientProfile(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      setLoading(false);
      if (session?.user) loadPatientProfile(session.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadPatientProfile = async (user) => {
    const { data: existing } = await supabase
      .from('patients')
      .select('name, city')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      setPatientProfile(existing);
    } else {
      const patientCode = 'MDQ-' + Math.floor(1000 + Math.random() * 9000);
      const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Patient';
      const userCity = user.user_metadata?.city || '';
      const { data: created } = await supabase
        .from('patients')
        .insert({
          user_id: user.id,
          name: fullName,
          patient_code: patientCode,
          city: userCity,
        })
        .select('name, city')
        .single();
      setPatientProfile(created);
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
    setPatientProfile(null);
  };

  const displayName = patientProfile?.name || session?.user?.email?.split('@')[0] || 'Guest';
  const initialCity = patientProfile?.city || '';

  return (
    <>
      {activeTab === 'home' && (
        <HospitalFlow
          user={session?.user || null}
          isGuest={isGuest}
          onLogout={handleLogout}
          displayName={displayName}
          initialCity={initialCity}
        />
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