import { useState, useEffect } from 'react';
import {
  checkClinicPin, getDoctorsForClinic, addDoctor, updateDoctor,
  deleteDoctor, updateDoctorStatus, addWalkinBooking,
  getHospitalUpi, updateHospitalUpi, getTodaysBookings, markAppointmentSeen,
  getHospitalLocation, updateHospitalLocation, cancelAppointment, checkInAppointment,
} from '../hospitalData';
import { supabase } from '../supabaseClient';
import './Login.css';

const SPECIALTIES = [
  'General Physician', 'Gynecologist', 'Orthopedic', 'ENT Specialist', 'Dermatologist',
  'Pediatrician', 'Cardiologist', 'Dentist', 'Ophthalmologist', 'Psychiatrist',
  'Neurologist', 'Urologist', 'Gastroenterologist', 'General Surgeon', 'Diabetologist',
  'Nephrologist', 'Pulmonologist', 'Homeopath', 'Ayurvedic Physician', 'Physiotherapist',
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 16, boxShadow: '0 8px 24px 0 rgba(0,0,0,0.25)' };
const panelInputStyle = { width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: '#131b18', color: '#fff', fontSize: 14, boxSizing: 'border-box', outline: 'none' };
const pillPrimaryBtn = { border: 'none', background: 'linear-gradient(90deg, #10b981 25%, #059669 75%)', color: '#fff', fontWeight: 700, cursor: 'pointer', borderRadius: 100, boxShadow: '0 4px 8px rgba(16,185,129,0.2)' };
const pillGhostBtn = { border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontWeight: 700, cursor: 'pointer', borderRadius: 100 };
const pillDangerBtn = { border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontWeight: 700, cursor: 'pointer', borderRadius: 100 };

export default function ClinicPortal() {
  const [pin, setPin] = useState('');
  const [unlockedPin, setUnlockedPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [clinicName, setClinicName] = useState('Clinic Portal');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [doctors, setDoctors] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [upiId, setUpiId] = useState('');
  const [upiInput, setUpiInput] = useState('');
  const [savingUpi, setSavingUpi] = useState(false);
  const [editingUpi, setEditingUpi] = useState(false);

  const [locationStr, setLocationStr] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [savingLocation, setSavingLocation] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);

  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Add Doctor Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDegrees, setNewDegrees] = useState('MBBS, MD');
  const [newPtr, setNewPtr] = useState('99.0');
  const [newSpecialties, setNewSpecialties] = useState(['General Physician']);
  const [newAvgMinutes, setNewAvgMinutes] = useState('10');
  const [newFee, setNewFee] = useState('');
  const [daySchedules, setDaySchedules] = useState({
    Mon: { active: true, start: '10:00', end: '14:00' },
    Tue: { active: true, start: '10:00', end: '14:00' },
    Wed: { active: true, start: '10:00', end: '14:00' },
    Thu: { active: true, start: '10:00', end: '14:00' },
    Fri: { active: true, start: '10:00', end: '14:00' },
    Sat: { active: true, start: '10:00', end: '13:00' },
    Sun: { active: false, start: '10:00', end: '13:00' },
  });
  const [savingDoctor, setSavingDoctor] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDegrees, setEditDegrees] = useState('');
  const [editPtr, setEditPtr] = useState('');
  const [editSpecialties, setEditSpecialties] = useState([]);
  const [editFee, setEditFee] = useState('');
  const [editDaySchedules, setEditDaySchedules] = useState({});

  const [showWalkinForm, setShowWalkinForm] = useState(null);
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');

  const [expandedDoctor, setExpandedDoctor] = useState(null);
  const [bookingsByDoctor, setBookingsByDoctor] = useState({});
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [updatingPatient, setUpdatingPatient] = useState(null);
  const [viewScreenshotModal, setViewScreenshotModal] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hId = params.get('hospital_id');
    if (hId) {
      supabase.from('hospitals').select('name').eq('id', hId).maybeSingle().then(({ data }) => {
        if (data?.name) setClinicName(data.name);
      });
    }
  }, []);

  const loadDoctors = async (currentPin) => {
    if (!currentPin) return;
    setRefreshing(true);
    const data = await getDoctorsForClinic(currentPin);
    setDoctors(data || []);

    if (data && data.length > 0) {
      const bookingsMap = {};
      for (const doc of data) {
        const b = await getTodaysBookings(currentPin, doc.id);
        bookingsMap[doc.id] = b || [];
      }
      setBookingsByDoctor(bookingsMap);
    }
    setRefreshing(false);
  };

  const loadUpi = async (currentPin) => {
    if (!currentPin) return;
    const data = await getHospitalUpi(currentPin);
    setUpiId(data || '');
    setUpiInput(data || '');
  };

  const loadLocation = async (currentPin) => {
    if (!currentPin) return;
    const data = await getHospitalLocation(currentPin);
    setLocationStr(data || '');
    setLocationInput(data || '');
  };

  useEffect(() => {
    if (unlocked && unlockedPin) {
      loadDoctors(unlockedPin);
      loadUpi(unlockedPin);
      loadLocation(unlockedPin);
      const interval = setInterval(() => loadDoctors(unlockedPin), 30000);
      return () => clearInterval(interval);
    }
  }, [unlocked, unlockedPin]);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const cleanPin = pin.trim();
    const hospitalId = await checkClinicPin(cleanPin);
    setLoading(false);
    if (!hospitalId) {
      setError('Invalid Access PIN. Please try again.');
      return;
    }

    const { data: hospData } = await supabase.from('hospitals').select('name').eq('id', hospitalId).maybeSingle();
    if (hospData?.name) {
      setClinicName(hospData.name);
    }

    setUnlockedPin(cleanPin);
    setUnlocked(true);
  };

  const handleLogout = () => {
    setUnlocked(false);
    setUnlockedPin('');
    setPin('');
    setDoctors([]);
    setExpandedDoctor(null);
    setBookingsByDoctor({});
  };

  const handleSaveUpi = async () => {
    setSavingUpi(true);
    const { error } = await updateHospitalUpi(unlockedPin, upiInput.trim());
    setSavingUpi(false);
    if (error) { setError('Could not save UPI ID.'); return; }
    setUpiId(upiInput.trim());
    setEditingUpi(false);
  };

  const handleSaveLocation = async () => {
    setSavingLocation(true);
    const { error } = await updateHospitalLocation(unlockedPin, locationInput.trim());
    setSavingLocation(false);
    if (error) { setError('Could not save location.'); return; }
    setLocationStr(locationInput.trim());
    setEditingLocation(false);
  };

  const toggleSpecialty = (spec, list, setList) => {
    if (list.includes(spec)) {
      if (list.length > 1) setList(list.filter(s => s !== spec));
    } else {
      setList([...list, spec]);
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (!newName.trim()) { alert('Please enter doctor name.'); return; }
    setSavingDoctor(true);
    setError('');

    const activeDays = Object.keys(daySchedules).filter(d => daySchedules[d].active);

    try {
      const res = await addDoctor(
        unlockedPin,
        newName.trim(),
        newSpecialties.join(', '),
        parseInt(newAvgMinutes) || 10,
        activeDays,
        daySchedules['Mon'].start || '10:00',
        daySchedules['Mon'].end || '14:00',
        JSON.stringify(daySchedules),
        newFee ? parseFloat(newFee) : 0
      );

      // Save custom fields via direct supabase update if helper doesn't cover extra columns
      const { data: latestDocs } = await getDoctorsForClinic(unlockedPin);
      const justAdded = latestDocs[latestDocs.length - 1];
      if (justAdded) {
        await supabase.from('doctors').update({
          degrees: newDegrees,
          ptr_score: parseFloat(newPtr) || 99.0,
          specialties: newSpecialties,
          custom_schedule: daySchedules
        }).eq('id', justAdded.id);
      }

      setNewName('');
      setNewDegrees('MBBS, MD');
      setNewPtr('99.0');
      setNewSpecialties(['General Physician']);
      setNewFee('');
      setShowAddForm(false);
      await loadDoctors(unlockedPin);
    } catch (err) {
      alert('Error adding doctor: ' + (err.message || String(err)));
    } finally {
      setSavingDoctor(false);
    }
  };

  const startEdit = (doc) => {
    setEditingId(doc.id);
    setEditName(doc.name);
    setEditDegrees(doc.degrees || 'MBBS');
    setEditPtr(String(doc.ptr_score || 99.0));
    setEditSpecialties(doc.specialties || [doc.specialty || 'General Physician']);
    setEditFee(doc.consultation_fee != null ? String(doc.consultation_fee) : '');
    setEditDaySchedules(doc.custom_schedule || daySchedules);
  };

  const handleSaveEdit = async (doctorId) => {
    const activeDays = Object.keys(editDaySchedules).filter(d => editDaySchedules[d].active);
    await updateDoctor(
      unlockedPin, doctorId, editName, editSpecialties.join(', '), 10,
      activeDays, '10:00', '14:00', '',
      editFee ? parseFloat(editFee) : null
    );

    await supabase.from('doctors').update({
      degrees: editDegrees,
      ptr_score: parseFloat(editPtr) || 99.0,
      specialties: editSpecialties,
      custom_schedule: editDaySchedules
    }).eq('id', doctorId);

    setEditingId(null);
    loadDoctors(unlockedPin);
  };

  const handleDelete = async (doctorId, name) => {
    if (!window.confirm(`Remove Dr. ${name} from your clinic?`)) return;
    await deleteDoctor(unlockedPin, doctorId);
    loadDoctors(unlockedPin);
  };

  const handleStatusChange = async (doctorId, status) => {
    await updateDoctorStatus(unlockedPin, doctorId, status, status === 'delayed' ? 10 : 0);
    loadDoctors(unlockedPin);
  };

  const handleWalkinSubmit = async (doctorId) => {
    if (!walkinName.trim()) return;
    await addWalkinBooking(unlockedPin, doctorId, walkinName, walkinPhone);
    setWalkinName(''); setWalkinPhone('');
    refreshBookings(doctorId);
  };

  const refreshBookings = async (doctorId) => {
    const data = await getTodaysBookings(unlockedPin, doctorId);
    setBookingsByDoctor((prev) => ({ ...prev, [doctorId]: data || [] }));
  };

  const toggleTodaysPatients = async (doctorId) => {
    if (expandedDoctor === doctorId) { setExpandedDoctor(null); return; }
    setExpandedDoctor(doctorId);
    setLoadingBookings(true);
    await refreshBookings(doctorId);
    setLoadingBookings(false);
  };

  if (!unlocked) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 50% 0%, rgba(15,118,110,0.35) 0%, rgba(9,10,15,0) 55%), linear-gradient(180deg, #090a0f 0%, #090a0f 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 32,
          padding: '40px 32px 32px', width: '100%', maxWidth: 400, textAlign: 'center',
        }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 4px 0' }}>{clinicName}</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 28px 0', fontWeight: 600 }}>Staff Access Gateway · Enter Access PIN</p>
          <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <input
              type="password" inputMode="numeric" placeholder="• • • •" maxLength={6}
              value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} required
              style={{ width: '100%', padding: '16px', borderRadius: 16, border: '1.5px solid rgba(255,255,255,0.1)', background: '#131b18', color: '#fff', fontSize: 24, fontWeight: 800, letterSpacing: '12px', textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
            />
            <button type="submit" disabled={loading || !pin} style={{ ...pillPrimaryBtn, width: '100%', padding: '16px', fontSize: 15 }}>
              {loading ? 'Verifying PIN...' : 'Unlock Portal →'}
            </button>
          </form>
          {error && <p style={{ color: '#fca5a5', fontSize: 13, marginTop: 16 }}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 100px', minHeight: '100vh', background: '#090a0f', color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{clinicName} - Portal</h1>
        <button onClick={handleLogout} style={{ ...pillDangerBtn, padding: '8px 16px', fontSize: 13 }}>Logout</button>
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>Doctor Roster & Advanced Management</h3>

      {doctors.map((doc) => {
        const isEditing = editingId === doc.id;
        const specs = doc.specialties || [doc.specialty];
        const scheduleObj = doc.custom_schedule || {};

        return (
          <div key={doc.id} style={{ ...cardStyle, marginBottom: 18 }}>
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} style={panelInputStyle} placeholder="Doctor Name" />
                <input value={editDegrees} onChange={(e) => setEditDegrees(e.target.value)} style={panelInputStyle} placeholder="Degrees (e.g. MBBS, MD - Cardiology)" />
                <input type="number" step="0.1" value={editPtr} onChange={(e) => setEditPtr(e.target.value)} style={panelInputStyle} placeholder="PTR Score (e.g. 99.4)" />
                <input type="number" value={editFee} onChange={(e) => setEditFee(e.target.value)} style={panelInputStyle} placeholder="Consultation Fee (₹)" />

                <p style={{ fontSize: 12, fontWeight: 700, color: '#10b981', margin: '4px 0 0' }}>Select Specialties:</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {SPECIALTIES.map(s => (
                    <button type="button" key={s} onClick={() => toggleSpecialty(s, editSpecialties, setEditSpecialties)} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, background: editSpecialties.includes(s) ? '#10b981' : 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                      {s}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button onClick={() => handleSaveEdit(doc.id)} style={{ ...pillPrimaryBtn, flex: 1, padding: 10 }}>Save Changes</button>
                  <button onClick={() => setEditingId(null)} style={{ ...pillGhostBtn, flex: 1, padding: 10 }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 2px' }}>{doc.name}</h4>
                    <p style={{ fontSize: 12, color: '#10b981', margin: '0 0 4px', fontWeight: 700 }}>{doc.degrees || 'MBBS'}</p>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Specialties: {specs.join(', ')}</p>
                    <p style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700, margin: '4px 0 0' }}>⭐ PTR Trust Score: {doc.ptr_score || '99.0'}%</p>
                  </div>
                  <button onClick={() => startEdit(doc)} style={{ ...pillGhostBtn, padding: '6px 12px', fontSize: 12 }}>⚙️ Edit Profile</button>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button onClick={() => toggleTodaysPatients(doc.id)} style={{ ...pillPrimaryBtn, flex: 1, padding: 10, fontSize: 12 }}>
                    {expandedDoctor === doc.id ? 'Hide Queue' : 'Manage Queue'}
                  </button>
                  <button onClick={() => handleDelete(doc.id, doc.name)} style={{ ...pillDangerBtn, padding: '10px 14px', fontSize: 12 }}>🗑️</button>
                </div>
              </>
            )}
          </div>
        );
      })}

      <button onClick={() => setShowAddForm(!showAddForm)} style={{ ...pillPrimaryBtn, width: '100%', padding: 14, fontSize: 14, marginTop: 10 }}>
        {showAddForm ? 'Close Form' : '+ Add New Doctor'}
      </button>

      {showAddForm && (
        <form onSubmit={handleAddDoctor} style={{ ...cardStyle, marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Add Doctor Profile</h4>
          <input placeholder="Doctor Name (e.g. Dr. A. Datta)" value={newName} onChange={(e) => setNewName(e.target.value)} style={panelInputStyle} required />
          <input placeholder="Degrees (e.g. MBBS, MD, DNB)" value={newDegrees} onChange={(e) => setNewDegrees(e.target.value)} style={panelInputStyle} required />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input placeholder="Consultation Fee (₹)" type="number" value={newFee} onChange={(e) => setNewFee(e.target.value)} style={panelInputStyle} />
            <input placeholder="PTR Trust Score (e.g. 99.2)" type="number" step="0.1" value={newPtr} onChange={(e) => setNewPtr(e.target.value)} style={panelInputStyle} />
          </div>

          <p style={{ fontSize: 12, fontWeight: 700, color: '#10b981', margin: '4px 0 0' }}>Select Specialties (Multiple Allowed):</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SPECIALTIES.map(s => (
              <button type="button" key={s} onClick={() => toggleSpecialty(s, newSpecialties, setNewSpecialties)} style={{ padding: '5px 10px', borderRadius: 20, fontSize: 11, background: newSpecialties.includes(s) ? '#10b981' : 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                {s}
              </button>
            ))}
          </div>

          <p style={{ fontSize: 12, fontWeight: 700, color: '#10b981', margin: '8px 0 0' }}>Day-wise Custom Timings:</p>
          {DAYS.map(day => (
            <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 700, width: 40 }}>{day}</label>
              <input type="checkbox" checked={daySchedules[day].active} onChange={(e) => setDaySchedules({ ...daySchedules, [day]: { ...daySchedules[day], active: e.target.checked } })} />
              <input type="time" value={daySchedules[day].start} onChange={(e) => setDaySchedules({ ...daySchedules, [day]: { ...daySchedules[day], start: e.target.value } })} style={{ ...panelInputStyle, padding: '4px 8px', fontSize: 12 }} />
              <span>to</span>
              <input type="time" value={daySchedules[day].end} onChange={(e) => setDaySchedules({ ...daySchedules, [day]: { ...daySchedules[day], end: e.target.value } })} style={{ ...panelInputStyle, padding: '4px 8px', fontSize: 12 }} />
            </div>
          ))}

          <button type="submit" disabled={savingDoctor} style={{ ...pillPrimaryBtn, padding: 14, fontSize: 14, marginTop: 10 }}>
            {savingDoctor ? 'Saving...' : '✓ Save Doctor Profile'}
          </button>
        </form>
      )}
    </div>
  );
}
