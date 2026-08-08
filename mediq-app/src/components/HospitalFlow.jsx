import { useState } from 'react';

const CITY_DATA = {
  'Kolkata': [
    { id: 'h1', name: 'City Care Hospital', location: 'Bidhannagar', rating: '4.8 ★', image: '🏥', doctors: [
      { id: 'd1', name: 'Dr. A. K. Roy', spec: 'Cardiologist', timing: '10:00 AM - 02:00 PM', status: 'In Chamber', liveQueue: 4, exp: '14 yrs exp' },
      { id: 'd2', name: 'Dr. S. Banerjee', spec: 'General Physician', timing: '05:00 PM - 08:00 PM', status: 'On The Way', liveQueue: 12, exp: '9 yrs exp' }
    ]},
    { id: 'h2', name: 'Apollo Clinic', location: 'Park Circus', rating: '4.9 ★', image: '🩺', doctors: [
      { id: 'd3', name: 'Dr. M. Das', spec: 'Dermatologist', timing: '11:00 AM - 03:00 PM', status: 'In Chamber', liveQueue: 2, exp: '11 yrs exp' }
    ]}
  ],
  'Darjeeling': [
    { id: 'h3', name: 'Darjeeling Heights Healthcare', location: 'Mall Road', rating: '4.7 ★', image: '🏔️', doctors: [
      { id: 'd4', name: 'Dr. P. Sharma', spec: 'Pediatrician', timing: '09:00 AM - 01:00 PM', status: 'Not Visited Yet', liveQueue: 0, exp: '8 yrs exp' }
    ]}
  ],
  'Shantiniketan': [
    { id: 'h4', name: 'Green View Medical Centre', location: 'Bolpur', rating: '4.6 ★', image: '🌿', doctors: [
      { id: 'd5', name: 'Dr. R. Chatterjee', spec: 'Orthopedic', timing: '04:00 PM - 07:00 PM', status: 'In Chamber', liveQueue: 7, exp: '16 yrs exp' }
    ]}
  ]
};

export default function HospitalFlow({ user, onLogout }) {
  const [lang, setLang] = useState(user?.user_metadata?.language || 'en');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Extract patient's first name (or fallback to email prefix)
  const rawName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Patient';
  const firstName = rawName.split(' ')[0];
  const avatarLetter = firstName.charAt(0).toUpperCase();

  // Simple UI translations
  const labels = {
    en: { selectCity: 'Find Healthcare in Your City', changeCity: 'Change City', backHosp: 'Back to Hospitals', doctorsLive: 'Doctors Live', searchPlaceholder: '🔍 Search doctor by name or specialty...' },
    bn: { selectCity: 'আপনার শহরের স্বাস্থ্যসেবা খুঁজুন', changeCity: 'শহর পরিবর্তন করুন', backHosp: 'হাসপাতালে ফিরে যান', doctorsLive: 'ডাক্তার উপলব্ধ', searchPlaceholder: '🔍 ডাক্তার বা বিশেষজ্ঞ খুঁজুন...' },
    hi: { selectCity: 'अपने शहर में स्वास्थ्य सेवा खोजें', changeCity: 'शहर बदलें', backHosp: 'अस्पताल वापस जाएं', doctorsLive: 'डॉक्टर उपलब्ध', searchPlaceholder: '🔍 नाम या विशेषता द्वारा खोजें...' }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#0f172a', paddingBottom: '40px' }}>
      
      {/* Top Header */}
      <nav style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '14px 24px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px' }}>✙</div>
            <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>Medi<span style={{ color: '#2563eb' }}>Q</span></span>
          </div>
          
          {/* Right Nav: Language & Premium Patient Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            
            {/* Language Switcher */}
            <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value)}
              style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#f8fafc', cursor: 'pointer' }}
            >
              <option value="en">English</option>
              <option value="bn">বাংলা</option>
              <option value="hi">हिंदी</option>
            </select>

            {/* Premium Patient Name Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '5px 12px 5px 6px', borderRadius: '30px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                {avatarLetter}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>Patient</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a8a' }}>{firstName}</div>
              </div>
            </div>

            <button onClick={onLogout} style={{ padding: '8px 12px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
              Exit
            </button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: '800px', margin: '28px auto 0', padding: '0 20px' }}>
        
        {/* STEP 1: CITY SELECTOR */}
        {!selectedCity && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 8px' }}>{labels[lang].selectCity}</h1>
              <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Welcome back, <strong style={{ color: '#2563eb' }}>{firstName}</strong>! Select your location to view live queues.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {Object.keys(CITY_DATA).map((city) => (
                <div
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏢</div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '700' }}>{city}</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{CITY_DATA[city].length} Partner Hospitals</p>
                  <div style={{ marginTop: '16px', fontSize: '13px', fontWeight: '600', color: '#2563eb' }}>Explore →</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: HOSPITAL SELECTOR */}
        {selectedCity && !selectedHospital && (
          <div>
            <button onClick={() => setSelectedCity('')} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, marginBottom: '20px', fontWeight: '600' }}>
              ← {labels[lang].changeCity} ({selectedCity})
            </button>

            <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 16px' }}>Hospitals in {selectedCity}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {CITY_DATA[selectedCity]?.map((hosp) => (
                <div
                  key={hosp.id}
                  onClick={() => setSelectedHospital(hosp)}
                  style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>{hosp.image}</div>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '700' }}>{hosp.name}</h3>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>📍 {hosp.location} • <span style={{ color: '#f59e0b', fontWeight: '700' }}>{hosp.rating}</span></p>
                    </div>
                  </div>
                  <span style={{ padding: '6px 12px', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                    {hosp.doctors.length} {labels[lang].doctorsLive}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: DOCTOR LIST & LIVE CHAMBER STATUS */}
        {selectedHospital && (
          <div>
            <button onClick={() => setSelectedHospital(null)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, marginBottom: '20px', fontWeight: '600' }}>
              ← {labels[lang].backHosp}
            </button>

            <div style={{ backgroundColor: '#1e293b', color: '#ffffff', borderRadius: '20px', padding: '24px', marginBottom: '24px', boxShadow: '0 10px 20px rgba(0,0,0,0.08)' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Selected Hospital</span>
              <h2 style={{ margin: '4px 0 6px', fontSize: '24px', fontWeight: '800' }}>{selectedHospital.name}</h2>
              <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1' }}>📍 {selectedHospital.location} • {selectedCity}</p>
            </div>

            <input
              type="text"
              placeholder={labels[lang].searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', marginBottom: '20px', boxSizing: 'border-box', outline: 'none' }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedHospital.doctors
                .filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.spec.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((doc) => (
                  <div key={doc.id} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: '19px', fontWeight: '700' }}>{doc.name}</h4>
                        <p style={{ margin: 0, fontSize: '14px', color: '#2563eb', fontWeight: '600' }}>{doc.spec}</p>
                      </div>
                      <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', backgroundColor: doc.status === 'In Chamber' ? '#dcfce7' : '#fef9c3', color: doc.status === 'In Chamber' ? '#15803d' : '#a16207' }}>
                        ● {doc.status}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '16px', fontSize: '13px' }}>
                      <div>🕒 Timing: <strong>{doc.timing}</strong></div>
                      <div>🎟️ Queue: <strong>{doc.liveQueue} Patients Ahead</strong></div>
                    </div>

                    <button style={{ width: '100%', padding: '14px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                      Book Token for {firstName}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}