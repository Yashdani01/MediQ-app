import { useState, useEffect } from 'react';
import BookingTicket from './BookingTicket';
import Profile from './Profile';
import {
  getHospitals, getAllCities, getDoctorsForHospital, getWaitingCount,
  bookAppointment, searchDoctors, getAllSpecialties,
} from '../hospitalData';
import './HospitalFlow.css';

const STATUS_STYLES = {
  available: { label: 'Available', color: '#22c55e' },
  delayed: { label: 'Delayed', color: '#f59e0b' },
  on_break: { label: 'On Break', color: '#6b7280' },
  not_started: { label: 'Not Started', color: '#ef4444' },
};

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function DoctorStatusBadge({ doc }) {
  const today = DAY_ABBR[new Date().getDay()];
  const worksToday = !doc.working_days || doc.working_days.length === 0 || doc.working_days.includes(today);

  if (!worksToday) {
    return (
      <span style={{
        background: '#e5e7eb', color: '#6b7280', fontSize: 12, fontWeight: 600,
        padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap',
      }}>
        Not available today
      </span>
    );
  }

  const statusInfo = STATUS_STYLES[doc.status] || STATUS_STYLES.available;
  return (
    <span style={{
      background: statusInfo.color, color: 'white', fontSize: 12, fontWeight: 600,
      padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap',
    }}>
      {statusInfo.label}{doc.status === 'delayed' && doc.delay_minutes ? ` ${doc.delay_minutes}m` : ''}
    </span>
  );
}

function DoctorSchedule({ doc }) {
  if (!doc.working_days?.length && !doc.start_time) return null;
  return (
    <p style={{ fontSize: 13, color: '#4f6ef7', margin: '6px 0 0', fontWeight: 600 }}>
      {doc.working_days?.join(', ')}
      {doc.start_time && doc.end_time ? ` · ${formatTime(doc.start_time)} – ${formatTime(doc.end_time)}` : ''}
    </p>
  );
}

export default function HospitalFlow({ user, isGuest, onLogout, displayName, initialCity }) {
  const [currentCity, setCurrentCity] = useState(initialCity || '');
  const [allCities, setAllCities] = useState([]);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [bookingError, setBookingError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [activeSpecialty, setActiveSpecialty] = useState('');
  const [specialties, setSpecialties] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const isSearchActive = searchTerm.trim() !== '' || activeSpecialty !== '';

  useEffect(() => {
    getAllCities().then(setAllCities);
  }, []);

  useEffect(() => {
    setLoadingHospitals(true);
    getHospitals(currentCity).then((data) => {
      setHospitals(data);
      setLoadingHospitals(false);
    });
    getAllSpecialties(currentCity).then(setSpecialties);
  }, [currentCity]);

  const loadDoctorsForHospital = () => {
    if (!selectedHospital) return;
    setLoadingDoctors(true);
    getDoctorsForHospital(selectedHospital.id).then(async (docs) => {
      const withQueue = await Promise.all(
        docs.map(async (doc) => ({
          ...doc,
          liveQueue: await getWaitingCount(doc.id),
        }))
      );
      setDoctors(withQueue);
      setLoadingDoctors(false);
    });
  };

  useEffect(() => {
    loadDoctorsForHospital();
    if (!selectedHospital) return;
    const interval = setInterval(loadDoctorsForHospital, 60000);
    return () => clearInterval(interval);
  }, [selectedHospital]);

  useEffect(() => {
    if (!isSearchActive) { setSearchResults([]); return; }
    setSearching(true);
    const term = activeSpecialty || searchTerm;
    const delay = setTimeout(() => {
      searchDoctors(currentCity, term).then((results) => {
        setSearchResults(results);
        setSearching(false);
      });
    }, 300);
    return () => clearTimeout(delay);
  }, [searchTerm, activeSpecialty, currentCity]);

  const handleBookToken = async (doc, hospitalId) => {
    setBookingError('');
    if (isGuest || !user) {
      setBookingError('Please sign in to book a queue token.');
      return;
    }

    const { data: appointment, error } = await bookAppointment(user.id, doc.id, hospitalId);

    if (error) {
      setBookingError('Something went wrong while booking. Please try again.');
      return;
    }

    setTicketData({
      appointment,
      doctor: {
        name: doc.name,
        specialty: doc.specialty,
        avg_minutes_per_patient: doc.avg_minutes_per_patient,
      },
      patientsAheadOverride: doc.liveQueue,
    });
  };

  const clearSearch = () => {
    setSearchTerm('');
    setActiveSpecialty('');
  };

  const nameForAvatar = isGuest ? 'Guest' : (displayName || 'Patient');
  const avatarInitial = nameForAvatar.charAt(0).toUpperCase();

  return (
    <div className="flow-page">
      <div className="flow-topbar">
        <div className="flow-topbar-inner">
          <button
            className="flow-user-badge"
            onClick={() => !isGuest && setShowProfile(true)}
            style={{ background: 'none', border: 'none', cursor: isGuest ? 'default' : 'pointer', padding: 0 }}
          >
            <div className="flow-avatar">{avatarInitial}</div>
            <div style={{ textAlign: 'left' }}>
              <p className="flow-greeting">
                {isGuest ? 'Browsing as Guest' : `Hello, ${nameForAvatar} ðŸ‘‹`}
              </p>
              {!isGuest && <p className="flow-subtitle">{user?.email}</p>}
            </div>
          </button>
          {isGuest && (
            <button className="flow-logout-btn" onClick={onLogout}>Logout</button>
          )}
        </div>

        <div className="city-switcher-row">
          <button className="city-pill" onClick={() => setShowCityPicker(!showCityPicker)}>
            ðŸ“ {currentCity || 'All Cities'} <span style={{ opacity: 0.7 }}>â–¾</span>
          </button>

          {showCityPicker && (
            <div className="city-dropdown">
              <button
                className={`city-option ${!currentCity ? 'active' : ''}`}
                onClick={() => { setCurrentCity(''); setShowCityPicker(false); setSelectedHospital(null); }}
              >
                All Cities
              </button>
              {allCities.map((c) => (
                <button
                  key={c}
                  className={`city-option ${currentCity === c ? 'active' : ''}`}
                  onClick={() => { setCurrentCity(c); setShowCityPicker(false); setSelectedHospital(null); }}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flow-content">
        {!selectedHospital && (
          <div>
            <div className="search-bar-wrap">
              <input
                type="text"
                className="search-bar"
                placeholder="Search doctor or specialty..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setActiveSpecialty(''); }}
              />
              {isSearchActive && (
                <button className="search-clear-btn" onClick={clearSearch}>âœ•</button>
              )}
            </div>

            {specialties.length > 0 && (
              <div className="specialty-chips">
                {specialties.map((s) => (
                  <button
                    key={s}
                    className={`specialty-chip ${activeSpecialty === s ? 'active' : ''}`}
                    onClick={() => { setActiveSpecialty(activeSpecialty === s ? '' : s); setSearchTerm(''); }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {isSearchActive ? (
              <>
                <h3 className="flow-section-title">ðŸ” Search Results</h3>
                {searching ? (
                  <p className="flow-empty">Searching...</p>
                ) : searchResults.length === 0 ? (
                  <p className="flow-empty">No doctors found. Try a different search.</p>
                ) : (
                  <div className="doctor-list">
                    {searchResults
                      .sort((a, b) => a.liveQueue - b.liveQueue)
                      .map((doc) => (
                        <div key={doc.id} className="doctor-card">
                          <div className="doctor-card-top">
                            <div>
                              <h4 className="doctor-name">{doc.name}</h4>
                              <p className="doctor-specialty">{doc.specialty}</p>
                              <p className="doctor-hospital-tag">ðŸ¥ {doc.hospital?.name}</p>
                            </div>
                            <span className="doctor-queue-badge">{doc.liveQueue} waiting</span>
                          </div>
                          <button className="book-btn" onClick={() => handleBookToken(doc, doc.hospital_id)}>
                            Book Token / Join Queue
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="flow-section-title">ðŸ¥ Available Hospitals</h3>
                {loadingHospitals ? (
                  <p className="flow-empty">Loading hospitals...</p>
                ) : hospitals.length === 0 ? (
                  <p className="flow-empty">No hospitals available in {currentCity || 'this area'} yet.</p>
                ) : (
                  <div className="hospital-list">
                    {hospitals.map((hosp) => (
                      <div key={hosp.id} className="hospital-card" onClick={() => setSelectedHospital(hosp)}>
                        <div className="hospital-icon">ðŸ¢</div>
                        <div className="hospital-info">
                          <h4>{hosp.name}</h4>
                          {hosp.location && <p>ðŸ“ {hosp.location}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {selectedHospital && (
          <div>
            <button className="flow-back-btn" onClick={() => { setSelectedHospital(null); setDoctors([]); }}>
              â† Back to Hospitals
            </button>
            <h3 className="flow-section-title">ðŸ©º Doctors at {selectedHospital.name}</h3>

            {loadingDoctors ? (
              <p className="flow-empty">Loading doctors...</p>
            ) : doctors.length === 0 ? (
              <p className="flow-empty">No doctors listed for this hospital yet.</p>
            ) : (
              <div className="doctor-list">
                {doctors.map((doc) => (
                  <div key={doc.id} className="doctor-card">
                    <div className="doctor-card-top">
                      <div>
                        <h4 className="doctor-name">{doc.name}</h4>
                        <p className="doctor-specialty">{doc.specialty}</p>
                        <DoctorSchedule doc={doc} />
                      </div>
                      <DoctorStatusBadge doc={doc} />
                    </div>

                    <div className="doctor-queue-row">
                      ðŸŽŸï¸ Currently waiting: <strong>{doc.liveQueue} Patients</strong>
                    </div>

                    <button className="book-btn" onClick={() => handleBookToken(doc, selectedHospital.id)}>
                      Book Token / Join Queue
                    </button>
                  </div>
                ))}
              </div>
            )}

            {bookingError && <p className="flow-booking-error">{bookingError}</p>}
          </div>
        )}
      </div>

      {ticketData && (
        <BookingTicket
          appointment={ticketData.appointment}
          doctor={ticketData.doctor}
          patientsAheadOverride={ticketData.patientsAheadOverride}
          onClose={() => setTicketData(null)}
        />
      )}

      {showProfile && (
        <Profile
          user={user}
          displayName={displayName}
          onClose={() => setShowProfile(false)}
          onLogout={onLogout}
        />
      )}
    </div>
  );
}
