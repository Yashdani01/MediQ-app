import { useState, useEffect } from 'react';
import BookingTicket from './BookingTicket';
import Profile from './Profile';
import {
  getHospitals,
  getAllCities,
  getDoctorsForHospital,
  getWaitingCount,
  bookAppointment,
  searchDoctors,
  getAllSpecialties,
  getHospitalPaymentInfo,
  uploadPaymentScreenshot,
  getMyCurrentBooking,
  getAvailableDoctorCounts,
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

  const worksToday =
    !doc.working_days ||
    doc.working_days.length === 0 ||
    doc.working_days.includes(today);

  if (!worksToday) {
    return {
      label: 'Not available today',
      tone: 'gray',
      bookable: false,
    };
  }

  const statusInfo =
    STATUS_STYLES[doc.status] || STATUS_STYLES.available;

  const bookable =
    doc.status !== 'completed' &&
    doc.status !== 'on_leave';

  return {
    label: `${statusInfo.label}${
      doc.status === 'delayed' && doc.delay_minutes
        ? ` ${doc.delay_minutes}m`
        : ''
    }`,
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
      <button
        className="book-btn book-btn-disabled"
        disabled
      >
        {availability.label.includes('Leave')
          ? 'Booking Unavailable (On Leave)'
          : 'Done for Today'}
      </button>
    );
  }

  return (
    <button
      className="book-btn"
      onClick={onClick}
    >
      Book Token
    </button>
  );
}

function DoctorSchedule({ doc }) {
  if (!doc.working_days?.length && !doc.start_time) {
    return null;
  }

  return (
    <p className="doc-schedule-value">
      {doc.working_days?.join(', ')}
      {doc.start_time && doc.end_time
        ? ` : ${formatTime(doc.start_time)} - ${formatTime(doc.end_time)}`
        : ''}
    </p>
  );
}

function DoctorFee({ doc }) {
  if (doc.consultation_fee == null) {
    return null;
  }

  return (
    <p className="doc-fee-value">
      ₹{doc.consultation_fee}
    </p>
  );
}

function DoctorAvatar({ bookable }) {
  return (
    <div
      className={`doctor-avatar ${
        bookable ? '' : 'muted'
      }`}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z"
          stroke={
            bookable
              ? '#10b981'
              : '#64748b'
          }
          strokeWidth="1.6"
        />

        <path
          d="M4 20.5c1.4-3.6 4.6-5.5 8-5.5s6.6 1.9 8 5.5"
          stroke={
            bookable
              ? '#10b981'
              : '#64748b'
          }
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default function HospitalFlow({
  user,
  isGuest,
  onLogout,
  displayName,
  initialCity,
  lang,
  t,
  familyMembers,
}) {
  const [currentCity, setCurrentCity] =
    useState(initialCity || '');

  const [allCities, setAllCities] =
    useState([]);

  const [showCityPicker, setShowCityPicker] =
    useState(false);

  const [showProfile, setShowProfile] =
    useState(false);

  const [hospitals, setHospitals] =
    useState([]);

  const [availableCounts, setAvailableCounts] =
    useState({});

  const [selectedHospital, setSelectedHospital] =
    useState(null);

  const [doctors, setDoctors] =
    useState([]);

  const [loadingHospitals, setLoadingHospitals] =
    useState(true);

  const [loadingDoctors, setLoadingDoctors] =
    useState(false);

  const [ticketData, setTicketData] =
    useState(null);

  const [bookingError, setBookingError] =
    useState('');

  const [pendingBooking, setPendingBooking] =
    useState(null);

  const [selectedPayment, setSelectedPayment] =
    useState('cash');

  const [hospitalUpi, setHospitalUpi] =
    useState(null);

  const [contactPhone, setContactPhone] =
    useState('');

  const [txnId, setTxnId] =
    useState('');

  const [screenshotFile, setScreenshotFile] =
    useState(null);

  const [timeLeft, setTimeLeft] =
    useState(150);

  const [paymentExpired, setPaymentExpired] =
    useState(false);

  const [submittingPayment, setSubmittingPayment] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState('');

  const [activeSpecialty, setActiveSpecialty] =
    useState('');

  const [specialties, setSpecialties] =
    useState([]);

  const [searchResults, setSearchResults] =
    useState([]);

  const [searching, setSearching] =
    useState(false);

  const [isListening, setIsListening] =
    useState(false);

  const [selectedFamilyMember, setSelectedFamilyMember] =
    useState(displayName || 'Self (Primary)');

  const [showCelebration, setShowCelebration] =
    useState(false);

  const [bookingTier, setBookingTier] = useState('standard');

  const [activeContactClinic, setActiveContactClinic] = useState(null);

  const getDynamicGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning, MediQ';
    if (hour < 17) return 'Good Afternoon, MediQ';
    return 'Good Evening, MediQ';
  };

  const isSearchActive =
    searchTerm.trim() !== '' ||
    activeSpecialty !== '';

  useEffect(() => {
    getAllCities().then(setAllCities);
  }, []);
  const [specialtyDoctors, setSpecialtyDoctors] = useState([]);
  const [loadingSpecialtySearch, setLoadingSpecialtySearch] = useState(false);

  useEffect(() => {
    if (!activeSpecialty) {
      setSpecialtyDoctors([]);
      return;
    }

    setLoadingSpecialtySearch(true);
    searchDoctors(currentCity, activeSpecialty).then(async (docs) => {
      const withQueue = await Promise.all(
        docs.map(async (doc) => ({
          ...doc,
          liveQueue: await getWaitingCount(doc.id),
        }))
      );
      setSpecialtyDoctors(withQueue);
      setLoadingSpecialtySearch(false);
    });
  }, [activeSpecialty, currentCity]);

  useEffect(() => {
    if (
      selectedPayment !== 'upi' ||
      !pendingBooking
    ) {
      return;
    }

    setTimeLeft(150);
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

      const counts =
        await getAvailableDoctorCounts(ids);

      setAvailableCounts(counts);
    });

    getAllSpecialties(currentCity)
      .then(setSpecialties);

  }, [currentCity]);

  const loadDoctorsForHospital = () => {
    if (!selectedHospital) return;

    setLoadingDoctors(true);

    getDoctorsForHospital(
      selectedHospital.id
    ).then(async (docs) => {

      const withQueue =
        await Promise.all(
          docs.map(async (doc) => ({
            ...doc,
            liveQueue:
              await getWaitingCount(doc.id),
          }))
        );

      setDoctors(withQueue);
      setLoadingDoctors(false);
    });
  };

  useEffect(() => {
    loadDoctorsForHospital();

    if (!selectedHospital) return;

    const interval =
      setInterval(
        loadDoctorsForHospital,
        60000
      );

    return () => clearInterval(interval);

  }, [selectedHospital]);

  useEffect(() => {
    if (!isSearchActive) {
      setSearchResults([]);
      return;
    }

    setSearching(true);

    const term =
      activeSpecialty || searchTerm;

    const delay =
      setTimeout(() => {

        searchDoctors(
          currentCity,
          term
        ).then((results) => {

          setSearchResults(results);
          setSearching(false);

        });

      }, 300);

    return () => clearTimeout(delay);

  }, [
    searchTerm,
    activeSpecialty,
    currentCity,
  ]);

  const startVoiceSearch = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        'Voice search is not supported on this browser.'
      );
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () =>
      setIsListening(true);

    recognition.onresult = (event) => {

      let spokenText =
        event.results[0][0]
          .transcript
          .toLowerCase();

      if (
        spokenText.includes('kan') ||
        spokenText.includes('ear') ||
        spokenText.includes('kane') ||
        spokenText.includes('gala') ||
        spokenText.includes('throat') ||
        spokenText.includes('neck') ||
        spokenText.includes('naak') ||
        spokenText.includes('nose') ||
        spokenText.includes('sardi') ||
        spokenText.includes('cough') ||
        spokenText.includes('cold') ||
        spokenText.includes('khasi') ||
        spokenText.includes('kaner betha') ||
        spokenText.includes('kan dard') ||
        spokenText.includes('gala batha')
      ) {

        setActiveSpecialty(
          'ENT Specialist'
        );

        setSearchTerm('');

      } else if (

        spokenText.includes('daant') ||
        spokenText.includes('dant') ||
        spokenText.includes('tooth') ||
        spokenText.includes('teeth') ||
        spokenText.includes('gum') ||
        spokenText.includes('mouri') ||
        spokenText.includes('mouth') ||
        spokenText.includes('toothache') ||
        spokenText.includes('dather betha') ||
        spokenText.includes('danther betha')

      ) {

        setActiveSpecialty('Dentist');
        setSearchTerm('');

      } else if (

        spokenText.includes('skin') ||
        spokenText.includes('rash') ||
        spokenText.includes('itch') ||
        spokenText.includes('chandi') ||
        spokenText.includes('charmrog') ||
        spokenText.includes('allergy') ||
        spokenText.includes('pimple') ||
        spokenText.includes('acne') ||
        spokenText.includes('dad') ||
        spokenText.includes('kachu') ||
        spokenText.includes('chuler samasya')

      ) {

        setActiveSpecialty(
          'Dermatologist'
        );

        setSearchTerm('');

      } else if (

        spokenText.includes('child') ||
        spokenText.includes('baby') ||
        spokenText.includes('kid') ||
        spokenText.includes('baccha') ||
        spokenText.includes('bacha') ||
        spokenText.includes('sishu') ||
        spokenText.includes('son') ||
        spokenText.includes('daughter')

      ) {

        setActiveSpecialty(
          'Pediatrician'
        );

        setSearchTerm('');

      } else if (

        spokenText.includes('bone') ||
        spokenText.includes('joint') ||
        spokenText.includes('knee') ||
        spokenText.includes('back pain') ||
        spokenText.includes('qamar') ||
        spokenText.includes('haad') ||
        spokenText.includes('haddi') ||
        spokenText.includes('hath') ||
        spokenText.includes('paa') ||
        spokenText.includes('leg') ||
        spokenText.includes('arm') ||
        spokenText.includes('ghutor betha') ||
        spokenText.includes('qamare betha')

      ) {

        setActiveSpecialty(
          'Orthopedic'
        );

        setSearchTerm('');

      } else if (

        spokenText.includes('pregnancy') ||
        spokenText.includes('periods') ||
        spokenText.includes('mahila') ||
        spokenText.includes('strirog') ||
        spokenText.includes('women') ||
        spokenText.includes('gyno') ||
        spokenText.includes('pet e betha')

      ) {

        setActiveSpecialty(
          'Gynecologist'
        );

        setSearchTerm('');

      } else if (

        spokenText.includes('fever') ||
        spokenText.includes('bukhar') ||
        spokenText.includes('jhor') ||
        spokenText.includes('jwar') ||
        spokenText.includes('headache') ||
        spokenText.includes('matha betha') ||
        spokenText.includes('weakness') ||
        spokenText.includes('durbalta') ||
        spokenText.includes('gas') ||
        spokenText.includes('stomach') ||
        spokenText.includes('pet kharab') ||
        spokenText.includes('diarrhea')

      ) {

        setActiveSpecialty(
          'General Physician'
        );

        setSearchTerm('');

      } else {

        setSearchTerm(spokenText);
        setActiveSpecialty('');

      }

      setIsListening(false);
    };

    recognition.onerror = () =>
      setIsListening(false);

    recognition.onend = () =>
      setIsListening(false);

    recognition.start();
  };

  const openPaymentChoice = async (
    doc,
    hospitalId
  ) => {

    if (isGuest || !user) {
      setBookingError(
        'Please sign in to book a queue token.'
      );
      return;
    }

    setBookingError('');

    const existingBooking =
      await getMyCurrentBooking(user.id);

    if (
      existingBooking &&
      existingBooking.doctor_id === doc.id
    ) {

      setBookingError(
        `Booking Error: You already have an active token (#${existingBooking.queue_number}) with Dr. ${doc.name}.`
      );

      return;
    }

    const upi =
      await getHospitalPaymentInfo(
        hospitalId
      );

    setHospitalUpi(upi);
    setSelectedPayment('cash');
    setContactPhone('');
    setTxnId('');
    setScreenshotFile(null);
    setPaymentExpired(false);
    setBookingTier('standard');

    setPendingBooking({
      doc,
      hospitalId,
    });
  };

  const handleConfirmBooking = async () => {
    if (!pendingBooking) return;

    const {
      doc,
      hospitalId,
    } = pendingBooking;

    if (!contactPhone.trim()) {
      setBookingError(
        'Please enter a contact phone number.'
      );
      return;
    }

    const isPriority = bookingTier === 'priority';

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
        user.id,
        doc.id,
        hospitalId,
        'upi',
        txnId.trim(),
        url,
        contactPhone.trim(),
        selectedFamilyMember,
        isPriority
      );

      setSubmittingPayment(false);

      if (error) {
        setBookingError('Something went wrong while booking. Please try again.');
        setPendingBooking(null);
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
        paymentMethod: 'upi',
        upiInfo: hospitalUpi,
      });

      setPendingBooking(null);
      setShowCelebration(true);
      return;
    }

    setSubmittingPayment(true);

    const { data: appointment, error } = await bookAppointment(
      user.id,
      doc.id,
      hospitalId,
      'cash',
      null,
      null,
      contactPhone.trim(),
      selectedFamilyMember,
      isPriority
    );

    setSubmittingPayment(false);

    if (error) {
      setBookingError(
        'Something went wrong while booking. Please try again.'
      );
      setPendingBooking(null);
      return;
    }

    setTicketData({
      appointment,
      doctor: {
        name: doc.name,
        specialty: doc.specialty,
        avg_minutes_per_patient:
          doc.avg_minutes_per_patient,
      },
      patientsAheadOverride:
        doc.liveQueue,
      paymentMethod: 'cash',
      upiInfo: null,
    });

    setPendingBooking(null);
    setShowCelebration(true);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setActiveSpecialty('');
  };

  return (
    <div
      className="flow-page"
      style={{
        width: '100%',
        maxWidth: '100vw',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      <div
        className="flow-content"
        style={{
          paddingBottom: '90px',
          width: '100%',
          maxWidth: '650px',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        {/* HERO BANNER */}
        <div style={{
          background: 'linear-gradient(135deg, #0b332c 0%, #113f32 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '22px 24px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 10px 25px rgba(11, 51, 44, 0.2)'
        }}>
          <div style={{ flex: 1, paddingRight: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '18px' }}>☀️</span>
              <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '17px', color: '#ffffff', margin: 0 }}>
                {getDynamicGreeting()}
              </h3>
            </div>
            <p style={{ fontSize: '12px', fontWeight: '600', color: '#10b981', margin: '0 0 4px' }}>
              Your health, our priority
            </p>
            <p style={{ fontSize: '11.5px', color: '#cbd5e1', margin: 0, lineHeight: '1.4' }}>
              Find trusted doctors & quality care near you
            </p>
          </div>

          <div style={{
            width: '95px', height: '65px', background: 'rgba(255,255,255,0.12)',
            borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)', flexShrink: 0, border: '1px solid rgba(255,255,255,0.15)'
          }}>
            <span style={{ fontSize: '28px' }}>🩺🛡️</span>
          </div>
        </div>

        {/* LOCATION SELECTOR */}
        <div style={{ marginBottom: '16px', display: 'flex', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <button
              onClick={() =>
                setShowCityPicker(
                  !showCityPicker
                )
              }
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#fff', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '14px',
                fontSize: '13.5px', fontWeight: '600', color: '#0b332c', cursor: 'pointer', boxSizing: 'border-box',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#0b332c' }}>📍</span>
                <span>{currentCity || 'All Locations (Balgona / Bhatar / Burdwan)'}</span>
              </div>
              <span style={{ fontSize: '10px', opacity: 0.6 }}>▼</span>
            </button>

            {showCityPicker && (
              <div
                style={{
                  position: 'absolute', left: 0, right: 0, top: '52px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden'
                }}
              >
                <button
                  style={{
                    width: '100%', textAlign: 'left', padding: '12px 16px', background: !currentCity ? '#f0fdf4' : 'transparent', border: 'none', borderBottom: '1px solid #f1f5f9', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#0b332c'
                  }}
                  onClick={() => {
                    setCurrentCity('');
                    setShowCityPicker(false);
                    setSelectedHospital(null);
                  }}
                >
                  All Locations
                </button>

                {allCities.map((c) => (
                  <button
                    key={c}
                    style={{
                      width: '100%', textAlign: 'left', padding: '12px 16px', background: currentCity === c ? '#f0fdf4' : 'transparent', border: 'none', borderBottom: '1px solid #f1f5f9', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#0b332c'
                    }}
                    onClick={() => {
                      setCurrentCity(c);
                      setShowCityPicker(false);
                      setSelectedHospital(null);
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

       {!selectedHospital && (
          <div>
            {/* STRUCTURED SPECIALTY CHIPS (Step 2) */}
            <div style={{ marginBottom: '18px' }}>
              <div
                className="specialty-chips"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  paddingBottom: '4px'
                }}
              >
                <button
                  className={`specialty-chip ${!activeSpecialty ? 'active' : ''}`}
                  onClick={() => setActiveSpecialty('')}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    whiteSpace: 'nowrap', 
                    cursor: 'pointer',
                    background: !activeSpecialty ? '#113f32' : '#ffffff',
                    color: !activeSpecialty ? '#ffffff' : '#334155',
                    border: !activeSpecialty ? 'none' : '1px solid #e2e8f0',
                    padding: '9px 16px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    boxShadow: !activeSpecialty ? '0 4px 12px rgba(17, 63, 50, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.02)'
                  }}
                >
                  <span>🔲</span> All Specialties
                </button>

                {specialties.map((s) => {
                  const isActive = activeSpecialty === s;
                  return (
                    <button
                      key={s}
                      className={`specialty-chip ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveSpecialty(isActive ? '' : s)}
                      style={{ 
                        whiteSpace: 'nowrap', 
                        cursor: 'pointer',
                        background: isActive ? '#113f32' : '#ffffff',
                        color: isActive ? '#ffffff' : '#334155',
                        border: isActive ? 'none' : '1px solid #e2e8f0',
                        padding: '9px 16px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                        boxShadow: isActive ? '0 4px 12px rgba(17, 63, 50, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.02)'
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CONDITIONAL RENDERING: SPECIALTY DOCTORS MAP VS HOSPITALS LIST */}
            {activeSpecialty ? (
              <>
                <h3 className="flow-section-title">
                  Doctors in {activeSpecialty}
                </h3>

                {loadingSpecialtySearch ? (
                  <p className="flow-empty">
                    Finding specialists in {currentCity || 'all locations'}...
                  </p>
                ) : specialtyDoctors.length === 0 ? (
                  <p className="flow-empty">
                    No doctors found for {activeSpecialty}. Try a different specialty.
                  </p>
                ) : (
                  <div className="doctor-list">
                    {specialtyDoctors
                      .sort((a, b) => a.liveQueue - b.liveQueue)
                      .map((doc) => {
                        const availability = getAvailability(doc);
                        const specs = doc.specialties || [doc.specialty || 'General Physician'];

                        return (
                          <div
                            key={doc.id}
                            className={`doctor-card ${
                              availability.bookable ? '' : 'muted'
                            }`}
                          >
                            <div className="doctor-info">
                              <DoctorAvatar bookable={availability.bookable} />
                              <div className="doctor-details">
                                <div className="doctor-details-top">
                                  <div>
                                    <p className="doctor-name">
                                      {doc.name}
                                    </p>
                                    <p
                                      style={{
                                        margin: '0 0 2px',
                                        fontSize: '11px',
                                        color: '#10b981',
                                        fontWeight: 700,
                                      }}
                                    >
                                      {doc.degrees || 'MBBS, Specialist'}
                                    </p>
                                  </div>
                                  <DoctorStatusBadge availability={availability} />
                                </div>
                                <p className="doctor-specialty">
                                  {specs.join(', ')}
                                </p>
                              </div>
                            </div>
                            <div className="doctor-card-divider" />
                            <div className="doc-stats">
                              <div>
                                <p className="doc-stats-label">
                                  Waiting Queue
                                </p>
                                <p className="doc-stats-value green">
                                  {doc.liveQueue} Patients
                                </p>
                              </div>
                            </div>
                            <div className="doc-footer">
                              <div>
                                <p className="doc-fee-label">
                                  Consultation Fee
                                </p>
                                <DoctorFee doc={doc} />
                              </div>
                              <BookButton
                                availability={availability}
                                onClick={() =>
                                  openPaymentChoice(doc, doc.hospital_id)
                                }
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 className="flow-section-title" style={{ margin: 0 }}>
                    Available Hospitals
                  </h3>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#10b981', cursor: 'pointer' }}>
                    View all →
                  </span>
                </div>

                {loadingHospitals ? (
                  <p className="flow-empty">
                    Loading hospitals...
                  </p>
                ) : hospitals.length === 0 ? (
                  <p className="flow-empty">
                    No hospitals available in{' '}
                    {currentCity || 'this area'} yet.
                  </p>
                ) : (
                  <div className="hospital-list">
                    {hospitals.map((hosp) => {
                      const isMapLink =
                        hosp.location &&
                        (hosp.location.startsWith('http://') ||
                         hosp.location.startsWith('https://'));

                      const directionsUrl = isMapLink
                        ? hosp.location
                        : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                            `${hosp.name}, ${hosp.location || ''}, ${hosp.city || ''}`
                          )}`;

                      return (
                        <div
                          key={hosp.id}
                          className="hospital-card"
                          onClick={() => setSelectedHospital(hosp)}
                          style={{ cursor: 'pointer', position: 'relative' }}
                        >
                          <div className="hospital-card-main">
                            <div className="hospital-icon">
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M3 21h18" />
                                <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                                <path d="M9 9h6" />
                                <path d="M12 6v6" />
                                <path d="M8 21v-4h8v4" />
                              </svg>
                            </div>
                            <div className="hospital-info">
                              <div className="hospital-title-row">
                                <div>
                                  <h4>{hosp.name}</h4>
                                  {!isMapLink && hosp.location && (
                                    <p className="hospital-location">
                                      <span>📍</span> {hosp.location}
                                    </p>
                                  )}
                                </div>
                                <div className="hospital-arrow">
                                  →
                                </div>
                              </div>
                              <div className="hospital-meta-row">
                                {availableCounts[hosp.id] > 0 ? (
                                  <span className="doctor-available-badge">
                                    <span className="availability-dot" />
                                    {availableCounts[hosp.id]} Doctor
                                    {availableCounts[hosp.id] > 1 ? 's' : ''} Available
                                  </span>
                                ) : (
                                  <span className="no-doctor-badge">
                                    Check schedule
                                  </span>
                                )}
                              </div>

                              {/* UNIFIED CONTACT PILLS — white background with thin border */}
                              <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

                                <a
                                  href={directionsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="contact-pill directions"
                                  style={{ 
                                    background: '#ffffff', 
                                    color: '#1f2937', 
                                    padding: '9px 16px', 
                                    borderRadius: '14px', 
                                    fontWeight: '600', 
                                    fontSize: '12.5px', 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '6px', 
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                    cursor: 'pointer',
                                    textDecoration: 'none'
                                  }}
                                >
                                  <span>📍</span> Directions
                                </a>

                                <div className="contact-pill-wrap" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => {
                                      setActiveContactClinic(activeContactClinic === hosp.id ? null : hosp.id);
                                    }}
                                    className="contact-pill contact-toggle"
                                    style={{ 
                                      background: '#ffffff', 
                                      color: '#1f2937', 
                                      padding: '9px 16px', 
                                      borderRadius: '14px', 
                                      fontWeight: '600', 
                                      fontSize: '12.5px', 
                                      display: 'inline-flex', 
                                      alignItems: 'center', 
                                      gap: '6px', 
                                      border: '1px solid #e2e8f0',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <span>📞</span> Direct Contact <span style={{ fontSize: '10px' }}>▾</span>
                                  </button>

                                  {activeContactClinic === hosp.id && (
                                    <div className="contact-menu" onClick={(e) => e.stopPropagation()}>
                                      <div className="contact-menu-label">Connect With Clinic</div>

                                      {hosp.phone_number ? (
                                        <a href={`tel:${hosp.phone_number}`} className="contact-menu-item call">
                                          <span className="contact-menu-icon" style={{ background: '#f3f4f6' }}>📞</span>
                                          <span>Call Clinic</span>
                                        </a>
                                      ) : (
                                        <span className="contact-menu-item-disabled">
                                          <span className="contact-menu-icon" style={{ background: '#f9fafb' }}>📞</span> No Phone Available
                                        </span>
                                      )}

                                      {hosp.whatsapp_link ? (
                                        <a
                                          href={`https://wa.me/${hosp.whatsapp_link}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="contact-menu-item whatsapp"
                                        >
                                          <span className="contact-menu-icon" style={{ background: '#d1fae5' }}>💬</span>
                                          <span>WhatsApp Chat</span>
                                        </a>
                                      ) : (
                                        <span className="contact-menu-item-disabled">
                                          <span className="contact-menu-icon" style={{ background: '#f9fafb' }}>💬</span> No WhatsApp Available
                                        </span>
                                      )}

                                      {hosp.support_email ? (
                                        <a href={`mailto:${hosp.support_email}`} className="contact-menu-item email">
                                          <span className="contact-menu-icon" style={{ background: '#dbeafe' }}>✉️</span>
                                          <span>Send Email</span>
                                        </a>
                                      ) : (
                                        <span className="contact-menu-item-disabled">
                                          <span className="contact-menu-icon" style={{ background: '#f9fafb' }}>✉️</span> No Email Available
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {selectedHospital && (
          <div>
            <button
              className="flow-back-btn"
              onClick={() => {
                setSelectedHospital(null);
                setDoctors([]);
              }}
            >
              ← Back to Hospitals
            </button>

            <h3 className="flow-section-title">
              Doctors at{' '}
              {selectedHospital.name}
            </h3>

            {loadingDoctors ? (
              <p className="flow-empty">
                Loading doctors...
              </p>
            ) : doctors.length === 0 ? (
              <p className="flow-empty">
                No doctors listed for this hospital yet.
              </p>
            ) : (
              <div className="doctor-list">
                {doctors
                  .sort((a, b) => {
                    const getWeight =
                      (doc) => {
                        if (
                          doc.status ===
                          'available'
                        ) {
                          return 1;
                        }
                        if (
                          doc.status ===
                          'delayed'
                        ) {
                          return 2;
                        }
                        if (
                          doc.status ===
                          'on_break'
                        ) {
                          return 3;
                        }
                        if (
                          doc.status ===
                          'not_started'
                        ) {
                          return 4;
                        }
                        if (
                          doc.status ===
                            'completed' ||
                          doc.status ===
                            'on_leave'
                        ) {
                          return 5;
                        }
                        return 2;
                      };

                    return (
                      getWeight(a) -
                      getWeight(b)
                    );
                  })
                  .map((doc) => {
                    const availability =
                      getAvailability(doc);

                    const specs =
                      doc.specialties ||
                      [
                        doc.specialty ||
                          'General Physician',
                      ];

                    return (
                      <div
                        key={doc.id}
                        className={`doctor-card ${
                          availability.bookable
                            ? ''
                            : 'muted'
                        }`}
                      >
                        <div className="doctor-info">
                          <DoctorAvatar
                            bookable={
                              availability.bookable
                            }
                          />
                          <div className="doctor-details">
                            <div className="doctor-details-top">
                              <div>
                                <p className="doctor-name">
                                  {doc.name}
                                </p>
                                <p
                                  style={{
                                    margin: '0 0 2px',
                                    fontSize: '11px',
                                    color: '#10b981',
                                    fontWeight: 700,
                                  }}
                                >
                                  {doc.degrees ||
                                    'MBBS, General Practitioner'}
                                </p>
                              </div>
                              <DoctorStatusBadge
                                availability={
                                  availability
                                }
                              />
                            </div>
                            <p className="doctor-specialty">
                              {specs.join(', ')}
                            </p>
                          </div>
                        </div>
                        <div className="doctor-card-divider" />
                        <div className="doc-stats">
                          <div>
                            <p className="doc-stats-label">
                              Schedule
                            </p>
                            <DoctorSchedule
                              doc={doc}
                            />
                          </div>
                          <div
                            style={{
                              textAlign: 'right',
                            }}
                          >
                            <p className="doc-stats-label">
                              Waiting
                            </p>
                            <p
                              className={`doc-stats-value ${
                                availability.bookable
                                  ? 'green'
                                  : ''
                              }`}
                            >
                              {availability.bookable
                                ? `${doc.liveQueue} Patients`
                                : 'Closed'}
                            </p>
                          </div>
                        </div>
                        <div className="doc-footer">
                          <div>
                            <p className="doc-fee-label">
                              Consultation Fee
                            </p>
                            <DoctorFee
                              doc={doc}
                            />
                          </div>
                          <BookButton
                            availability={
                              availability
                            }
                            onClick={() =>
                              openPaymentChoice(
                                doc,
                                selectedHospital.id
                              )
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {bookingError && (
              <p className="flow-booking-error">
                {bookingError}
              </p>
            )}
          </div>
        )}
      </div>

      {ticketData && (
        <BookingTicket
          appointment={
            ticketData.appointment
          }
          doctor={
            ticketData.doctor
          }
          patientsAheadOverride={
            ticketData.patientsAheadOverride
          }
          paymentMethod={
            ticketData.paymentMethod
          }
          upiInfo={
            ticketData.upiInfo
          }
          onClose={() =>
            setTicketData(null)
          }
        />
      )}

      {/* BOOKING CONFIRMATION & CARE CIRCLE MODAL */}
      {pendingBooking && (
        <div className="ticket-overlay" style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(6, 43, 37, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="ticket-card" style={{ background: '#fff', width: '100%', maxWidth: '420px', borderRadius: '24px', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', color: '#0b332c', margin: '0 0 4px' }}>
                  Confirm Appointment
                </h2>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  Dr. {pendingBooking.doc.name} • <span style={{ color: '#10b981', fontWeight: '600' }}>{pendingBooking.doc.specialty}</span>
                </p>
              </div>
              <button onClick={() => setPendingBooking(null)} style={{ background: '#f1f5f9', border: 'none', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', fontWeight: 'bold' }}>✕</button>
            </div>

            <div style={{ background: '#f8f6f0', padding: '14px', borderRadius: '16px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Consultation Fee:</span>
                <strong style={{ color: '#0b332c' }}>
                  ₹{bookingTier === 'priority' ? (pendingBooking.doc.consultation_fee || 500) + 100 : (pendingBooking.doc.consultation_fee || 500)}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                <span style={{ color: '#64748b' }}>Estimated Wait:</span>
                <strong style={{ color: '#10b981' }}>Live Queue Token</strong>
              </div>
            </div>

            {/* CARE CIRCLE PATIENT SELECTOR */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#0b332c', display: 'block', marginBottom: '6px' }}>
                Booking For (Care Circle):
              </label>
              <select
                value={selectedFamilyMember}
                onChange={(e) => setSelectedFamilyMember(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '13.5px', background: '#fff', color: '#0b332c', boxSizing: 'border-box', fontWeight: '600' }}
              >
                <option value={displayName || 'Self (Primary)'}>{displayName || 'Self (Primary)'} (Self)</option>
                {familyMembers && familyMembers.map((member, index) => {
                  if (member.name === 'Self (Primary)' || member.name === displayName) return null;
                  return (
                    <option key={index} value={member.name}>
                      {member.name} ({member.relation || 'Family Member'})
                    </option>
                  );
                })}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#0b332c', display: 'block', marginBottom: '6px' }}>
                Contact Phone Number:
              </label>
              <input
                placeholder="Enter 10-digit mobile number"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: '13.5px', boxSizing: 'border-box' }}
              />
            </div>

            {/* BOOKING TIER SELECTION (Standard vs Priority Consultation) */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#0b332c', display: 'block', marginBottom: '6px' }}>
                Consultation Type:
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setBookingTier('standard')}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', border: bookingTier === 'standard' ? 'none' : '1px solid #e2e8f0', background: bookingTier === 'standard' ? '#0b332c' : '#fff', color: bookingTier === 'standard' ? '#fff' : '#0b332c' }}
                >
                  Standard (₹{pendingBooking.doc.consultation_fee || 500})
                </button>
                <button
                  type="button"
                  onClick={() => setBookingTier('priority')}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', border: bookingTier === 'priority' ? 'none' : '1px solid #fde047', background: bookingTier === 'priority' ? '#d97706' : '#fef3c7', color: bookingTier === 'priority' ? '#fff' : '#92400e' }}
                >
                  ⚡ Priority (+₹100)
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button
                onClick={() => setSelectedPayment('cash')}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', border: selectedPayment === 'cash' ? 'none' : '1px solid #e2e8f0', background: selectedPayment === 'cash' ? '#0b332c' : '#fff', color: selectedPayment === 'cash' ? '#fff' : '#0b332c' }}
              >
                Cash at Clinic
              </button>
              <button
                onClick={() => setSelectedPayment('upi')}
                disabled={!hospitalUpi}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: '700', fontSize: '13px', cursor: hospitalUpi ? 'pointer' : 'not-allowed', border: selectedPayment === 'upi' ? 'none' : '1px solid #e2e8f0', background: selectedPayment === 'upi' ? '#0b332c' : '#fff', color: selectedPayment === 'upi' ? '#fff' : hospitalUpi ? '#0b332c' : '#cbd5e1' }}
              >
                Online / UPI
              </button>
            </div>

            {selectedPayment === 'upi' && hospitalUpi && (
              <div style={{ background: '#f8f6f0', padding: '14px', borderRadius: '14px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12.5px', color: '#0b332c' }}>
                    UPI ID: <strong>{hospitalUpi}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(hospitalUpi);
                      alert('UPI ID copied to clipboard!');
                    }}
                    style={{ background: '#0b332c', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    📋 Copy
                  </button>
                </div>
                <div style={{ fontSize: '11.5px', color: '#d97706', fontWeight: '600', marginBottom: '10px' }}>
                  ⏳ Time remaining: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')} (150s limit)
                </div>
                <input
                  placeholder="Enter Transaction / UTR ID"
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshotFile(e.target.files[0])}
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </div>
            )}

            {bookingError && (
              <p style={{ color: '#ef4444', fontSize: '12px', margin: '0 0 12px', fontWeight: '600', background: '#fef2f2', padding: '8px', borderRadius: '8px' }}>
                {bookingError}
              </p>
            )}

            <button
              onClick={handleConfirmBooking}
              disabled={submittingPayment}
              style={{ width: '100%', background: '#10b981', color: '#fff', border: 'none', padding: '14px', borderRadius: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginBottom: '10px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}
            >
              {submittingPayment ? 'Confirming Token...' : '✅ Confirm & Get Token'}
            </button>

            <button
              onClick={() => setPendingBooking(null)}
              style={{ width: '100%', background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', padding: '11px', borderRadius: '14px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showCelebration && (
        <div
          className="celebration-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 3000,
            background: 'rgba(6, 43, 37, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#fff',
              width: '100%',
              maxWidth: '360px',
              borderRadius: '24px',
              padding: '32px 24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              boxSizing: 'border-box',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              animation: 'mediq-pop-in 0.35s ease',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                fontSize: '22px',
                lineHeight: 1,
                padding: '10px 0',
                letterSpacing: '10px',
                opacity: 0.9,
              }}
            >
              🎉 🎊 🎉 🎊 🎉
            </div>

            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: '#e6f4ea',
                border: '2px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '28px auto 18px',
                animation: 'mediq-check-pop 0.4s ease 0.1s both',
              }}
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>

            <h2
              style={{
                fontFamily: 'Fraunces, serif',
                fontSize: '20px',
                color: '#0b332c',
                margin: '0 0 8px',
              }}
            >
              Booking Confirmed!
            </h2>

            <p
              style={{
                fontSize: '13.5px',
                color: '#475569',
                margin: '0 0 24px',
                lineHeight: 1.5,
              }}
            >
              Your queue token has been booked successfully for <strong>{selectedFamilyMember}</strong>.
            </p>

            <button
              onClick={() =>
                setShowCelebration(false)
              }
              style={{
                width: '100%',
                background: '#10b981',
                color: '#fff',
                border: 'none',
                padding: '13px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              }}
            >
              Great, Thanks!
            </button>
          </div>
        </div>
      )}

      {showProfile && (
        <Profile
          user={user}
          displayName={displayName}
          onClose={() =>
            setShowProfile(false)
          }
          onLogout={onLogout}
        />
      )}
    </div>
  );
}