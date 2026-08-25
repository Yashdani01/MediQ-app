import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

import Login from './components/Login';
import HospitalFlow from './components/HospitalFlow';
import MyBookings from './components/MyBookings';
import Reports from './components/Reports';
import SymptomTriage from './components/SymptomTriage';
import ClinicPortal from './components/ClinicPortal';
import PhysioGuideModal from './components/PhysioGuideModal';

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
    symptomsTitle: 'Know Your Symptoms',
    symptomsSubtitle: 'Detailed guide on common health signs and required medical specialists.',
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
    symptomsTitle: 'আপনার লক্ষণ জানুন',
    symptomsSubtitle: 'সাধারণ স্বাস্থ্য লক্ষণ এবং প্রয়োজনীয় চিকিৎসকের বিশদ নির্দেশিকা।',
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
    symptomsTitle: 'अपने लक्षण जानें',
    symptomsSubtitle: 'सामान्य स्वास्थ्य संकेतों और आवश्यक चिकित्सा विशेषज्ञों पर विस्तृत मार्गदर्शिका।',
  },
};

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
    triage: <path d="M3 12h4l2.5-7 5 14 2.5-7H21" />,
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
    queue: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  };

  return <svg {...common}>{icons[type]}</svg>;
}

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
  const [lang, setLang] = useState(localStorage.getItem('mediq_lang') || 'en');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  // Care Circle Database States
  const [familyMembers, setFamilyMembers] = useState([]);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyRelation, setNewFamilyRelation] = useState('Spouse');

  const [activeQueueToken, setActiveQueueToken] = useState(null);

  const t = translations[lang] || translations.en;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user) {
        loadPatientProfile(session.user);
        fetchActiveQueue(session.user.id);
        fetchCareCircle(session.user.id);
      } else {
        setProfileLoaded(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      if (session?.user) {
        loadPatientProfile(session.user);
        fetchActiveQueue(session.user.id);
        fetchCareCircle(session.user.id);
      } else {
        setProfileLoaded(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchActiveQueue(userId) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('queue_number, token_number, status, doctors(name), hospitals(name)')
        .eq('patient_id', userId)
        .in('status', ['waiting', 'checked_in'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setActiveQueueToken({
          number: data.token_number || data.queue_number || 1,
          doctorName: data.doctors?.name || 'Doctor',
          hospitalName: data.hospitals?.name || 'Clinic'
        });
      } else {
        setActiveQueueToken(null);
      }
    } catch (err) {
      console.error('Error fetching active queue:', err);
    }
  }

  async function fetchCareCircle(userId) {
    try {
      const { data, error } = await supabase
        .from('care_circle')
        .select('*')
        .eq('user_id', userId);

      if (!error && data) {
        setFamilyMembers(data);
      }
    } catch (err) {
      console.error('Error fetching care circle:', err);
    }
  }

  async function handleAddFamilyMember() {
    if (!newFamilyName.trim() || !session?.user) return;

    if (familyMembers.length >= 3) {
      alert('You can add a maximum of 3 family members to your Care Circle.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('care_circle')
        .insert({
          user_id: session.user.id,
          name: newFamilyName.trim(),
          relation: newFamilyRelation,
        })
        .select()
        .single();

      if (error) throw error;

      setFamilyMembers((prev) => [...prev, data]);
      setNewFamilyName('');
    } catch (err) {
      console.error('Error adding family member:', err);
      alert('Failed to save family member.');
    }
  }

  async function handleDeleteFamilyMember(memberId) {
    try {
      const { error } = await supabase
        .from('care_circle')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setFamilyMembers((prev) => prev.filter(m => m.id !== memberId));
    } catch (err) {
      console.error('Error deleting family member:', err);
      alert('Failed to delete member.');
    }
  }

  const loadPatientProfile = async (user) => {
    const { data: existing } = await supabase
      .from('patients')
      .select('id, name, city')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      setPatientProfile(existing);
    } else {
      const patientCode = 'MDQ-' + Math.floor(1000 + Math.random() * 9000);
      const fullName = user.email?.split('@')[0] || 'Patient';
      const { data: created } = await supabase
        .from('patients')
        .insert({ user_id: user.id, name: fullName, patient_code: patientCode, city: '' })
        .select('name, city')
        .single();
      setPatientProfile(created);
    }
    setProfileLoaded(true);
  };

  if (loading || (session?.user && !profileLoaded)) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-logo">Medi<span>Q</span>.</div>
        <div className="app-loading-spinner" />
        <p>{t.loading}</p>
      </div>
    );
  }

  if (!session && !isGuest) {
    return <Login onGuestContinue={() => setIsGuest(true)} />;
  }

  const handleLogout = async () => {
    setSidebarOpen(false);
    await supabase.auth.signOut();
    setIsGuest(false);
    setActiveTab('home');
    setPatientProfile(null);
    setProfileLoaded(false);
  };

  const displayName = patientProfile?.name || session?.user?.email?.split('@')[0] || t.guest;
  const userInitial = displayName?.charAt(0)?.toUpperCase() || 'G';

  const navigationItems = [
    { id: 'home', label: t.home, icon: 'home' },
    { id: 'triage', label: t.triage, icon: 'triage' },
    { id: 'reports', label: t.reports, icon: 'reports' },
    { id: 'bookings', label: t.myBookings, icon: 'bookings' },
  ];

  const handleNavigation = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageTitles = { home: t.home, triage: t.triage, reports: t.reports, bookings: t.myBookings };

  return (
    <div className="mediq-app">
      <header className="mobile-app-header">
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          <AppIcon type="menu" />
        </button>
        <div className="mobile-brand">Medi<span>Q</span>.</div>
        <div className="mobile-user-avatar">{userInitial}</div>
      </header>

      <div className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand-row">
            <div className="sidebar-brand">Medi<span>Q</span>.</div>
            <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
              <AppIcon type="close" />
            </button>
          </div>

          <div className="sidebar-user-card">
            <div className="sidebar-avatar">{userInitial}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-label">{isGuest ? t.browsingAs : 'Welcome back'}</span>
              <strong>{displayName}</strong>
            </div>
          </div>

          <nav className="sidebar-nav desktop-only-nav" style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="sidebar-nav-label">Navigation</span>
            {navigationItems.map((item) => (
              <button
                key={item.id}
                className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleNavigation(item.id)}
              >
                <span className="sidebar-nav-icon"><AppIcon type={item.icon} /></span>
                <span>{item.label}</span>
                {activeTab === item.id && <span className="sidebar-active-dot" />}
              </button>
            ))}
          </nav>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div onClick={() => setActiveModal('family')} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: '10px 12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <span style={{ color: 'var(--gold)' }}><AppIcon type="family" size={17} /></span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>Care Circle</div>
                  <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.5)' }}>{familyMembers.length} member(s) added</div>
                </div>
              </div>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>→</span>
            </div>

            <div onClick={() => setActiveModal('queue')} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: '10px 12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <span style={{ color: 'var(--gold)' }}><AppIcon type="queue" size={17} /></span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>Live Queue Tracker</div>
                  <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.5)' }}>{activeQueueToken ? `Token #${activeQueueToken.number}` : 'No active booking'}</div>
                </div>
              </div>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeQueueToken ? '#4ade80' : 'rgba(255,255,255,0.3)' }}></span>
            </div>

            <div onClick={() => setActiveModal('support')} style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '10px 12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <span style={{ color: '#6ee7b7' }}>🎧</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#6ee7b7' }}>Need Help? (Support)</div>
                  <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.6)' }}>WhatsApp & Email Helpdesk</div>
                </div>
              </div>
              <span style={{ fontSize: '12px', color: '#6ee7b7' }}>→</span>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={handleLogout}>
            <AppIcon type="logout" size={18} />
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* MODALS */}
      {activeModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(6, 43, 37, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative' }}>
            <button onClick={() => setActiveModal(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>✕</button>

            {activeModal === 'family' && (
              <div>
                <h3 style={{ margin: '0 0 4px', fontFamily: 'Fraunces, serif', fontSize: '20px', color: '#0b332c' }}>Care Circle</h3>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>Add household members (max 3) so you can assign appointments to them during checkout.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', maxHeight: '180px', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f6f0', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#0b332c' }}>{displayName} (Self)</span>
                    <span style={{ fontSize: '11px', color: '#134e44', fontWeight: '700', background: '#e6f4ea', padding: '2px 8px', borderRadius: '6px' }}>Primary</span>
                  </div>

                  {familyMembers.map((m) => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f6f0', padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#0b332c', display: 'block' }}>{m.name}</span>
                        <span style={{ fontSize: '11px', color: '#134e44', fontWeight: '700' }}>{m.relation}</span>
                      </div>
                      <button onClick={() => handleDeleteFamilyMember(m.id)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Delete ✕</button>
                    </div>
                  ))}
                </div>

                {familyMembers.length < 3 ? (
                  <div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input type="text" placeholder="Family member name" value={newFamilyName} onChange={(e) => setNewFamilyName(e.target.value)} style={{ flex: 1, padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                      <select value={newFamilyRelation} onChange={(e) => setNewFamilyRelation(e.target.value)} style={{ padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                        <option value="Spouse">Spouse</option>
                        <option value="Parent">Parent</option>
                        <option value="Child">Child</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <button onClick={handleAddFamilyMember} style={{ width: '100%', background: '#0b332c', color: '#fff', border: 'none', padding: '11px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Add Family Member ({familyMembers.length}/3)</button>
                  </div>
                ) : (
                  <p style={{ fontSize: '12px', color: '#d97706', textAlign: 'center', fontWeight: '600' }}>Maximum limit of 3 family members reached.</p>
                )}
              </div>
            )}

            {activeModal === 'queue' && (
              <div>
                <h3 style={{ margin: '0 0 4px', fontFamily: 'Fraunces, serif', fontSize: '20px', color: '#0b332c' }}>Live Queue Tracker</h3>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>Monitor your active hospital consultation tokens in real-time.</p>
                {activeQueueToken ? (
                  <div style={{ background: '#f8f6f0', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#10b981', textTransform: 'uppercase' }}>Active Token #{activeQueueToken.number}</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#0b332c', margin: '6px 0' }}>Dr. {activeQueueToken.doctorName}</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>{activeQueueToken.hospitalName}</div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b', fontSize: '13px' }}>You do not have any active queue bookings right now.</div>
                )}
              </div>
            )}

            {activeModal === 'support' && (
              <div>
                <h3 style={{ margin: '0 0 6px', fontFamily: 'Fraunces, serif', fontSize: '19px', color: '#0b332c' }}>MediQ Helpdesk</h3>
                <p style={{ margin: '0 0 20px', fontSize: '12.5px', color: '#64748b' }}>Choose your preferred channel to connect with our support team:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  <a href="https://wa.me/918585058779?text=Hello%20MediQ%20Support,%20I%20need%20assistance." target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px 16px', borderRadius: '14px', textDecoration: 'none', color: '#166534', fontWeight: '700', fontSize: '13.5px' }}>
                    <span style={{ fontSize: '20px' }}>🟢</span>
                    <div style={{ flex: 1 }}>
                      <div>WhatsApp Chat</div>
                      <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 'normal' }}>+91 85850 58779</div>
                    </div>
                    <span>→</span>
                  </a>
                  <a href="mailto:helpdesk.mediq@gmail.com?subject=Support%20Request%20-%20MediQ" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8f6f0', border: '1px solid #e2e8f0', padding: '14px 16px', borderRadius: '14px', textDecoration: 'none', color: '#0b332c', fontWeight: '700', fontSize: '13.5px' }}>
                    <span style={{ fontSize: '20px' }}>✉️</span>
                    <div style={{ flex: 1 }}>
                      <div>Email Support</div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>helpdesk.mediq@gmail.com</div>
                    </div>
                    <span>→</span>
                  </a>
                </div>
                <button onClick={() => setActiveModal(null)} style={{ width: '100%', background: '#0b332c', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="app-main">
        <header className="desktop-app-header">
          <div className="desktop-page-info">
            <span className="desktop-page-eyebrow">MediQ Patient Portal</span>
            <h1>{pageTitles[activeTab]}</h1>
          </div>
        </header>

        <main className="app-content">
          {activeTab === 'home' && <HospitalFlow user={session?.user || null} isGuest={isGuest} onLogout={handleLogout} displayName={displayName} lang={lang} t={t} familyMembers={familyMembers} />}
          {activeTab === 'triage' && <SymptomTriage onClose={() => handleNavigation('home')} onSelectSpecialty={() => handleNavigation('home')} />}
          {activeTab === 'reports' && <Reports user={session?.user || null} lang={lang} />}
          {activeTab === 'bookings' && <MyBookings onOpenSupport={() => setActiveModal('support')} />}
        </main>
      </div>

      <nav className="mobile-bottom-nav">
        {navigationItems.map((item) => (
          <button key={item.id} className={activeTab === item.id ? 'active' : ''} onClick={() => handleNavigation(item.id)}>
            <span className="mobile-nav-icon"><AppIcon type={item.icon} size={21} /></span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
