import { useState, useEffect } from 'react';
import {
  checkClinicPin, getDoctorsForClinic, addDoctor, updateDoctor,
  deleteDoctor, updateDoctorStatus, addWalkinBooking,
  getHospitalUpi, updateHospitalUpi, getTodaysBookings, markAppointmentSeen,
  getHospitalLocation, updateHospitalLocation, cancelAppointment, checkInAppointment,
} from '../hospitalData';
import { supabase } from '../supabaseClient';
import './Login.css';

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available', color: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', textColor: '#10b981' },
  { value: 'delayed', label: 'Delayed', color: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', textColor: '#f59e0b' },
  { value: 'on_break', label: 'On Break', color: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', textColor: '#94a3b8' },
  { value: 'not_started', label: 'Not Started', color: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', textColor: '#ef4444' },
  { value: 'on_leave', label: 'On Leave / Holiday', color: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', textColor: '#ef4444' },
  { value: 'completed', label: 'Done for Today', color: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', textColor: '#94a3b8' },
];

const SPECIALTIES = [
  'General Physician', 'Gynecologist', 'Orthopedic', 'ENT Specialist', 'Dermatologist',
  'Pediatrician', 'Cardiologist', 'Dentist', 'Ophthalmologist', 'Psychiatrist',
  'Neurologist', 'Urologist', 'Gastroenterologist', 'General Surgeon', 'Diabetologist',
  'Nephrologist', 'Pulmonologist', 'Homeopath', 'Ayurvedic Physician', 'Physiotherapist',
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 16, boxShadow: '0 8px 24px 0 rgba(0,0,0,0.25)' };
const panelInputStyle = { width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 14, boxSizing: 'border-box', outline: 'none' };
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
      await addDoctor(
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

  const handleMarkSeen = async (appointmentId, doctorId) => {
    setUpdatingPatient(appointmentId);
    const { error } = await markAppointmentSeen(appointmentId);
    setUpdatingPatient(null);
    if (error) { setError('Could not update patient status.'); return; }
    await refreshBookings(doctorId);
    loadDoctors(unlockedPin);
  };

  const handleCheckIn = async (appointmentId, doctorId) => {
    setUpdatingPatient(appointmentId);
    const { error } = await checkInAppointment(unlockedPin, appointmentId);
    setUpdatingPatient(null);
    if (error) { setError('Could not check in patient.'); return; }
    await refreshBookings(doctorId);
  };

  const handleNoShowCancel = async (appointmentId, doctorId) => {
    if (!window.confirm('Mark this patient as "Did Not Show Up / Cancel"?')) return;
    setUpdatingPatient(appointmentId);
    const { error } = await cancelAppointment(appointmentId);
    setUpdatingPatient(null);
    if (error) { setError('Could not cancel booking.'); return; }
    await refreshBookings(doctorId);
    loadDoctors(unlockedPin);
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, marginBottom: 20 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
            MediQ Secure Terminal Active
          </div>
          <div style={{ width: 64, height: 64, borderRadius: 22, background: 'rgba(16,185,129,0.1)', border: '1.5px solid #10b981', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>
            🏥
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 4px 0' }}>{clinicName}</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 28px 0', fontWeight: 600 }}>Staff Access Gateway · Enter Access PIN</p>
          <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <input
              type="password" inputMode="numeric" placeholder="• • • •" maxLength={6}
              value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} required
              style={{ width: '100%', padding: '16px', borderRadius: 16, border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 24, fontWeight: 800, letterSpacing: '12px', textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
            />
            <button type="submit" disabled={loading || !pin} style={{ ...pillPrimaryBtn, width: '100%', padding: '16px', fontSize: 15, opacity: (loading || !pin) ? 0.6 : 1 }}>
              {loading ? 'Verifying PIN...' : 'Unlock Portal →'}
            </button>
          </form>
          {error && <p style={{ color: '#fca5a5', fontSize: 13, marginTop: 16, background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)', padding: '10px 14px', borderRadius: 12 }}>{error}</p>}
        </div>
      </div>
    );
  }

  const allBookings = Object.values(bookingsByDoctor).flat();
  const totalBookings = allBookings.length;
  const waitingBookings = allBookings.filter(b => b.status === 'waiting').length;
  const completedBookings = allBookings.filter(b => b.status === 'completed' || b.status === 'seen').length;
  const todayDateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div style={{
      maxWidth: 600, margin: '0 auto', padding: '20px 16px 100px', minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 0%, rgba(15,118,110,0.35) 0%, rgba(9,10,15,0) 55%), linear-gradient(180deg, #090a0f 0%, #090a0f 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#fff',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: 0.5 }}>Clinic Portal</p>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '4px 0 2px' }}>{clinicName} - Portal</h1>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{todayDateStr}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            style={{ ...pillGhostBtn, padding: '8px 12px', fontSize: 13 }}
          >
            ⚙️ Settings
          </button>
          <button onClick={handleLogout} style={{ ...pillDangerBtn, padding: '8px 16px', fontSize: 13 }}>
            Logout ➔
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>Total Patients</span>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '4px 0 0 0' }}>{totalBookings}</p>
        </div>
        <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 16, padding: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24' }}>Waiting</span>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#fbbf24', margin: '4px 0 0 0' }}>{waitingBookings}</p>
        </div>
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16, padding: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>Completed</span>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#10b981', margin: '4px 0 0 0' }}>{completedBookings}</p>
        </div>
      </div>

      {/* Settings Drawer */}
      {showSettingsDrawer && (
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#fff' }}>⚙️ Clinic Configurations</h4>
            <button onClick={() => setShowSettingsDrawer(false)} style={{ border: 'none', background: 'rgba(255,255,255,0.06)', borderRadius: '50%', width: 26, height: 26, color: '#94a3b8', fontWeight: 700, cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', margin: '0 0 6px 0', textTransform: 'uppercase' }}>📍 Google Maps Navigation Link</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => { setLocationInput(locationStr); setEditingLocation(!editingLocation); }} style={{ ...pillGhostBtn, padding: '6px 12px', fontSize: 12 }}>
                  {locationStr ? '✏️ Edit Map Link' : '+ Add Map Link'}
                </button>
                {locationStr && (
                  <a href={locationStr} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#10b981', fontWeight: 700, textDecoration: 'none' }}>
                    🔗 Test Route Link ➔
                  </a>
                )}
              </div>

              {editingLocation && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <input placeholder="Paste Google Maps share link" value={locationInput} onChange={(e) => setLocationInput(e.target.value)} style={{ ...panelInputStyle, flex: 1 }} />
                  <button onClick={handleSaveLocation} disabled={savingLocation} style={{ ...pillPrimaryBtn, padding: '8px 14px', fontSize: 13 }}>Save</button>
                </div>
              )}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', margin: '0 0 6px 0', textTransform: 'uppercase' }}>💳 Clinic UPI & On-Screen QR Code</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => { setUpiInput(upiId); setEditingUpi(!editingUpi); }} style={{ ...pillGhostBtn, padding: '6px 12px', fontSize: 12 }}>
                  {upiId ? `✏️ Change UPI (${upiId})` : '+ Add UPI ID'}
                </button>
                {upiId && (
                  <button onClick={() => setShowQrModal(true)} style={{ ...pillPrimaryBtn, padding: '6px 12px', fontSize: 12 }}>
                    📱 Show On-Screen QR Code
                  </button>
                )}
              </div>

              {editingUpi && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <input placeholder="Clinic UPI ID" value={upiInput} onChange={(e) => setUpiInput(e.target.value)} style={{ ...panelInputStyle, flex: 1 }} />
                  <button onClick={handleSaveUpi} disabled={savingUpi} style={{ ...pillPrimaryBtn, padding: '8px 14px', fontSize: 13 }}>Save</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 14 }}>Doctor Roster & Advanced Management</h3>

      {/* Doctor Roster */}
      {doctors.map((doc) => {
        const isEditing = editingId === doc.id;
        const docWaitingCount = bookingsByDoctor[doc.id]?.filter(b => b.status === 'waiting').length || 0;
        const specs = doc.specialties || [doc.specialty || 'General Physician'];
        const scheduleObj = doc.custom_schedule || {};
        const statusInfo = STATUS_OPTIONS.find((s) => s.value === doc.status) || STATUS_OPTIONS[0];

        return (
          <div key={doc.id} style={{ ...cardStyle, marginBottom: 18 }}>
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} style={panelInputStyle} placeholder="Doctor Name" />
                <input value={editDegrees} onChange={(e) => setEditDegrees(e.target.value)} style={panelInputStyle} placeholder="Degrees (e.g. MBBS, MD)" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input type="number" step="0.1" value={editPtr} onChange={(e) => setEditPtr(e.target.value)} style={panelInputStyle} placeholder="PTR Trust Score %" />
                  <input type="number" value={editFee} onChange={(e) => setEditFee(e.target.value)} style={panelInputStyle} placeholder="Fee (₹)" />
                </div>

                <p style={{ fontSize: 12, fontWeight: 700, color: '#10b981', margin: '4px 0 0' }}>Select Specialties:</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {SPECIALTIES.map(s => (
                    <button type="button" key={s} onClick={() => toggleSpecialty(s, editSpecialties, setEditSpecialties)} style={{ padding: '5px 10px', borderRadius: 20, fontSize: 11, background: editSpecialties.includes(s) ? '#10b981' : 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                      {s}
                    </button>
                  ))}
                </div>

                <p style={{ fontSize: 12, fontWeight: 700, color: '#10b981', margin: '8px 0 0' }}>Day-wise Custom Timings:</p>
                {DAYS.map(day => (
                  <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.02)', padding: 6, borderRadius: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, width: 35 }}>{day}</label>
                    <input type="checkbox" checked={editDaySchedules[day]?.active || false} onChange={(e) => setEditDaySchedules({ ...editDaySchedules, [day]: { ...(editDaySchedules[day] || { start: '10:00', end: '14:00' }), active: e.target.checked } })} />
                    <input type="time" value={editDaySchedules[day]?.start || '10:00'} onChange={(e) => setEditDaySchedules({ ...editDaySchedules, [day]: { ...(editDaySchedules[day] || {}), start: e.target.value } })} style={{ ...panelInputStyle, padding: '4px 6px', fontSize: 11 }} />
                    <span>to</span>
                    <input type="time" value={editDaySchedules[day]?.end || '14:00'} onChange={(e) => setEditDaySchedules({ ...editDaySchedules, [day]: { ...(editDaySchedules[day] || {}), end: e.target.value } })} style={{ ...panelInputStyle, padding: '4px 6px', fontSize: 11 }} />
                  </div>
                ))}

                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button onClick={() => handleSaveEdit(doc.id)} style={{ ...pillPrimaryBtn, flex: 1, padding: 10 }}>Save Changes</button>
                  <button onClick={() => setEditingId(null)} style={{ ...pillGhostBtn, flex: 1, padding: 10 }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 20, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      🩺
                    </div>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#fff' }}>{doc.name}</h4>
                      <p style={{ fontSize: 12, color: '#10b981', margin: '2px 0 0 0', fontWeight: 700 }}>{doc.degrees || 'MBBS, General Practitioner'}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0 0' }}>Specialties: {specs.join(', ')}</p>
                      <p style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700, margin: '3px 0 0' }}>⭐ PTR Trust Score: {doc.ptr_score || '99.0'}%</p>
                    </div>
                  </div>

                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: statusInfo.color, color: statusInfo.textColor, fontSize: 10, fontWeight: 800,
                    padding: '4px 10px', borderRadius: 100, border: `1px solid ${statusInfo.border}`,
                  }}>
                    {statusInfo.label}
                  </span>
                </div>

                {/* Status Update Buttons */}
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 10, marginBottom: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>Update Live Queue Status:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleStatusChange(doc.id, opt.value)}
                        style={{
                          padding: '5px 11px', borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          border: doc.status === opt.value ? `1px solid ${opt.border}` : '1px solid rgba(255,255,255,0.1)',
                          background: doc.status === opt.value ? opt.color : 'rgba(255,255,255,0.03)',
                          color: doc.status === opt.value ? opt.textColor : '#94a3b8',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Day-wise Timings Display */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 10, marginBottom: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', margin: '0 0 6px 0', textTransform: 'uppercase' }}>🕒 Schedule & Timings</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {DAYS.map(day => {
                      const daySlot = scheduleObj[day];
                      if (!daySlot || !daySlot.active) return null;
                      return (
                        <span key={day} style={{ fontSize: 11, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', padding: '3px 8px', borderRadius: 8, fontWeight: 600 }}>
                          {day}: {formatTime(daySlot.start)} – {formatTime(daySlot.end)}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {doc.consultation_fee != null && (
                    <span style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8 }}>
                      💳 ₹{doc.consultation_fee} Fee
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8 }}>
                  <button
                    onClick={() => toggleTodaysPatients(doc.id)}
                    style={{
                      padding: '10px 12px', borderRadius: 100, border: 'none',
                      background: expandedDoctor === doc.id ? 'rgba(255,255,255,0.08)' : 'linear-gradient(90deg, #10b981 25%, #059669 75%)',
                      color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {expandedDoctor === doc.id ? 'Hide Queue' : `Manage Queue (${docWaitingCount})`}
                  </button>
                  <button onClick={() => setShowWalkinForm(showWalkinForm === doc.id ? null : doc.id)} style={{ ...pillGhostBtn, padding: '10px 8px', fontSize: 12 }}>+ Walk-in</button>
                  <button onClick={() => startEdit(doc)} style={{ ...pillGhostBtn, padding: '10px 8px', fontSize: 12 }}>⚙️ Edit</button>
                  <button onClick={() => handleDelete(doc.id, doc.name)} style={{ ...pillDangerBtn, padding: '10px 8px', fontSize: 12 }}>🗑️</button>
                </div>

                {showWalkinForm === doc.id && (
                  <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <input placeholder="Patient name" value={walkinName} onChange={(e) => setWalkinName(e.target.value)} style={panelInputStyle} />
                    <input placeholder="Phone (optional)" value={walkinPhone} onChange={(e) => setWalkinPhone(e.target.value)} style={panelInputStyle} />
                    <button onClick={() => handleWalkinSubmit(doc.id)} style={{ ...pillPrimaryBtn, padding: 10 }}>Create Token</button>
                  </div>
                )}

                {expandedDoctor === doc.id && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    {loadingBookings ? (
                      <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center' }}>Loading queue...</p>
                    ) : !bookingsByDoctor[doc.id] || bookingsByDoctor[doc.id].length === 0 ? (
                      <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center' }}>No bookings for today yet.</p>
                    ) : (
                      bookingsByDoctor[doc.id].map((b) => (
                        <div key={b.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 14, marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <div>
                              <span style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}>#{b.token_number}</span>
                              <h5 style={{ fontWeight: 800, fontSize: 15, margin: 0, color: '#fff' }}>{b.patient_name || 'Patient'}</h5>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 8, background: 'rgba(99,102,241,0.12)', color: '#a5b4fc' }}>
                              {b.is_walkin ? '🚪 Walk-In' : '📱 App Token'}
                            </span>
                          </div>
                          {b.status === 'waiting' ? (
                            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                              <button onClick={() => handleMarkSeen(b.id, doc.id)} style={{ ...pillPrimaryBtn, flex: 2, padding: '10px', fontSize: 12 }}>✓ Call & Mark Seen</button>
                              <button onClick={() => handleNoShowCancel(b.id, doc.id)} style={{ ...pillDangerBtn, flex: 1, padding: '10px', fontSize: 12 }}>Did Not Show</button>
                            </div>
                          ) : (
                            <p style={{ color: '#10b981', fontWeight: 700, fontSize: 12, margin: '6px 0 0 0' }}>✓ Completed / Seen</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* Add Doctor Trigger Button */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        style={{ ...pillPrimaryBtn, width: '100%', padding: 14, fontSize: 14, marginTop: 10 }}
      >
        {showAddForm ? 'Close Form' : '+ Add New Doctor'}
      </button>

      {/* Add Doctor Form */}
      {showAddForm && (
        <form onSubmit={handleAddDoctor} style={{ ...cardStyle, marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h4 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 800, color: '#fff' }}>Add Doctor Profile</h4>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Doctor Name *</label>
            <input placeholder="e.g. Dr. Gautam Banerjee" value={newName} onChange={(e) => setNewName(e.target.value)} style={panelInputStyle} required />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Degrees & Qualifications *</label>
            <input placeholder="e.g. MBBS, MD (General Medicine)" value={newDegrees} onChange={(e) => setNewDegrees(e.target.value)} style={panelInputStyle} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Consultation Fee (₹)</label>
              <input placeholder="500" type="number" value={newFee} onChange={(e) => setNewFee(e.target.value)} style={panelInputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: 4 }}>PTR Trust Score %</label>
              <input placeholder="99.5" type="number" step="0.1" value={newPtr} onChange={(e) => setNewPtr(e.target.value)} style={panelInputStyle} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#10b981', display: 'block', marginBottom: 6 }}>Select Specialties (Multiple Allowed):</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SPECIALTIES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSpecialty(s, newSpecialties, setNewSpecialties)}
                  style={{
                    padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    border: 'none',
                    background: newSpecialties.includes(s) ? '#10b981' : 'rgba(255,255,255,0.05)',
                    color: newSpecialties.includes(s) ? '#fff' : '#94a3b8',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>🕒 Day-wise Custom Timings</p>
            {DAYS.map((day) => (
              <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, background: 'rgba(255,255,255,0.02)', padding: 6, borderRadius: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', width: 35 }}>{day}</label>
                <input
                  type="checkbox"
                  checked={daySchedules[day].active}
                  onChange={(e) => setDaySchedules({ ...daySchedules, [day]: { ...daySchedules[day], active: e.target.checked } })}
                />
                <input
                  type="time"
                  value={daySchedules[day].start}
                  onChange={(e) => setDaySchedules({ ...daySchedules, [day]: { ...daySchedules[day], start: e.target.value } })}
                  style={{ ...panelInputStyle, padding: '4px 6px', fontSize: 11, flex: 1 }}
                />
                <span>to</span>
                <input
                  type="time"
                  value={daySchedules[day].end}
                  onChange={(e) => setDaySchedules({ ...daySchedules, [day]: { ...daySchedules[day], end: e.target.value } })}
                  style={{ ...panelInputStyle, padding: '4px 6px', fontSize: 11, flex: 1 }}
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={savingDoctor}
            style={{ ...pillPrimaryBtn, padding: 14, fontSize: 14, marginTop: 6 }}
          >
            {savingDoctor ? 'Saving Doctor...' : '✓ Save Doctor Profile'}
          </button>
        </form>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 1000,
        }}>
          <div style={{ background: '#14161d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 28, padding: 24, width: '100%', maxWidth: 360, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: 12 }}>CLINIC PAYMENT QR</span>
              <button onClick={() => setShowQrModal(false)} style={{ border: 'none', background: 'rgba(255,255,255,0.06)', borderRadius: '50%', width: 28, height: 28, color: '#94a3b8', fontWeight: 700, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ background: '#fff', padding: 16, borderRadius: 20, display: 'inline-block', marginBottom: 16 }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${encodeURIComponent(clinicName)}&cu=INR`)}`}
                alt="Clinic UPI QR Code"
                style={{ width: 180, height: 180, display: 'block', margin: '0 auto' }}
              />
            </div>
            <button onClick={() => setShowQrModal(false)} style={{ ...pillGhostBtn, width: '100%', padding: 14, fontSize: 14 }}>Close</button>
          </div>
        </div>
      )}

    </div>
  );
}
