import { useState, useEffect } from 'react';
import BookingTicket from './BookingTicket';
import { getHospitals, getAllCities, getDoctorsForHospital, getWaitingCount, bookAppointment } from '../hospitalData';
import './HospitalFlow.css';

export default function HospitalFlow({ user, isGuest, onLogout, displayName, initialCity }) {
  const [currentCity, setCurrentCity] = useState(initialCity || '');
  const [allCities, setAllCities] = useState([]);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    getAllCities().then(setAllCities);
  }, []);

  useEffect(() => {
    setLoadingHospitals(true);
    getHospitals(currentCity).then((data) => {
      setHospitals(data);
      setLoadingHospitals(false);
    });
  }, [currentCity]);

  useEffect(() => {
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
  }, [selectedHospital]);

  const handleBookToken = async (doc) => {
    setBookingError('');
    if (isGuest || !user) {
      setBookingError('Please sign in to book a queue token.');
      return;
    }

    const { data: appointment, error } = await bookAppointment(user.id, doc.id, selectedHospital.id);

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

  const nameForAvatar = isGuest ? 'Guest' : (displayName || 'Patient');
  const avatarInitial = nameForAvatar.charAt(0).toUpperCase();

  return (
    <div className="flow-page">
      <div className="flow-topbar">
        <div className="flow-topbar-inner">
          <div className="flow-user-badge">
            <div className="flow-avatar">{avatarInitial}</div>
            <div>
              <p className="flow-greeting">
                {isGuest ? 'Browsing as Guest' : `Hello, ${nameForAvatar} 👋`}
              </p>
              {!isGuest && <p className="flow-subtitle">{user?.email}</p>}
            </div>
          </div>
          <button className="flow-logout-btn" onClick={onLogout}>Logout</button>
        </div>

        <div className="city-switcher-row">
          <button className="city-pill" onClick={() => setShowCityPicker(!showCityPicker)}>
            📍 {currentCity || 'All Cities'} <span style={{ opacity: 0.7 }}>▾</span>
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
            <h3 className="flow-section-title">🏥 Available Hospitals</h3>
            {loadingHospitals ? (
              <p className="flow-empty">Loading hospitals...</p>
            ) : hospitals.length === 0 ? (
              <p className="flow-empty">No hospitals available in {currentCity || 'this area'} yet.</p>
            ) : (
              <div className="hospital-list">
                {hospitals.map((hosp) => (
                  <div key={hosp.id} className="hospital-card" onClick={() => setSelectedHospital(hosp)}>
                    <div className="hospital-icon">🏢</div>
                    <div className="hospital-info">
                      <h4>{hosp.name}</h4>
                      {hosp.location && <p>📍 {hosp.location}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedHospital && (
          <div>
            <button className="flow-back-btn" onClick={() => { setSelectedHospital(null); setDoctors([]); }}>
              ← Back to Hospitals
            </button>
            <h3 className="flow-section-title">🩺 Doctors at {selectedHospital.name}</h3>

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
                      </div>
                      <span className="doctor-queue-badge">{doc.liveQueue} waiting</span>
                    </div>

                    <div className="doctor-queue-row">
                      🎟️ Currently waiting: <strong>{doc.liveQueue} Patients</strong>
                    </div>

                    <button className="book-btn" onClick={() => handleBookToken(doc)}>
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
    </div>
  );
}