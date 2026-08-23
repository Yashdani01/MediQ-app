import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

import Login from './components/Login';
import HospitalFlow from './components/HospitalFlow';
import MyBookings from './components/MyBookings';
import Reports from './components/Reports';
import SymptomTriage from './components/SymptomTriage';
import ClinicPortal from './components/ClinicPortal';

import './index.css';


const translations = {
  en: {
    loading: 'Loading MediQ...',
    home: 'Home',
    reports: 'Reports',
    myBookings: 'My Bookings',
    triage: 'Triage',
    greeting: 'Good Morning,',
    guest: 'Guest',
    browsingAs: 'Browsing as',
    logout: 'Logout',
    findCare: 'Find Care',
    healthAssistant: 'Health Assistant',
    language: 'Language',
  },
  bn: {
    loading: 'মেডিকিউ লোড হচ্ছে...',
    home: 'হোম',
    reports: 'রিপোর্টস',
    myBookings: 'আমার বুকিং',
    triage: 'পরামর্শ',
    greeting: 'সুপ্রভাত,',
    guest: 'অতিথি',
    browsingAs: 'অতিথি হিসেবে দেখছেন',
    logout: 'লগআউট',
    findCare: 'ডাক্তার খুঁজুন',
    healthAssistant: 'স্বাস্থ্য সহায়ক',
    language: 'ভাষা',
  },
  hi: {
    loading: 'मेडीक्यू लोड हो रहा है...',
    home: 'होम',
    reports: 'रिपोर्ट्स',
    myBookings: 'मेरी बुकिंग',
    triage: 'सलाह',
    greeting: 'सुप्रभात,',
    guest: 'अतिथि',
    browsingAs: 'अतिथि के रूप में देख रहे हैं',
    logout: 'लॉग आउट',
    findCare: 'डॉक्टर खोजें',
    healthAssistant: 'स्वास्थ्य सहायक',
    language: 'भाषा',
  },
};


/* =========================
   ICON COMPONENT
========================= */

function AppIcon({ type, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.9',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  const icons = {
    home: (
      <>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5.5 9.5V21h13V9.5" />
        <path d="M9.5 21v-6h5v6" />
      </>
    ),
    triage: (
      <>
        <path d="M3 12h4l2.5-7 5 14 2.5-7H21" />
      </>
    ),
    reports: (
      <>
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <path d="M14 3v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </>
    ),
    bookings: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <path d="M3 10h18" />
        <path d="M8 15h.01" />
        <path d="M12 15h.01" />
        <path d="M16 15h.01" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3c2.2 2.5 3.3 5.5 3.3 9S14.2 18.5 12 21" />
        <path d="M12 3C9.8 5.5 8.7 8.5 8.7 12s1.1 6.5 3.3 9" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M21 19V5a2 2 0 0 0-2-2h-5" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),
    close: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    ),
    family: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    sos: (
      <>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </>
    ),
    history: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </>
    ),
  };

  return <svg {...common}>{icons[type]}</svg>;
}


/* =========================
   APP
========================= */

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

  const [lang, setLang] = useState(
    localStorage.getItem('mediq_lang') || 'en'
  );

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Interactive Popup Modal States
  const [activeModal, setActiveModal] = useState(null); // 'family' | 'symptom' | 'sos' | null

  // Feature Data States
  const [familyMembers, setFamilyMembers] = useState([
    { id: 1, name: 'Self (Primary)', relation: 'Self' }
  ]);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyRelation, setNewFamilyRelation] = useState('Parent');

  const [symptomLogs] = useState([
    { date: 'Today', text: 'Fever & Headache -> General Physician' },
    { date: 'Recent', text: 'Joint pain -> Orthopedic' }
  ]);

  const [doctorAlerts] = useState([]);


  /* =========================
     LANGUAGE
  ========================= */

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('mediq_lang', newLang);
  };

  const t = translations[lang] || translations.en;


  /* =========================
     AUTH SESSION
  ========================= */

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);

      if (session?.user) {
        loadPatientProfile(session.user);
      } else {
        setProfileLoaded(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);

      if (session?.user) {
        loadPatientProfile(session.user);
      } else {
        setProfileLoaded(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);


  /* =========================
     PATIENT PROFILE
  ========================= */

  const loadPatientProfile = async (user) => {
    const params = new URLSearchParams(window.location.search);

    const pendingName = params.get('name');
    const pendingCity = params.get('city');

    const { data: existing } = await supabase
      .from('patients')
      .select('id, name, city')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      if (pendingName) {
        const { data: updated } = await supabase
          .from('patients')
          .update({
            name: pendingName,
            city: pendingCity || existing.city,
          })
          .eq('id', existing.id)
          .select('name, city')
          .single();

        setPatientProfile(updated);

        window.history.replaceState(
          {},
          '',
          window.location.pathname
        );
      } else {
        setPatientProfile(existing);
      }
    } else {
      const patientCode =
        'MDQ-' + Math.floor(1000 + Math.random() * 9000);

      const fullName =
        pendingName ||
        user.email?.split('@')[0] ||
        'Patient';

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


  /* =========================
     LOADING
  ========================= */

  if (loading || (session?.user && !profileLoaded)) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-logo">
          Medi<span>Q</span>.
        </div>

        <div className="app-loading-spinner" />

        <p>{t.loading}</p>
      </div>
    );
  }


  /* =========================
     LOGIN
  ========================= */

  if (!session && !isGuest) {
    return (
      <Login
        onGuestContinue={() => setIsGuest(true)}
      />
    );
  }


  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = async () => {
    setSidebarOpen(false);

    await supabase.auth.signOut();

    setIsGuest(false);
    setActiveTab('home');
    setPatientProfile(null);
    setProfileLoaded(false);
  };


  /* =========================
     USER INFO
  ========================= */

  const displayName =
    patientProfile?.name ||
    session?.user?.email?.split('@')[0] ||
    t.guest;

  const initialCity =
    patientProfile?.city || '';

  const userInitial =
    displayName?.charAt(0)?.toUpperCase() || 'G';


  /* =========================
     NAVIGATION (MOBILE BOTTOM BAR)
  ========================= */

  const navigationItems = [
    {
      id: 'home',
      label: t.home,
      icon: 'home',
    },
    {
      id: 'triage',
      label: t.triage,
      icon: 'triage',
    },
    {
      id: 'reports',
      label: t.reports,
      icon: 'reports',
    },
    {
      id: 'bookings',
      label: t.myBookings,
      icon: 'bookings',
    },
  ];


  const handleNavigation = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };


  /* =========================
     PAGE TITLES
  ========================= */

  const pageTitles = {
    home: t.home,
    triage: t.triage,
    reports: t.reports,
    bookings: t.myBookings,
  };


  return (
    <div className="mediq-app">

      {/* MOBILE HEADER */}

      <header className="mobile-app-header">
        <button
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <AppIcon type="menu" />
        </button>

        <div className="mobile-brand">
          Medi<span>Q</span>.
        </div>

        <div className="mobile-user-avatar">
          {userInitial}
        </div>
      </header>


      {/* MOBILE SIDEBAR OVERLAY */}

      <div
        className={`sidebar-overlay ${
          sidebarOpen ? 'show' : ''
        }`}
        onClick={() => setSidebarOpen(false)}
      />


      {/* SIDEBAR (UTILITY COMMAND CENTER) */}

      <aside
        className={`app-sidebar ${
          sidebarOpen ? 'open' : ''
        }`}
      >
        <div className="sidebar-top">

          <div className="sidebar-brand-row">
            <div className="sidebar-brand">
              Medi<span>Q</span>.
            </div>

            <button
              className="sidebar-close-btn"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <AppIcon type="close" />
            </button>
          </div>


          {/* USER CARD */}

          <div className="sidebar-user-card">
            <div className="sidebar-avatar">
              {userInitial}
            </div>

            <div className="sidebar-user-info">
              <span className="sidebar-user-label">
                {isGuest ? t.browsingAs : 'Welcome back'}
              </span>

              <strong>
                {displayName}
              </strong>
            </div>
          </div>


          {/* INTERACTIVE UTILITY CARDS (CLICKABLE MODALS) */}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

            {/* 1. CARE CIRCLE CARD */}
            <div 
              onClick={() => setActiveModal('family')}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: '10px 12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.2s' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <span style={{ color: 'var(--gold)' }}><AppIcon type="family" size={17} /></span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>Care Circle</div>
                  <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.5)' }}>{familyMembers.length} member(s) added</div>
                </div>
              </div>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>→</span>
            </div>

            {/* 2. SYMPTOM LOG CARD */}
            <div 
              onClick={() => setActiveModal('symptom')}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: '10px 12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.2s' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <span style={{ color: 'var(--gold)' }}><AppIcon type="history" size={17} /></span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>Symptom History</div>
                  <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.5)' }}>{symptomLogs.length} recent logs</div>
                </div>
              </div>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>→</span>
            </div>

            {/* 3. DOCTOR ALERTS CARD */}
            <div 
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: '10px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <span style={{ color: 'var(--gold)' }}><AppIcon type="bell" size={17} /></span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>Doctor Status</div>
                  <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.5)' }}>{doctorAlerts.length > 0 ? `${doctorAlerts.length} tracking` : 'No active bookings'}</div>
                </div>
              </div>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: doctorAlerts.length > 0 ? '#4ade80' : 'rgba(255,255,255,0.3)' }}></span>
            </div>

            {/* 4. EMERGENCY SOS CARD */}
            <div 
              onClick={() => setActiveModal('sos')}
              style={{ background: 'rgba(195, 79, 61, 0.12)', border: '1px solid rgba(195, 79, 61, 0.25)', padding: '10px 12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <span style={{ color: '#ffd8d2' }}><AppIcon type="sos" size={17} /></span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#ffd8d2' }}>Emergency & SOS</div>
                  <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.6)' }}>Ambulance & Services</div>
                </div>
              </div>
              <span style={{ fontSize: '12px', color: '#ffd8d2' }}>→</span>
            </div>

          </div>

        </div>


        {/* SIDEBAR FOOTER */}

        <div className="sidebar-footer">

          <div className="language-selector">
            <div className="language-selector-icon">
              <AppIcon type="globe" size={17} />
            </div>

            <select
              value={lang}
              onChange={(e) =>
                changeLanguage(e.target.value)
              }
            >
              <option value="en">
                English
              </option>

              <option value="bn">
                বাংলা
              </option>

              <option value="hi">
                हिन्दी
              </option>
            </select>
          </div>


          <button
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <AppIcon type="logout" size={18} />

            <span>
              {t.logout}
            </span>
          </button>
        </div>
      </aside>


      {/* INTERACTIVE POPUP MODALS */}

      {activeModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(6, 43, 37, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--white)', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative' }}>
            
            {/* CLOSE BUTTON */}
            <button 
              onClick={() => setActiveModal(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--sand-100)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink)' }}
            >
              ✕
            </button>

            {/* MODAL 1: CARE CIRCLE */}
            {activeModal === 'family' && (
              <div>
                <h3 style={{ margin: '0 0 4px', fontFamily: 'Fraunces, serif', fontSize: '20px', color: 'var(--teal-900)' }}>Care Circle</h3>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--ink-soft)' }}>Manage healthcare profiles for your household.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {familyMembers.map((m) => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--sand-50)', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--line)' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink)' }}>{m.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--teal-700)', fontWeight: '700', background: 'var(--sand-200)', padding: '2px 8px', borderRadius: '6px' }}>{m.relation || 'Member'}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Enter family member name" 
                    value={newFamilyName}
                    onChange={(e) => setNewFamilyName(e.target.value)}
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', fontSize: '13px', outline: 'none' }}
                  />
                  <select 
                    value={newFamilyRelation}
                    onChange={(e) => setNewFamilyRelation(e.target.value)}
                    style={{ padding: '10px', borderRadius: '12px', border: '1px solid var(--line)', fontSize: '12px', background: 'var(--white)' }}
                  >
                    <option value="Parent">Parent</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                  </select>
                </div>
                <button 
                  onClick={() => {
                    if (newFamilyName.trim()) {
                      setFamilyMembers([...familyMembers, { id: Date.now(), name: newFamilyName, relation: newFamilyRelation }]);
                      setNewFamilyName('');
                    }
                  }}
                  style={{ width: '100%', marginTop: '10px', background: 'var(--teal-900)', color: '#fff', border: 'none', padding: '11px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Add Family Member
                </button>
              </div>
            )}

            {/* MODAL 2: SYMPTOM HISTORY LOG */}
            {activeModal === 'symptom' && (
              <div>
                <h3 style={{ margin: '0 0 4px', fontFamily: 'Fraunces, serif', fontSize: '20px', color: 'var(--teal-900)' }}>Symptom History</h3>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--ink-soft)' }}>Chronological log of your recent triage sessions.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                  {symptomLogs.map((log, idx) => (
                    <div key={idx} style={{ background: 'var(--sand-50)', padding: '12px', borderRadius: '12px', border: '1px solid var(--line)' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--gold)', marginBottom: '2px' }}>{log.date}</div>
                      <div style={{ fontSize: '13px', color: 'var(--ink)', fontWeight: '600' }}>{log.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MODAL 3: EMERGENCY SOS & AMBULANCE */}
            {activeModal === 'sos' && (
              <div>
                <h3 style={{ margin: '0 0 4px', fontFamily: 'Fraunces, serif', fontSize: '20px', color: '#c34f3d' }}>Emergency & SOS Hub</h3>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--ink-soft)' }}>Tap any emergency service below to instantly invoke your phone dialer:</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <a href="tel:102" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fbe8e4', border: '1px solid #fca5a5', padding: '14px', borderRadius: '14px', textDecoration: 'none', color: '#c34f3d', fontWeight: '700', fontSize: '14px' }}>
                    <span>🚑 National Ambulance</span>
                    <span>102 →</span>
                  </a>
                  <a href="tel:112" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fbe8e4', border: '1px solid #fca5a5', padding: '14px', borderRadius: '14px', textDecoration: 'none', color: '#c34f3d', fontWeight: '700', fontSize: '14px' }}>
                    <span>🚨 Emergency Response (ERSS)</span>
                    <span>112 →</span>
                  </a>
                  <a href="tel:101" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fbe8e4', border: '1px solid #fca5a5', padding: '14px', borderRadius: '14px', textDecoration: 'none', color: '#c34f3d', fontWeight: '700', fontSize: '14px' }}>
                    <span>🚒 Fire Department</span>
                    <span>101 →</span>
                  </a>
                </div>
              </div>
            )}

          </div>
        </div>
      )}


      {/* MAIN APPLICATION */}

      <div className="app-main">

        {/* DESKTOP HEADER */}

        <header className="desktop-app-header">

          <div className="desktop-page-info">
            <span className="desktop-page-eyebrow">
              MediQ Patient Portal
            </span>

            <h1>
              {pageTitles[activeTab]}
            </h1>
          </div>


          <div className="desktop-header-actions">

            <div className="desktop-language">
              <AppIcon type="globe" size={17} />

              <select
                value={lang}
                onChange={(e) =>
                  changeLanguage(e.target.value)
                }
              >
                <option value="en">
                  English
                </option>

                <option value="bn">
                  বাংলা
                </option>

                <option value="hi">
                  हिन्दी
                </option>
              </select>
            </div>


            <div className="desktop-profile">
              <div className="desktop-profile-avatar">
                {userInitial}
              </div>

              <div className="desktop-profile-info">
                <strong>
                  {displayName}
                </strong>

                <span>
                  {isGuest
                    ? 'Guest access'
                    : 'Patient'}
                </span>
              </div>
            </div>

          </div>
        </header>


        {/* PAGE CONTENT */}

        <main className="app-content">

          {/* HOME */}

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


          {/* TRIAGE */}

          {activeTab === 'triage' && (
            <SymptomTriage
              onClose={() =>
                handleNavigation('home')
              }
              onSelectSpecialty={() => {
                handleNavigation('home');
              }}
            />
          )}


          {/* REPORTS */}

          {activeTab === 'reports' && (
            <Reports
              user={session?.user || null}
              lang={lang}
            />
          )}


          {/* BOOKINGS */}

          {activeTab === 'bookings' && (
            <MyBookings />
          )}

        </main>
      </div>


      {/* MOBILE BOTTOM NAV */}

      <nav className="mobile-bottom-nav">

        {navigationItems.map((item) => (
          <button
            key={item.id}
            className={
              activeTab === item.id
                ? 'active'
                : ''
            }
            onClick={() =>
              handleNavigation(item.id)
            }
          >
            <span className="mobile-nav-icon">
              <AppIcon
                type={item.icon}
                size={21}
              />
            </span>

            <span>
              {item.label}
            </span>
          </button>
        ))}

      </nav>

    </div>
  );
}
