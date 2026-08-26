import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function BloodHub({ user }) {
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'donors' or 'new'
  const [requests, setRequests] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Request Form State
  const [patientName, setPatientName] = useState('');
  const [bloodGroupNeeded, setBloodGroupNeeded] = useState('O+');
  const [units, setUnits] = useState(1);
  const [hospitalName, setHospitalName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [urgency, setUrgency] = useState('Emergency');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Donor Registration State
  const [donorName, setDonorName] = useState('');
  const [donorBloodGroup, setDonorBloodGroup] = useState('O+');
  const [donorPhone, setDonorPhone] = useState('');
  const [donorCity, setDonorCity] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    fetchBloodData();
  }, [activeTab]);

  async function fetchBloodData() {
    setLoading(true);
    if (activeTab === 'requests') {
      const { data, error } = await supabase
        .from('blood_requests')
        .select('*')
        .eq('status', 'Active')
        .order('created_at', { ascending: false });
      if (!error) setRequests(data || []);
    } else if (activeTab === 'donors') {
      const { data, error } = await supabase
        .from('blood_donors')
        .select('*')
        .eq('is_available', true);
      if (!error) setDonors(data || []);
    }
    setLoading(false);
  }

  async function handleCreateRequest(e) {
    e.preventDefault();
    if (!patientName || !hospitalName || !contactNumber) {
      alert('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('blood_requests').insert({
      patient_id: user?.id || null,
      patient_name: patientName,
      blood_group: bloodGroupNeeded,
      units: parseInt(units),
      hospital_name: hospitalName,
      contact_number: contactNumber,
      urgency: urgency,
      status: 'Active'
    });

    setSubmitting(false);
    if (error) {
      console.error('Error posting request:', error);
      alert('Could not post blood request. Ensure table exists in Supabase.');
    } else {
      setSuccessMsg('Emergency blood request broadcasted successfully!');
      setPatientName('');
      setHospitalName('');
      setContactNumber('');
      setActiveTab('requests');
      fetchBloodData();
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  }

  async function handleRegisterDonor(e) {
    e.preventDefault();
    if (!donorName || !donorPhone || !donorCity) {
      alert('Please complete all donor details.');
      return;
    }

    setIsRegistering(true);
    const { error } = await supabase.from('blood_donors').insert({
      user_id: user?.id || null,
      name: donorName,
      blood_group: donorBloodGroup,
      phone: donorPhone,
      city: donorCity,
      is_available: true
    });

    setIsRegistering(false);
    if (error) {
      console.error('Error registering donor:', error);
      alert('Could not register as donor.');
    } else {
      alert('Thank you! You are now registered as a MediQ Lifesaver.');
      setActiveTab('donors');
      fetchBloodData();
    }
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '650px',
      margin: '0 auto',
      padding: '20px 16px 100px',
      boxSizing: 'border-box',
      backgroundColor: 'transparent'
    }}>
      {/* HERO BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
        borderRadius: '24px',
        padding: '24px',
        color: '#fff',
        marginBottom: '20px',
        boxShadow: '0 10px 25px rgba(127, 29, 29, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', background: '#d4af37', color: '#0b332c', padding: '2px 8px', borderRadius: '6px', fontWeight: '800', marginBottom: '8px', display: 'inline-block' }}>
            🩸 Emergency Network
          </span>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '22px', margin: '0 0 6px', color: '#fff' }}>
            MediQ Blood Bridge
          </h1>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: '1.4', maxWidth: '340px' }}>
            Connect instantly with volunteer donors and active emergency blood requests in your area.
          </p>
        </div>

        <div style={{ position: 'absolute', right: '-10px', bottom: '-15px', fontSize: '75px', opacity: 0.2, pointerEvents: 'none' }}>
          ❤️
        </div>
      </div>

      {successMsg && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '12px 16px', borderRadius: '14px', marginBottom: '16px', fontSize: '13px', fontWeight: '700', textAlign: 'center' }}>
          {successMsg}
        </div>
      )}

      {/* NAVIGATION SUB-TABS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
        {[
          { id: 'requests', label: '🚨 Active Requests' },
          { id: 'donors', label: '🤝 Find Donors' },
          { id: 'new', label: '➕ Request Blood' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 8px',
              borderRadius: '14px',
              border: activeTab === tab.id ? '2px solid #0b332c' : '1px solid #e2e8f0',
              background: activeTab === tab.id ? '#f0fdf4' : '#fff',
              color: '#0b332c',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              textAlign: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ACTIVE REQUESTS */}
      {activeTab === 'requests' && (
        <div>
          <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', color: '#0b332c', margin: '0 0 12px' }}>
            Live Emergency Blood Broadcasts
          </h3>
          
          {loading && (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Loading requests...</div>
          )}

          {!loading && requests.length === 0 && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '30px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>No active emergency requests right now. All clear!</p>
            </div>
          )}

          {!loading && requests.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {requests.map((req) => (
                <div key={req.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '6px', fontWeight: '800', marginRight: '6px' }}>
                        {req.urgency}
                      </span>
                      <strong style={{ fontSize: '15px', color: '#0b332c' }}>{req.blood_group} Needed</strong>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '700', background: '#f8f6f0', padding: '4px 10px', borderRadius: '8px', color: '#0b332c' }}>
                      {req.units} Unit(s)
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#334155', marginBottom: '4px' }}>
                    🏥 Hospital: <strong>{req.hospital_name}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                    Patient: {req.patient_name} • Posted {new Date(req.created_at).toLocaleDateString()}
                  </div>
                  <a
                    href={`tel:${req.contact_number}`}
                    style={{
                      display: 'block', textAlign: 'center', background: '#0b332c', color: '#fff',
                      padding: '10px', borderRadius: '10px', textDecoration: 'none', fontSize: '12.5px', fontWeight: '700'
                    }}
                  >
                    📞 Call Emergency Contact ({req.contact_number})
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FIND DONORS */}
      {activeTab === 'donors' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', color: '#0b332c', margin: 0 }}>
              Registered Voluntary Donors
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('registerDonor')}
              style={{ background: '#d4af37', color: '#0b332c', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer' }}
            >
              + Register as Donor
            </button>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Loading donors...</div>
          )}

          {!loading && donors.length === 0 && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '30px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 10px' }}>No active donors found in your registry yet.</p>
              <button onClick={() => setActiveTab('registerDonor')} style={{ background: '#0b332c', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                Become the First Donor
              </button>
            </div>
          )}

          {!loading && donors.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {donors.map((d) => (
                <div key={d.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: '6px', fontWeight: '800' }}>
                        {d.blood_group}
                      </span>
                      <strong style={{ fontSize: '14px', color: '#0b332c' }}>{d.name}</strong>
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>📍 {d.city || 'Local Area'}</span>
                  </div>
                  <a
                    href={`tel:${d.phone}`}
                    style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}
                  >
                    Call ↗
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REQUEST BLOOD FORM */}
      {activeTab === 'new' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', color: '#0b332c', margin: '0 0 4px' }}>
            Broadcast Emergency Request
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px' }}>
            Fill out details to notify emergency contacts and local donors.
          </p>

          <form onSubmit={handleCreateRequest} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#0b332c', display: 'block', marginBottom: '4px' }}>Patient Name *</label>
              <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="e.g., Rahul Sharma" required style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#0b332c', display: 'block', marginBottom: '4px' }}>Blood Group</label>
                <select value={bloodGroupNeeded} onChange={(e) => setBloodGroupNeeded(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}>
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#0b332c', display: 'block', marginBottom: '4px' }}>Units Required</label>
                <input type="number" min="1" max="10" value={units} onChange={(e) => setUnits(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#0b332c', display: 'block', marginBottom: '4px' }}>Hospital Name & Address *</label>
              <input type="text" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} placeholder="e.g., Apollo Hospital, Kolkata" required style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#0b332c', display: 'block', marginBottom: '4px' }}>Contact Phone Number *</label>
              <input type="tel" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="e.g., +91 9876543210" required style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} />
            </div>

            <button type="submit" disabled={submitting} style={{ background: '#7f1d1d', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontSize: '13.5px', fontWeight: '800', cursor: 'pointer', marginTop: '6px' }}>
              {submitting ? 'Broadcasting...' : '🚨 Broadcast Blood Request'}
            </button>
          </form>
        </div>
      )}

      {/* REGISTER DONOR SUB-VIEW */}
      {activeTab === 'registerDonor' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', color: '#0b332c', margin: '0 0 4px' }}>
            Register as a Blood Donor
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px' }}>
            Save lives by offering your assistance when emergencies happen.
          </p>

          <form onSubmit={handleRegisterDonor} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#0b332c', display: 'block', marginBottom: '4px' }}>Full Name *</label>
              <input type="text" value={donorName} onChange={(e) => setDonorName(e.target.value)} placeholder="Your Name" required style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#0b332c', display: 'block', marginBottom: '4px' }}>Blood Group</label>
                <select value={donorBloodGroup} onChange={(e) => setDonorBloodGroup(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}>
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#0b332c', display: 'block', marginBottom: '4px' }}>City *</label>
                <input type="text" value={donorCity} onChange={(e) => setDonorCity(e.target.value)} placeholder="e.g., Kolkata" required style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#0b332c', display: 'block', marginBottom: '4px' }}>Phone Number *</label>
              <input type="tel" value={donorPhone} onChange={(e) => setDonorPhone(e.target.value)} placeholder="+91..." required style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
            </div>

            <button type="submit" disabled={isRegistering} style={{ background: '#0b332c', color: '#d4af37', border: 'none', padding: '12px', borderRadius: '12px', fontSize: '13.5px', fontWeight: '800', cursor: 'pointer', marginTop: '6px' }}>
              {isRegistering ? 'Registering...' : '🤝 Confirm Donor Registration'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
