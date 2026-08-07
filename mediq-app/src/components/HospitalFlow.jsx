import { useState } from 'react';

const CITY_DATA = {
  'Kolkata': [
    { id: 'h1', name: 'City Care Hospital', location: 'Bidhannagar', doctors: [
      { id: 'd1', name: 'Dr. A. K. Roy', spec: 'Cardiologist', timing: '10:00 AM - 02:00 PM', status: 'In Chamber', liveQueue: 4 },
      { id: 'd2', name: 'Dr. S. Banerjee', spec: 'General Physician', timing: '05:00 PM - 08:00 PM', status: 'On The Way', liveQueue: 12 }
    ]},
    { id: 'h2', name: 'Apollo Clinic', location: 'Park Circus', doctors: [
      { id: 'd3', name: 'Dr. M. Das', spec: 'Dermatologist', timing: '11:00 AM - 03:00 PM', status: 'In Chamber', liveQueue: 2 }
    ]}
  ],
  'Darjeeling': [
    { id: 'h3', name: 'Darjeeling Heights Healthcare', location: 'Mall Road', doctors: [
      { id: 'd4', name: 'Dr. P. Sharma', spec: 'Pediatrician', timing: '09:00 AM - 01:00 PM', status: 'Not Visited Yet', liveQueue: 0 }
    ]}
  ],
  'Shantiniketan': [
    { id: 'h4', name: 'Green View Medical Centre', location: 'Bolpur', doctors: [
      { id: 'd5', name: 'Dr. R. Chatterjee', spec: 'Orthopedic', timing: '04:00 PM - 07:00 PM', status: 'In Chamber', liveQueue: 7 }
    ]}
  ]
};

export default function HospitalFlow({ user, onLogout }) {
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedHospital, setSelectedHospital] = useState(null);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
        <div>
          <h3 style={{ margin: 0, color: '#0f172a' }}>MediQ Dashboard</h3>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Logged in as: {user?.email}</p>
        </div>
        <button onClick={onLogout} style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Logout</button>
      </div>

      {!selectedCity && (
        <div>
          <h3>📍 Step 1: Select Your City</h3>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Choose your city to view nearby hospitals and clinics:</p>
          <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
            {Object.keys(CITY_DATA).map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                style={{ padding: '16px', textAlign: 'left', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                🏢 {city}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedCity && !selectedHospital && (
        <div>
          <button onClick={() => setSelectedCity('')} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, marginBottom: '12px' }}>← Back to Cities</button>
          <h3>🏥 Hospitals in {selectedCity}</h3>
          <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
            {CITY_DATA[selectedCity]?.map((hosp) => (
              <div
                key={hosp.id}
                onClick={() => setSelectedHospital(hosp)}
                style={{ padding: '16px', border: '1px solid #cbd5e1', borderRadius: '12px', cursor: 'pointer', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
              >
                <h4 style={{ margin: '0 0 4px', color: '#1e293b' }}>{hosp.name}</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>📍 {hosp.location}</p>
                <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#2563eb', fontWeight: '600' }}>{hosp.doctors.length} Doctors Available Today →</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedHospital && (
        <div>
          <button onClick={() => setSelectedHospital(null)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, marginBottom: '12px' }}>← Back to Hospitals</button>
          <h3>🩺 Doctors at {selectedHospital.name}</h3>

          <div style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
            {selectedHospital.doctors.map((doc) => (
              <div key={doc.id} style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '14px', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '18px', color: '#0f172a' }}>{doc.name}</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#2563eb', fontWeight: '600' }}>{doc.spec}</p>
                  </div>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: doc.status === 'In Chamber' ? '#dcfce7' : doc.status === 'On The Way' ? '#fef9c3' : '#f1f5f9',
                    color: doc.status === 'In Chamber' ? '#15803d' : doc.status === 'On The Way' ? '#a16207' : '#64748b'
                  }}>
                    ● {doc.status}
                  </span>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569' }}>
                  <div>🕒 Timings: <strong>{doc.timing}</strong></div>
                  <div>🎟️ Queue: <strong>{doc.liveQueue} Patients</strong></div>
                </div>

                <button style={{ width: '100%', marginTop: '16px', padding: '10px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Book Token / Join Queue
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}