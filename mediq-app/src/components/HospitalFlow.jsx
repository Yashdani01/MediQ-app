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
  available: { label: 'Available', tone: 'green' },
  delayed: { label: 'Delayed', tone: 'amber' },
  on_break: { label: 'On Break', tone: 'gray' },
  not_started: { label: 'Not Started', tone: 'red' },
  on_leave: { label: 'On Leave / Holiday', tone: 'red' },
  completed: { label: 'Done for Today', tone: 'red' },
};

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function getAvailability(doc) {
  const today = DAY_ABBR[new Date().getDay()];
  const worksToday = !doc.working_days || doc.working_days.length === 0 || doc.working_days.includes(today);

  if (!worksToday) {
    return { label: 'Not available today', tone: 'gray', bookable: false };
  }

  const statusInfo = STATUS_STYLES[doc.status] || STATUS_STYLES.available;
  const bookable = doc.status !== 'completed' && doc.status !== 'on_leave';

  return {
    label: `${statusInfo.label}${doc.status === 'delayed' && doc.delay_minutes ? ` ${doc.delay_minutes}m` : ''}`,
    tone: statusInfo.tone,
    bookable,
  };
}

function DoctorStatusBadge({ availability }) {
  return (
    <span className={`status-pill ${availability.tone}`}>
      {availability.label}
    </span>
  );
}

function BookButton({ availability, onClick }) {
  if (!availability.bookable) {
    return (
      <button className="book-btn book-btn-disabled" disabled>
        {availability.label.includes('Leave') ? 'Booking Unavailable (On Leave)' : 'Done for Today'}
      </button>
    );
  }
  return (
    <button className="book-btn" onClick={onClick}>
      Book Token
    </button>
  );
}

function DoctorSchedule({ doc }) {
  if (!doc.working_days?.length && !doc.start_time) return null;
  return (
    <p className="doc-schedule-value">
      {doc.working_days?.join(', ')}
      {doc.start_time && doc.end_time ? ` : ${formatTime(doc.start_time)} - ${formatTime(doc.end_time)}` : ''}
    </p>
  );
}

function DoctorFee({ doc }) {
  if (doc.consultation_fee == null) return null;
  return <p className="doc-fee-value">₹{doc.consultation_fee}</p>;
}

function DoctorAvatar({ bookable }) {
  return (
    <div className={`doctor-avatar ${bookable ? '' : 'muted'}`}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" stroke={bookable ? '#10b981' : '#64748b'} strokeWidth="1.6" />
        <path d="M4 20.5c1.4-3.6 4.6-5.5 8-5.5s6.6 1.9 8 5.5" stroke={bookable ? '#10b981' : '#64748b'} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function HospitalFlow({ user, isGuest, onLogout, displayName, initialCity, lang, t }) {
  const [currentCity, setCurrentCity] = useState(initialCity || '');
  const [allCities, setAllCities] = useState([]);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [availableCounts, setAvailableCounts] = useState({});
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [bookingError, setBookingError] = useState('');

  const [pendingBooking, setPendingBooking] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [hospitalUpi, setHospitalUpi] = useState(null);
  const [contactPhone, setContactPhone] = useState('');
  const [txnId, setTxnId] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [timeLeft, setTimeLeft] = useState(90);
  const [paymentExpired, setPaymentExpired] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeSpecialty, setActiveSpecialty] = useState('');
  const [specialties, setSpecialties] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const isSearchActive = searchTerm.trim() !== '' || activeSpecialty !== '';

  useEffect(() => {
    getAllCities().then(setAllCities);
  }, []);

  useEffect(() => {
    if (selectedPayment !== 'upi' || !pendingBooking) return;
    setTimeLeft(90);
    setPaymentExpired(false);
    const interval = setInterval(() => {
      setTimeLeft((tVal) => {
        if (tVal <= 1) {
          clearInterval(interval);
          setPaymentExpired(true);
          return 0;
        }
        return tVal - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedPayment, pendingBooking]);

  useEffect(() => {
    setLoadingHospitals(true);
    getHospitals(currentCity).then(async (data) => {
      setHospitals(data);
      setLoadingHospitals(false);
      const ids = data.map((h) => h.id);
      const counts = await getAvailableDoctorCounts(ids);
      setAvailableCounts(counts);
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

  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice search is not supported on this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      setSearchTerm(event.results[0][0].transcript);
      setActiveSpecialty('');
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const openPaymentChoice = async (doc, hospitalId) => {
    if (isGuest || !user) {
      setBookingError('Please sign in to book a queue token.');
      return;
    }
    setBookingError('');

    const existingBooking = await getMyCurrentBooking(user.id);
    if (existingBooking && existingBooking.doctor_id === doc.id) {
      setBookingError(`Booking Error: You already have an active token (#${existingBooking.queue_number}) with Dr. ${doc.name}.`);
      return;
    }

    const upi = await getHospitalPaymentInfo(hospitalId);
    setHospitalUpi(upi);
    setSelectedPayment('cash');
    setContactPhone('');
    setTxnId('');
    setScreenshotFile(null);
    setPaymentExpired(false);
    setPendingBooking({ doc, hospitalId });
  };

  const handleConfirmBooking = async () => {
    const { doc, hospitalId } = pendingBooking;

    if (!contactPhone.trim()) {
      setBookingError('Please enter a contact phone number.');
      return;
    }

    if (selectedPayment === 'upi') {
      if (paymentExpired) {
        setBookingError('Payment time expired. Please try booking again.');
        setPendingBooking(null);
        return;
      }
      if (!txnId.trim() || !screenshotFile) {
        setBookingError('Please enter the transaction ID and upload a payment screenshot.');
        return;
      }
      setSubmittingPayment(true);
      const { url, error: uploadError } = await uploadPaymentScreenshot(screenshotFile);
      if (uploadError) {
        setSubmittingPayment(false);
        setBookingError('Could not upload screenshot. Please try again.');
        return;
      }
      const { data: appointment, error } = await bookAppointment(
        user.id, doc.id, hospitalId, 'upi', txnId.trim(), url, contactPhone.trim()
      );
      setSubmittingPayment(false);
      if (error) {
        setBookingError('Something went wrong while booking. Please try again.');
        setPendingBooking(null);
        return;
      }
      setTicketData({
        appointment,
        doctor: { name: doc.name, specialty: doc.specialty, avg_minutes_per_patient: doc.avg_minutes_per_patient },
        patientsAheadOverride: doc.liveQueue,
        paymentMethod: 'upi',
        upiInfo: hospitalUpi ? { upiId: hospitalUpi } : null,
      });
      setPendingBooking(null);
      setTxnId('');
      setScreenshotFile(null);
      return;
    }

    const { data: appointment, error } = await bookAppointment(
      user.id, doc.id, hospitalId, 'cash', null, null, contactPhone.trim()
    );
    if (error) {
      setBookingError('Something went wrong while booking. Please try again.');
      setPendingBooking(null);
      return;
    }
    setTicketData({
      appointment,
      doctor: { name: doc.name, specialty: doc.specialty, avg_minutes_per_patient: doc.avg_minutes_per_patient },
      patientsAheadOverride: doc.liveQueue,
      paymentMethod: 'cash',
      upiInfo: null,
    });
    setPendingBooking(null);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setActiveSpecialty('');
  };

  const nameForAvatar = isGuest ? t?.guest || 'Guest' : (displayName || 'Patient');
  const avatarInitial = nameForAvatar.charAt(0).toUpperCase();

  return (
    <div className="flow-page" style={{ width: '100%', maxWidth: '100vw', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <div className="flow-topbar" style={{ width: '100%', boxSizing: 'border-box' }}>
        <div className="flow-topbar-inner" style={{ width: '100%', maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
          <button
            className="flow-user-badge"
            onClick={() => !isGuest && setShowProfile(true)}
            style={{ background: 'none', border: 'none', cursor: isGuest ? 'default' : 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <div className="flow-avatar">{avatarInitial}</div>
            <div style={{ textAlign: 'left' }}>
              <p className="flow-subtitle" style={{ margin: '0 0 2px' }}>
                {isGuest ? t?.browsingAs || 'Browsing as' : t?.greeting || 'Good Morning,'}
              </p>
              <p className="flow-greeting" style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                {isGuest ? t?.guest || 'Guest' : nameForAvatar}
              </p>
            </div>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isGuest && (
              <button className="flow-logout-btn" onClick={onLogout}>{t?.logout || 'Logout'}</button>
            )}
            <div className="city-switcher-row" style={{ margin: 0, position: 'relative' }}>
              <button className="city-pill" onClick={() => setShowCityPicker(!showCityPicker)}>
                {currentCity || 'All Cities'} <span style={{ opacity: 0.7 }}>&#9662;</span>
              </button>

              {showCityPicker && (
                <div className="city-dropdown" style={{ right: 0, left: 'auto' }}>
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
        </div>
      </div>

      <div className="flow-content" style={{ paddingBottom: '90px', width: '100%', maxWidth: '600px', margin: '0 auto', boxSizing: 'border-box' }}>
        {!selectedHospital && (
          <div>
            <div className="search-bar-wrap" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                <input
                  type="text"
                  className="search-bar"
                  placeholder={isListening ? "Listening... Speak now" : "Search doctor or symptom..."}
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setActiveSpecialty(''); }}
                  style={{ width: '100%', paddingRight: isSearchActive ? '50px' : '16px', boxSizing: 'border-box' }}
                />
                {isSearchActive && (
                  <button className="search-clear-btn" onClick={clearSearch}>Clear</button>
                )}
              </div>
              <button
                type="button"
                onClick={startVoiceSearch}
                title="Search with Voice"
                style={{
                  background: isListening ? '#ef4444' : '#0b332c',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '12px',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(11, 51, 44, 0.15)',
                  transition: 'background 0.2s',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              </button>
            </div>

            {specialties.length > 0 && (
              <div className="specialty-chips" style={{ width: '100%', boxSizing: 'border-box' }}>
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
                <h3 className="flow-section-title">Search Results</h3>
                {searching ? (
                  <p className="flow-empty">Searching...</p>
                ) : searchResults.length === 0 ? (
                  <p className="flow-empty">No doctors found. Try a different search.</p>
                ) : (
                  <div className="doctor-list">
                    {searchResults
                      .sort((a, b) => a.liveQueue - b.liveQueue)
                      .map((doc) => {
                        const availability = getAvailability(doc);
                        const specs = doc.specialties || [doc.specialty || 'General Physician'];
                        return (
                          <div key={doc.id} className={`doctor-card ${availability.bookable ? '' : 'muted'}`} style={{ width: '100%', boxSizing: 'border-box' }}>
                            <div className="doctor-info">
                              <DoctorAvatar bookable={availability.bookable} />
                              <div className="doctor-details">
                                <div className="doctor-details-top">
                                  <div>
                                    <p className="doctor-name">{doc.name}</p>
                                    <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#10b981', fontWeight: 700 }}>{doc.degrees || 'MBBS, General Practitioner'}</p>
                                  </div>
                                  <DoctorStatusBadge availability={availability} />
                                </div>
                                <p className="doctor-specialty">{specs.join(', ')}</p>
                                <p style={{ fontSize: '11px', color: '#d97706', fontWeight: 700, margin: '2px 0 0' }}>⭐ PTR Trust Score: {doc.ptr_score || '99.0'}%</p>
                                <p className="doctor-hospital-tag">{doc.hospital?.name}</p>
                              </div>
                            </div>

                            <div className="doctor-card-divider" />

                            <div className="doc-stats">
                              <div>
                                <p className="doc-stats-label">Waiting</p>
                                <p className="doc-stats-value green">{doc.liveQueue} Patients</p>
                              </div>
                            </div>

                            <div className="doc-footer">
                              <div>
                                <p className="doc-fee-label">Consultation Fee</p>
                                <DoctorFee doc={doc} />
                              </div>
                              <BookButton availability={availability} onClick={() => openPaymentChoice(doc, doc.hospital_id)} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="flow-section-title">Available Hospitals</h3>
                {loadingHospitals ? (
                  <p className="flow-empty">Loading hospitals...</p>
                ) : hospitals.length === 0 ? (
                  <p className="flow-empty">No hospitals available in {currentCity || 'this area'} yet.</p>
                ) : (
                  <div className="hospital-list" style={{ width: '100%', boxSizing: 'border-box' }}>
                    {hospitals.map((hosp) => (
                      <div key={hosp.id} className="hospital-card" onClick={() => setSelectedHospital(hosp)} style={{ width: '100%', boxSizing: 'border-box' }}>
                        <div className="hospital-icon">{hosp.name.charAt(0).toUpperCase()}</div>
                        <div className="hospital-info" style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ wordBreak: 'break-word' }}>{hosp.name}</h4>
                          {hosp.location && <p style={{ wordBreak: 'break-word' }}>{hosp.location}</p>}
                          {availableCounts[hosp.id] > 0 && (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8,
                              padding: '4px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.1)', color: '#10b981',
                              fontSize: 11, fontWeight: 700,
                            }}>
                              ● {availableCounts[hosp.id]} Doctor{availableCounts[hosp.id] > 1 ? 's' : ''} Available Today
                            </span>
                          )}
                          {hosp.location && (
                            <a
                              href={
                                hosp.location.startsWith('http://') || hosp.location.startsWith('https://')
                                  ? hosp.location
                                  : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                      `${hosp.name}, ${hosp.location}, ${hosp.city || ''}`
                                    )}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                marginTop: 8,
                                marginLeft: 6,
                                padding: '6px 12px',
                                borderRadius: 100,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: 700,
                                textDecoration: 'none',
                              }}
                            >
                              📍 Directions
                            </a>
                          )}
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
          <div style={{ width: '100%', boxSizing: 'border-box' }}>
            <button className="flow-back-btn" onClick={() => { setSelectedHospital(null); setDoctors([]); }}>
              ← Back to Hospitals
            </button>
            <h3 className="flow-section-title">Doctors at {selectedHospital.name}</h3>

            {loadingDoctors ? (
              <p className="flow-empty">Loading doctors...</p>
            ) : doctors.length === 0 ? (
              <p className="flow-empty">No doctors listed for this hospital yet.</p>
            ) : (
              <div className="doctor-list" style={{ width: '100%', boxSizing: 'border-box' }}>
                {doctors.map((doc) => {
                  const availability = getAvailability(doc);
                  const specs = doc.specialties || [doc.specialty || 'General Physician'];
                  return (
                    <div key={doc.id} className={`doctor-card ${availability.bookable ? '' : 'muted'}`} style={{ width: '100%', boxSizing: 'border-box' }}>
                      <div className="doctor-info">
                        <DoctorAvatar bookable={availability.bookable} />
                        <div className="doctor-details">
                          <div className="doctor-details-top">
                            <div>
                              <p className="doctor-name">{doc.name}</p>
                              <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#10b981', fontWeight: 700 }}>{doc.degrees || 'MBBS, General Practitioner'}</p>
                            </div>
                            <DoctorStatusBadge availability={availability} />
                          </div>
                          <p className="doctor-specialty">{specs.join(', ')}</p>
                          <p style={{ fontSize: '11px', color: '#d97706', fontWeight: 700, margin: '2px 0 0' }}>⭐ PTR Trust Score: {doc.ptr_score || '99.0'}%</p>
                        </div>
                      </div>

                      <div className="doctor-card-divider" />

                      <div className="doc-stats">
                        <div>
                          <p className="doc-stats-label">Schedule</p>
                          <DoctorSchedule doc={doc} />
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p className="doc-stats-label">Waiting</p>
                          <p className={`doc-stats-value ${availability.bookable ? 'green' : ''}`}>
                            {availability.bookable ? `${doc.liveQueue} Patients` : 'Closed'}
                          </p>
                        </div>
                      </div>

                      <div className="doc-footer">
                        <div>
                          <p className="doc-fee-label">Consultation Fee</p>
                          <DoctorFee doc={doc} />
                        </div>
                        <BookButton availability={availability} onClick={() => openPaymentChoice(doc, selectedHospital.id)} />
                      </div>
                    </div>
                  );
                })}
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
          paymentMethod={ticketData.paymentMethod}
          upiInfo={ticketData.upiInfo}
          onClose={() => setTicketData(null)}
        />
      )}

      {pendingBooking && (
        <div className="ticket-overlay">
          <div className="ticket-card" style={{ width: '90%', maxWidth: '400px', boxSizing: 'border-box' }}>
            <div className="ticket-header">
              <h2>Confirm Your Booking</h2>
            </div>

            {pendingBooking.doc.status === 'not_started' && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '8px 12px', borderRadius: 8, marginBottom: 10, fontSize: 13, color: '#991b1b', textAlign: 'left' }}>
                ℹ️ <strong>Note:</strong> Consultation hasn't started yet today, but you can reserve your advance queue token now!
              </div>
            )}

            {pendingBooking.doc.status === 'delayed' && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '8px 12px', borderRadius: 8, marginBottom: 10, fontSize: 13, color: '#92400e', textAlign: 'left' }}>
                ℹ️ <strong>Note:</strong> Dr. {pendingBooking.doc.name} is running ~{pendingBooking.doc.delay_minutes || 10}m delayed, but bookings remain open.
              </div>
            )}

            {pendingBooking.doc.status === 'on_break' && (
              <div style={{ background: '#f3f4f6', border: '1px solid #d1d5db', padding: '8px 12px', borderRadius: 8, marginBottom: 10, fontSize: 13, color: '#374151', textAlign: 'left' }}>
                ℹ️ <strong>Note:</strong> Dr. {pendingBooking.doc.name} is currently on a break. You can still join the queue.
              </div>
            )}

            {pendingBooking.doc.consultation_fee != null && (
              <p style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#22c55e', marginBottom: 10 }}>
                Consultation Fee: ₹{pendingBooking.doc.consultation_fee}
              </p>
            )}

            <input
              placeholder="Your contact phone number"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14, marginBottom: 14, boxSizing: 'border-box' }}
            />

            <p style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 8 }}>Payment Method</p>
            <div style={{ display: 'flex', gap: 10, margin: '0 0 16px', width: '100%', boxSizing: 'border-box' }}>
              <button
                onClick={() => setSelectedPayment('cash')}
                style={{
                  flex: 1, padding: 14, borderRadius: 10, fontWeight: 600, cursor: 'pointer',
                  border: selectedPayment === 'cash' ? 'none' : '1px solid #ddd',
                  background: selectedPayment === 'cash' ? '#4f6ef7' : 'white',
                  color: selectedPayment === 'cash' ? 'white' : '#333',
                }}
              >
                Cash
              </button>
              <button
                onClick={() => setSelectedPayment('upi')}
                disabled={!hospitalUpi}
                style={{
                  flex: 1, padding: 14, borderRadius: 10, fontWeight: 600,
                  cursor: hospitalUpi ? 'pointer' : 'not-allowed',
                  border: selectedPayment === 'upi' ? 'none' : '1px solid #ddd',
                  background: selectedPayment === 'upi' ? '#4f6ef7' : 'white',
                  color: selectedPayment === 'upi' ? 'white' : (hospitalUpi ? '#333' : '#bbb'),
                }}
              >
                Online / UPI
              </button>
            </div>
            {!hospitalUpi && (
              <p style={{ fontSize: 13, color: '#999', textAlign: 'center' }}>
                This clinic hasn't set up UPI yet — Cash only.
              </p>
            )}
            {selectedPayment === 'upi' && hospitalUpi && !paymentExpired && (
              <>
                <p style={{ textAlign: 'center', fontSize: 14, marginBottom: 4 }}>
                  {pendingBooking.doc.consultation_fee != null ? (
                    <>Pay <strong>₹{pendingBooking.doc.consultation_fee}</strong> to <strong>{hospitalUpi}</strong></>
                  ) : (
                    <>Pay to: <strong>{hospitalUpi}</strong></>
                  )}
                </p>
                <p style={{ textAlign: 'center', fontSize: 13, color: timeLeft <= 20 ? '#ef4444' : '#666', fontWeight: 700, marginBottom: 12 }}>
                  Time remaining: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </p>
                <input
                  placeholder="Transaction / UTR ID"
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14, marginBottom: 8, boxSizing: 'border-box' }}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshotFile(e.target.files[0])}
                  style={{ width: '100%', marginBottom: 12, fontSize: 13 }}
                />
              </>
            )}
            {selectedPayment === 'upi' && hospitalUpi && paymentExpired && (
              <p style={{ textAlign: 'center', color: '#ef4444', fontWeight: 600, marginBottom: 12 }}>
                Time expired. Please cancel and book again.
              </p>
            )}
            <button
              className="ticket-close-btn"
              onClick={handleConfirmBooking}
              disabled={submittingPayment || (selectedPayment === 'upi' && paymentExpired)}
            >
              {submittingPayment ? 'Submitting...' : 'Confirm Booking'}
            </button>
            <button
              onClick={() => setPendingBooking(null)}
              style={{ width: '100%', marginTop: 8, padding: 10, borderRadius: 8, border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
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
