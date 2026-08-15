import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './components/Login';
import HospitalFlow from './components/HospitalFlow';
import MyToken from './components/MyToken';
import Reports from './components/Reports';
import ClinicPortal from './components/ClinicPortal';
import './components/MyToken.css';

// Multi-language dictionary for bottom navigation & app shells
const translations = {
  en: {
    loading: 'Loading MediQ...',
    home: 'Home',
    reports: 'Reports',
    myToken: 'My Token',
    greeting: 'Good Morning,',
    guest: 'Guest',
    browsingAs: 'Browsing as',
    logout: 'Logout'
  },
  bn: {
    loading: 'মেডিക് লোড হচ্ছে...',
    home: 'হোম',
    reports: 'রিপোর্টস',
    myToken: 'আমার টোকেন',
    greeting: 'সুপ্রভাত,',
    guest: 'অতিথি',
    browsingAs: 'অতিথি হিসেবে দেখছেন',
    logout: 'লগআউট'
  },
  hi: {
    loading: 'मेडीक्यू लोड हो रहा है...',
    home: 'होम',
    reports: 'रिपोर्ट्स',
    myToken: 'मेरा टोकन',
    greeting: 'सुप्रभात,',
    guest: 'अतिथि',
    browsingAs: 'अतिथि के रूप में देख रहे हैं',
    logout: 'लॉग आउट'
  }
};

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('portal') === 'clinic') {
    return <ClinicPortal />;
  }

  const [session, setSession] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [patientProfile, setPatientProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  
  // Language state ('en', 'bn', or 'hi')
  const [lang, setLang] = useState(localStorage.getItem('mediq_lang') || 'en');

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('mediq_lang', newLang);
  };

  const t = translations[lang] || translations.en;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user) loadPatientProfile(session.user);
      else setProfileLoaded(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      setLoading(false);
      if (session?.user) loadPatientProfile(session.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadPatientProfile = async (user) => {
    const urlParams = new URLSearchParams(window.location.search);
    const pendingName = urlParams.get('name');
    const pendingCity = urlParams.get('city');
    const { data: existing } = await supabase
      .from('patients')
      .select('id, name, city')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      if (pendingName) {
        const { data: updated } = await supabase
          .from('patients')
          .update({ name: pendingName, city: pendingCity || existing.city })
          .eq('id', existing.id)
          .select('name, city')
          .single();
        setPatientProfile(updated);
        window.history.replaceState({}, '', window.location.pathname);
      } else {
        setPatientProfile(existing);
      }
    } else {
      const patientCode = 'MDQ-' + Math.floor(1000 + Math.random() * 9000);
      const fullName = pendingName || user.email?.split('@')[0] || 'Patient';
      const userCity = pendingCity || '';
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
      localStorage.removeItem('mediq_pending_name');
      localStorage.removeItem('mediq_pending_city');
    }
    setProfileLoaded(true);
  };

  if (loading || (session?.user && !profileLoaded)) {
    return <div style={{ textAlign: 'center', padding: 50 }}>{t.loading}</div>;
  }

  if (!session && !isGuest) {
    return <Login onGuestContinue={() => setIsGuest(true)} />;
  }

  const handleLogout = () => {
    supabase.auth.signOut();
    setIsGuest(false);
    setActiveTab('home');
    setPatientProfile(null);
    setProfileLoaded(false);
  };

  const displayName = patientProfile?.name || session?.user?.email?.split('@')[0] || t.guest;
  const initialCity = patientProfile?.city || '';

  return (
    <>
      {/* Global Language Selector Float or Top Bar Extension */}
      <div style={{ position: 'fixed', top: 12, right: 16, zIndex: 9999 }}>
        <select
          value={lang}
          onChange={(e) => changeLanguage(e.target.value)}
          style={{
            background: 'rgba(11, 51, 44, 0.85)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '4px 8px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(4px)'
          }}
        >
          <option value="en" style={{ color: '#000' }}>English</option>
          <option value="bn" style={{ color: '#000' }}>বাংলা (Bengali)</option>
          <option value="hi" style={{ color: '#000' }}>हिन्दी (Hindi)</option>
        </select>
      </div>

      {activeTab === 'home' && (
        <HospitalFlow
          user={session?.user || null}
          isGuest={isGuest}
          onLogout={handleLogout}
          displayName={displayName}
          initialCity={initialCity}
          lang={lang}
          t={t}
        />
      )}
      {activeTab === 'token' && (
        <MyToken user={session?.user || null} lang={lang} />
      )}
      {activeTab === 'reports' && (
        <Reports user={session?.user || null} lang={lang} />
      )}
      <nav className="tabbar">
        <button
          className={`tabbar-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <svg className="tabbar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          {t.home}
        </button>
        <button
          className={`tabbar-item ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <svg className="tabbar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          {t.reports}
        </button>
        <button
          className={`tabbar-item ${activeTab === 'token' ? 'active' : ''}`}
          onClick={() => setActiveTab('token')}
        >
          <svg className="tabbar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
            <line x1="13" y1="5" x2="13" y2="19" strokeDasharray="4 4" />
          </svg>
          {t.myToken}
        </button>
      </nav>
    </>
  );
}
