// src/components/HospitalFlow.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import {
  getHospitals,
  getDoctorsForHospital,
  getWaitingCount,
  getAvailableDoctorCounts,
  getAllSpecialties,
  bookAppointment,
  getMyCurrentBooking,
  cancelAppointment,
  getAppointmentStatus,
  checkInAppointment,
} from '../hospitalData';
import BookingTicket from './BookingTicket';
import PaymentModal from './PaymentModal';
import './HospitalFlow.css';

const HospitalFlow = ({
  user,
  isGuest,
  onLogout,
  displayName,
  initialCity,
  lang,
  t,
  externalSpecialtyFilter,
}) => {
  // ============================
  // STATE
  // ============================
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(initialCity || '');
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState(externalSpecialtyFilter || '');
  
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  const [showTicket, setShowTicket] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState(null);

  // ============================
  // FETCH CITIES
  // ============================
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const { data, error } = await supabase
          .from('hospitals')
          .select('city')
          .not('city', 'is', null);
        if (error) throw error;
        const unique = [...new Set(data.map((h) => h.city).filter(Boolean))];
        setCities(unique);
        if (!selectedCity && unique.length > 0) {
          setSelectedCity(unique[0]);
        }
      } catch (err) {
        console.error('Error fetching cities:', err);
      }
    };
    fetchCities();
  }, []);

  // ============================
  // FETCH HOSPITALS
  // ============================
  const fetchHospitals = useCallback(async () => {
    if (!selectedCity) return;
    setLoading(true);
    try {
      const data = await getHospitals(selectedCity);
      setHospitals(data);
      
      const ids = data.map((h) => h.id);
      if (ids.length > 0) {
        const counts = await getAvailableDoctorCounts(ids);
        setHospitals((prev) =>
          prev.map((h) => ({
            ...h,
            availableDoctors: counts[h.id] || 0,
          }))
        );
      }
      
      const specialtyList = await getAllSpecialties(selectedCity);
      setSpecialties(specialtyList);
    } catch (err) {
      console.error('Error fetching hospitals:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCity]);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  // ============================
  // FETCH DOCTORS
  // ============================
  const fetchDoctors = async (hospitalId) => {
    setDoctorsLoading(true);
    try {
      const data = await getDoctorsForHospital(hospitalId);
      const withQueue = await Promise.all(
        data.map(async (doc) => ({
          ...doc,
          liveQueue: await getWaitingCount(doc.id),
        }))
      );
      setDoctors(withQueue);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setDoctorsLoading(false);
    }
  };

  const handleHospitalSelect = (hospital) => {
    setSelectedHospital(hospital);
    setSelectedDoctor(null);
    fetchDoctors(hospital.id);
  };

  const handleBackToHospitals = () => {
    setSelectedHospital(null);
    setSelectedDoctor(null);
  };

  // ============================
  // BOOKING
  // ============================
  const handleBookDoctor = (doctor) => {
    if (isGuest) {
      alert('Please login or create an account to book appointments.');
      return;
    }
    setSelectedDoctor(doctor);
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async (paymentMethod) => {
    if (!selectedDoctor || !user) return;
    
    setBookingLoading(true);
    try {
      const result = await bookAppointment(
        user.id,
        selectedDoctor.id,
        selectedDoctor.hospital_id,
        paymentMethod,
        null,
        null,
        null
      );
      
      if (result.error) throw result.error;
      
      setBookingData(result.data);
      setShowPaymentModal(false);
      setShowTicket(true);
      setCurrentBookingId(result.data.id);
      
      fetchDoctors(selectedDoctor.hospital_id);
    } catch (err) {
      console.error('Booking error:', err);
      alert('Failed to book appointment. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  // ============================
  // CANCEL BOOKING
  // ============================
  const handleCancelBooking = async (bookingId) => {
    try {
      await cancelAppointment(bookingId);
      setShowTicket(false);
      setCurrentBookingId(null);
      setBookingData(null);
      if (selectedHospital) {
        fetchDoctors(selectedHospital.id);
      }
    } catch (err) {
      console.error('Cancel error:', err);
    }
  };

  // ============================
  // RENDER HELPERS
  // ============================
  const getStatusBadge = (status) => {
    const configs = {
      available: { label: 'Available', className: 'status-available' },
      busy: { label: 'Busy', className: 'status-busy' },
      paused: { label: 'Paused', className: 'status-paused' },
      unavailable: { label: 'Unavailable', className: 'status-unavailable' },
      completed: { label: 'Done for Today', className: 'status-completed' },
      on_leave: { label: 'On Leave', className: 'status-on-leave' },
    };
    const config = configs[status] || configs.unavailable;
    return <span className={`doctor-status-badge ${config.className}`}>{config.label}</span>;
  };

  const isDoctorAvailable = (doctor) => {
    return doctor.status === 'available' || doctor.status === 'busy';
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  // ============================
  // FILTERED DOCTORS
  // ============================
  const filteredDoctors = doctors.filter((doc) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      doc.name.toLowerCase().includes(term) ||
      doc.specialty.toLowerCase().includes(term)
    );
  });

  const filteredHospitals = hospitals.filter((h) => {
    if (!searchTerm) return true;
    return h.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // ============================
  // RENDER
  // ============================
  return (
    <div className="hospital-flow">
      {showTicket && currentBookingId && (
        <div className="hospital-flow-ticket-overlay">
          <BookingTicket
            bookingId={currentBookingId}
            onClose={() => setShowTicket(false)}
            onCancel={handleCancelBooking}
            user={user}
          />
        </div>
      )}

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedDoctor(null);
        }}
        onConfirm={handlePaymentConfirm}
        doctorName={selectedDoctor?.name || ''}
        fee={selectedDoctor?.consultation_fee || 0}
        loading={bookingLoading}
      />

      <div className="hospital-flow-header">
        <div className="hospital-flow-greeting">
          <h1>
            {isGuest ? t.greeting : `Welcome back,`}
            {!isGuest && <span className="greeting-name">{displayName}</span>}
          </h1>
          <p className="hospital-flow-subtitle">
            {isGuest ? t.browsingAs : 'Find the right care, without the wait'}
          </p>
        </div>

        <div className="hospital-flow-city-selector">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="city-select"
          >
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="hospital-flow-controls">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search hospitals or doctors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              className="search-clear"
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>

        {specialties.length > 0 && (
          <div className="specialty-filters">
            <button
              className={`specialty-chip ${selectedSpecialty === '' ? 'active' : ''}`}
              onClick={() => setSelectedSpecialty('')}
            >
              All
            </button>
            {specialties.slice(0, 12).map((s) => (
              <button
                key={s}
                className={`specialty-chip ${selectedSpecialty === s ? 'active' : ''}`}
                onClick={() => setSelectedSpecialty(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="hospital-flow-loading">
          <div className="loading-spinner"></div>
          <p>Loading healthcare services...</p>
        </div>
      ) : !selectedHospital ? (
        <div className="hospital-list">
          {filteredHospitals.length === 0 ? (
            <div className="hospital-empty">
              <span className="empty-icon">🏥</span>
              <h3>No hospitals found</h3>
              <p>Try searching for a different city or term</p>
            </div>
          ) : (
            filteredHospitals.map((hospital) => (
              <div
                key={hospital.id}
                className="hospital-card"
                onClick={() => handleHospitalSelect(hospital)}
              >
                <div className="hospital-card-content">
                  <div className="hospital-info">
                    <h3 className="hospital-name">{hospital.name}</h3>
                    <p className="hospital-location">
                      📍 {hospital.location || hospital.city}
                    </p>
                  </div>
                  <div className="hospital-meta">
                    <span className="hospital-doctor-count">
                      👨‍⚕️ {hospital.availableDoctors || 0} doctors available
                    </span>
                    <span className="hospital-arrow">→</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="doctor-list-view">
          <div className="doctor-list-header">
            <button className="back-button" onClick={handleBackToHospitals}>
              ← Back to hospitals
            </button>
            <h2 className="doctor-list-title">
              {selectedHospital.name}
            </h2>
            <p className="doctor-list-subtitle">
              {doctors.length} doctors available
            </p>
          </div>

          {doctorsLoading ? (
            <div className="doctor-list-loading">
              <div className="loading-spinner"></div>
              <p>Loading doctors...</p>
            </div>
          ) : (
            <div className="doctor-list">
              {filteredDoctors.length === 0 ? (
                <div className="doctor-empty">
                  <span className="empty-icon">👨‍⚕️</span>
                  <h3>No doctors found</h3>
                  <p>Try adjusting your search</p>
                </div>
              ) : (
                filteredDoctors.map((doctor) => (
                  <div key={doctor.id} className="doctor-card">
                    <div className="doctor-card-header">
                      <div className="doctor-info">
                        <h4 className="doctor-name">{doctor.name}</h4>
                        <p className="doctor-specialty">{doctor.specialty}</p>
                        {doctor.degrees && (
                          <p className="doctor-degrees">{doctor.degrees}</p>
                        )}
                      </div>
                      {getStatusBadge(doctor.status)}
                    </div>

                    <div className="doctor-details">
                      <div className="doctor-detail-item">
                        <span className="detail-label">Queue</span>
                        <span className="detail-value">{doctor.liveQueue || 0} waiting</span>
                      </div>
                      <div className="doctor-detail-item">
                        <span className="detail-label">Fee</span>
                        <span className="detail-value">₹{doctor.consultation_fee || 0}</span>
                      </div>
                      <div className="doctor-detail-item">
                        <span className="detail-label">Schedule</span>
                        <span className="detail-value">
                          {doctor.start_time && doctor.end_time
                            ? `${formatTime(doctor.start_time)} - ${formatTime(doctor.end_time)}`
                            : 'Flexible'}
                        </span>
                      </div>
                    </div>

                    {doctor.working_days && doctor.working_days.length > 0 && (
                      <div className="doctor-working-days">
                        <span className="working-days-label">Working Days:</span>
                        <span className="working-days-list">
                          {doctor.working_days.join(', ')}
                        </span>
                      </div>
                    )}

                    <div className="doctor-actions">
                      {isDoctorAvailable(doctor) ? (
                        <button
                          className="doctor-book-btn"
                          onClick={() => handleBookDoctor(doctor)}
                          disabled={!user && !isGuest}
                        >
                          Book Token
                        </button>
                      ) : (
                        <button className="doctor-book-btn disabled" disabled>
                          {doctor.status === 'completed' ? 'Done for Today' : 'Unavailable'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HospitalFlow;
