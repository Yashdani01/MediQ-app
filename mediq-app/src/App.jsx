import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

import Login from './components/Login';
import HospitalFlow from './components/HospitalFlow';
import MyToken from './components/MyToken';
import MyBookings from './components/MyBookings';
import Reports from './components/Reports';
import SymptomTriage from './components/SymptomTriage';
import ClinicPortal from './components/ClinicPortal';

import './index.css';
import './components/MyToken.css';


const translations = {
  en: {
    loading: 'Loading MediQ...',
    home: 'Home',
    reports: 'Reports',
    myToken: 'My Token',
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
    myToken: 'আমার টোকেন',
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
    myToken: 'मेरा टोकन',
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

function AppIcon({ type, size = 20 }) {
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

    token: (
      <>
        <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H18.5A2.5 2.5 0 0 1 21 8.5v1.2a2.5 2.5 0 0 0 0 4.6v1.2a2.5 2.5 0 0 1-2.5 2.5H5.5A2.5 2.5 0 0 1 3 15.5v-1.2a2.5 2.5 0 0 0 0-4.6z" />
        <path d="M13 6v12" strokeDasharray="3 3" />
      </>
    ),

    bookings: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4" />
        <path d="M8 3v4" />
        <path d="M3 10h18" />
        <path d="M8 14h3" />
        <path d="M8 17h6" />
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

    chevron: (
      <>
        <path d="m9 18 6-6-6-6" />
      </>
    ),
  };

  return <svg {...common}>{icons[type]}</svg>;
}


/* =========================
   APP SHELL
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
     NAVIGATION
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
      id: 'bookings',
      label: t.myBookings,
      icon: 'bookings',
    },
    {
      id: 'reports',
      label: t.reports,
      icon: 'reports',
    },
    {
      id: 'token',
      label: t.myToken,
      icon: 'token',
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
    bookings: t.myBookings,
    reports: t.reports,
    token: t.myToken,
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


      {/* SIDEBAR */}

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


          {/* NAVIGATION */}

          <nav className="sidebar-nav">
            <span className="sidebar-nav-label">
              Navigation
            </span>

            {navigationItems.map((item) => (
              <button
                key={item.id}
                className={`sidebar-nav-item ${
                  activeTab === item.id
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  handleNavigation(item.id)
                }
              >
                <span className="sidebar-nav-icon">
                  <AppIcon type={item.icon} />
                </span>

                <span>
                  {item.label}
                </span>

                {activeTab === item.id && (
                  <span className="sidebar-active-dot" />
                )}
              </button>
            ))}
          </nav>
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
              <option value="en">English</option>
              <option value="bn">বাংলা</option>
              <option value="hi">हिन्दी</option>
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
                <option value="en">English</option>
                <option value="bn">বাংলা</option>
                <option value="hi">हिन्दी</option>
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

          {activeTab === 'home' && (
            <HospitalFlow
              user={session?.user || null}
              isGuest={isGuest}
              onLogout={handleLogout}
              displayName={displayName}
              initialCity={initialCity}
              lang={lang}
              t={t}
              externalSpecialtyFilter={null}
            />
          )}


          {activeTab === 'triage' && (
            <div className="app-triage-page">

              <HospitalFlow
                user={session?.user || null}
                isGuest={isGuest}
                onLogout={handleLogout}
                displayName={displayName}
                initialCity={initialCity}
                lang={lang}
                t={t}
              />

              <SymptomTriage
                onClose={() =>
                  handleNavigation('home')
                }
                onSelectSpecialty={() => {
                  handleNavigation('home');
                }}
              />

            </div>
          )}


          {/* MY BOOKINGS */}

          {activeTab === 'bookings' && (
            <MyBookings
              user={session?.user || null}
              lang={lang}
            />
          )}


          {activeTab === 'reports' && (
            <Reports
              user={session?.user || null}
              lang={lang}
            />
          )}


          {activeTab === 'token' && (
            <MyToken
              user={session?.user || null}
              lang={lang}
            />
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
