import { useState, useEffect } from 'react';
import BookingTicket from './BookingTicket';
import Profile from './Profile';
import {
  getHospitals, getAllCities, getDoctorsForHospital, getWaitingCount,
  bookAppointment, searchDoctors, getAllSpecialties, getHospitalPaymentInfo, uploadPaymentScreenshot,
} from '../hospitalData';
import './HospitalFlow.css';

const STATUS_STYLES = {
  available: { label: 'Available', color: '#22c55e' },
  delayed: { label: 'Delayed', color: '#f59e0b' },
  on_break: { label: 'On Break', color: '#6b7280' },
  not_started: { label: 'Not Started', color: '#ef4444' },
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

function toMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function getAvailability(doc) {
  const today = DAY_ABBR[new Date().getDay()];
  const worksToday = !doc.working_days || doc.working_days.length === 0 || doc.working_days.includes(today);

  if (!worksToday) {
    return { label: 'Not available today', color: '#e5e7eb', textColor: '#6b7280', bookable: false };
  }

  const statusInfo = STATUS_STYLES[doc.status] || STATUS_STYLES.available;
  
  // Allow booking for every parameter except 'completed' (Done for Today)
  const bookable = doc.status !== 'completed';

  return {
    label: `${statusInfo.label}${doc.status === 'delayed' && doc.delay_minutes ? ` ${doc.delay_minutes}m` : ''}`,
    color: statusInfo.color,
    textColor: 'white',
    bookable,
  };
}

function DoctorStatusBadge({ availability }) {
  return (
    <span style={{
      background: availability.color, color: availability.textColor, fontSize: 12, fontWeight: 600,
      padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap',
    }}>
      {availability.label}
    </span>
  );
}

function BookButton({ availability, onClick }) {
  if (!availability.bookable) {
    return (
      <button className="book-btn" disabled style={{ background: '#e5e7eb', color: '#9ca3af', cursor: 'not-allowed' }}>
        Done for Today
      </button>
    );
  }
  return (
    <button className="book-btn" onClick={onClick}>
      Book Token / Join Queue
    </button>
  );
}

function DoctorSchedule({ doc }) {
  if (!doc.working_days?.length && !doc.start_time) return null;
  return (
    <p style={{ fontSize: 13, color: '#4f6ef7', margin: '6px 0 0', fontWeight: 600 }}>
      {doc.working_days?.join(', ')}
      {doc.start_time && doc.end_time ? ` : ${formatTime(doc.start_time)} - ${formatTime(doc.end_time)}` : ''}
    </p>
  );
}

function DoctorFee({ doc }) {
  if (doc.consultation_fee == null) return null;
  return (
    <p style={{ fontSize: 13, color: '#22c55e', margin: '4px 0 0', fontWeight: 700 }}>
      ₹{doc.consultation_fee} consultation fee
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

  const isSearchActive = searchTerm.trim() !== '' || activeSpecialty !== '';

  useEffect(() => {
    getAllCities().then(setAllCities);
  }, []);

  useEffect(() => {
    if (selectedPayment !== 'upi' || !pendingBooking) return;
    setTimeLeft(90);
    setPaymentExpired(false);
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setPaymentExpired(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedPayment, pendingBooking]);

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

  const openPaymentChoice = async (doc, hospitalId) => {
    if (isGuest || !user) {
      setBookingError('Please sign in to book a queue token.');
      return;
    }
    setBookingError('');
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
                {isGuest ? 'Browsing as Guest' : `Hello, ${nameForAvatar}`}
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
            {currentCity || 'All Cities'} <span style={{ opacity: 0.7 }}>&#9662;</span>
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
                <button className="search-clear-btn" onClick={clearSearch}>Clear</button>
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
                        return (
                          <div key={doc.id} className="doctor-card">
                            <div className="doctor-card-top">
                              <div>
                                <h4 className="doctor-name">{doc.name}</h4>
                                <p className="doctor-specialty">{doc.specialty}</p>
                                <p className="doctor-hospital-tag">{doc.hospital?.name}</p>
                                <DoctorFee doc={doc} />
                              </div>
                              <DoctorStatusBadge availability={availability} />
                            </div>
                            <div className="doctor-queue-row">
                              Currently waiting: <strong>{doc.liveQueue} Patients</strong>
                            </div>
                            <BookButton availability={availability} onClick={() => openPaymentChoice(doc, doc.hospital_id)} />
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
                  <div className="hospital-list">
                    {hospitals.map((hosp) => (
                      <div key={hosp.id} className="hospital-card" onClick={() => setSelectedHospital(hosp)}>
                        <div className="hospital-icon">H</div>
                        <div className="hospital-info">
                          <h4>{hosp.name}</h4>
                          {hosp.location && <p>{hosp.location}</p>}
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
              Back to Hospitals
            </button>
            <h3 className="flow-section-title">Doctors at {selectedHospital.name}</h3>

            {loadingDoctors ? (
              <p className="flow-empty">Loading doctors...</p>
            ) : doctors.length === 0 ? (
              <p className="flow-empty">No doctors listed for this hospital yet.</p>
            ) : (
              <div className="doctor-list">
                {doctors.map((doc) => {
                  const availability = getAvailability(doc);
                  return (
                    <div key={doc.id} className="doctor-card">
                      <div className="doctor-card-top">
                        <div>
                          <h4 className="doctor-name">{doc.name}</h4>
                          <p className="doctor-specialty">{doc.specialty}</p>
                          <DoctorSchedule doc={doc} />
                          <DoctorFee doc={doc} />
                        </div>
                        <DoctorStatusBadge availability={availability} />
                      </div>

                      <div className="doctor-queue-row">
                        Currently waiting: <strong>{doc.liveQueue} Patients</strong>
                      </div>

                      <BookButton availability={availability} onClick={() => openPaymentChoice(doc, selectedHospital.id)} />
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
          <div className="ticket-card">
            <div className="ticket-header">
              <h2>Confirm Your Booking</h2>
            </div>

            {/* Helpful doctor status banners */}
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
            <div style={{ display: 'flex', gap: 10, margin: '0 0 16px' }}>
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