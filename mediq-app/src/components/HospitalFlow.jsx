import { useState, useEffect } from 'react';
import BookingTicket from './BookingTicket';
import Profile from './Profile';
import {
  getHospitals, getAllCities, getDoctorsForHospital, getWaitingCount,
  bookAppointment, searchDoctors, getAllSpecialties, getHospitalPaymentInfo, uploadPaymentScreenshot,
  getMyCurrentBooking, getAvailableDoctorCounts,
} from '../hospitalData';
import './HospitalFlow.css';

const STATUS_STYLES = {
  available: { label: 'Available', color: '#22c55e' },
  delayed: { label: 'Delayed', color: '#f59e0b' },
  on_break: { label: 'On Break', color: '#6b7280' },
  not_started: { label: 'Not Started', color: '#ef4444' },
  on_leave: { label: 'On Leave / Holiday', color: '#dc2626' },
  completed: { label: 'Done for Today', color: '#374151' },
};

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export default function HospitalFlow({ user, isGuest, onLogout, displayName, initialCity }) {
  const [currentCity, setCurrentCity] = useState(initialCity || 'Balgona');
  const [allCities, setAllCities] = useState([]);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [availableCounts, setAvailableCounts] = useState({});
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeSpecialty, setActiveSpecialty] = useState('');
  const [specialties, setSpecialties] = useState([]);

  useEffect(() => {
    getAllCities().then(setAllCities);
  }, []);

  useEffect(() => {
    setLoadingHospitals(true);
    getHospitals(currentCity).then(async (data) => {
      setHospitals(data || []);
      setLoadingHospitals(false);
      const ids = (data || []).map((h) => h.id);
      const counts = await getAvailableDoctorCounts(ids);
      setAvailableCounts(counts || {});
    });
    getAllSpecialties(currentCity).then(setSpecialties);
  }, [currentCity]);

  const nameForAvatar = isGuest ? 'Guest' : (displayName || user?.name || 'Yash');
  const avatarInitial = nameForAvatar.charAt(0).toUpperCase();

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#f8fafc', paddingBottom: 90, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* STICKY HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #115e59 55%, #0d9488 100%)',
        padding: '20px 20px 24px',
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        color: 'white',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#ccfbf1', color: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18 }}>
              {avatarInitial}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: '#99f6e4', fontWeight: 600 }}>Good Morning 👋</p>
              <h3 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800 }}>{nameForAvatar}</h3>
            </div>
          </div>

          <button
            onClick={() => setShowCityPicker(!showCityPicker)}
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            📍 {currentCity} ▾
          </button>
        </div>

        {/* GLASSMORPHIC SEARCH BAR */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search doctor or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 40px',
              borderRadius: 16,
              border: '1px solid rgba(255, 255, 255, 0.25)',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(12px)',
              color: 'white',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.8 }}>🔍</span>
        </div>
      </div>

      <div style={{ padding: '20px 16px 0' }}>
        
        {/* SPECIALTY CHIPS */}
        <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>Select Specialty</h4>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
          {['All', 'Psychiatrist', 'Gynecologist', 'Homeopath', 'General Medicine'].map((s) => (
            <button
              key={s}
              onClick={() => setActiveSpecialty(s === 'All' ? '' : s)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: activeSpecialty === s ? 'none' : '1px solid #cbd5e1',
                background: activeSpecialty === s ? '#ccfbf1' : '#ffffff',
                color: activeSpecialty === s ? '#0f766e' : '#475569',
                fontWeight: 700,
                fontSize: 12,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* HOSPITALS */}
        <h4 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '16px 0 12px' }}>Available Hospitals</h4>

        {hospitals.map((hosp) => (
          <div key={hosp.id} style={{ background: '#ffffff', borderRadius: 20, padding: 18, marginBottom: 14, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #0d9488, #0f766e)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800 }}>
                🏥
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{hosp.name}</h4>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{hosp.location || 'Balgona, West Bengal'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ padding: '6px 12px', borderRadius: 20, background: '#dcfce7', color: '#15803d', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                🟢 {availableCounts[hosp.id] || 1} Doctor Available Today
              </span>

              {hosp.location && (
                <a
                  href={hosp.location.startsWith('http') ? hosp.location : `https://maps.google.com/?q=${encodeURIComponent(hosp.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ padding: '6px 14px', borderRadius: 20, background: '#eff6ff', color: '#2563eb', fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  📍 Get Directions
                </a>
              )}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}