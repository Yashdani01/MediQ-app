import { useState, useEffect } from 'react';
import BookingTicket from './BookingTicket';
import { getHospitals, getDoctorsForHospital, getWaitingCount, bookAppointment } from '../hospitalData';

export default function HospitalFlow({ user, isGuest, onLogout }) {
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [bookingError, setBookingError] = useState('');

  // Load hospitals on first render
  useEffect(() => {
    getHospitals().then((data) => {
      setHospitals(data);
      setLoadingHospitals(false);
    });
  }, []);

  // Load doctors whenever a hospital is selected
  useEffect(() => {
    if (!selectedHospital) return;
    setLoadingDoctors(true);
    getDoctorsForHospital(selectedHospital.id).then(async (docs) => {
      // attach live queue count to each doctor
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

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
        <div>
          <h3 style={{ margin: 0, color: '#0f172a' }}>MediQ Dashboard</h3>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
            {isGuest ? 'Browsing as Guest' : `Logged in as: ${user?.email}`}
          </p>
        </div>
        <button onClick={onLogout} style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Logout</button>
      </div>

      {!selectedHospital && (
        <div>
          <h3>🏥 Available Hospitals</h3>
          {loadingHospitals ? (
            <p style={{ color: '#64748b' }}>Loading hospitals...</p>
          ) : hospitals.length === 0 ? (
            <p style={{ color: '#64748b' }}>No hospitals available yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
              {hospitals.map((hosp) => (
                <div
                  key={hosp.id}
                  onClick={() => setSelectedHospital(hosp)}
                  style={{ padding: '16px', border: '1px solid #cbd5e1', borderRadius: '12px', cursor: 'pointer', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                >
                  <h4 style={{ margin: '0 0 4px', color: '#1e293b' }}>{hosp.name}</h4>
                  {hosp.location && <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>📍 {hosp.location}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedHospital && (
        <div>
          <button onClick={() => { setSelectedHospital(null); setDoctors([]); }} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, marginBottom: '12px' }}>← Back to Hospitals</button>
          <h3>🩺 Doctors at {selectedHospital.name}</h3>

          {loadingDoctors ? (
            <p style={{ color: '#64748b' }}>Loading doctors...</p>
          ) : doctors.length === 0 ? (
            <p style={{ color: '#64748b' }}>No doctors listed for this hospital yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
              {doctors.map((doc) => (
                <div key={doc.id} style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '14px', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '18px', color: '#0f172a' }}>{doc.name}</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#2563eb', fontWeight: '600' }}>{doc.specialty}</p>

                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '13px', color: '#475569' }}>
                    🎟️ Currently waiting: <strong>{doc.liveQueue} Patients</strong>
                  </div>

                  <button
                    onClick={() => handleBookToken(doc)}
                    style={{ width: '100%', marginTop: '16px', padding: '10px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Book Token / Join Queue
                  </button>
                </div>
              ))}
            </div>
          )}

          {bookingError && <p style={{ color: '#dc2626', marginTop: '12px' }}>{bookingError}</p>}
        </div>
      )}

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