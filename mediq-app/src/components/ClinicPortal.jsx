import { useState, useEffect } from 'react';
import {
  checkClinicPin,
  getDoctorsForClinic,
  addDoctor,
  updateDoctor,
  deleteDoctor,
  updateDoctorStatus,
  addWalkinBooking,
  getHospitalUpi,
  updateHospitalUpi,
  getTodaysBookings,
  markAppointmentSeen,
  getHospitalLocation,
  updateHospitalLocation,
  cancelAppointment,
  checkInAppointment,
} from '../hospitalData';

import { supabase } from '../supabaseClient';

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available', color: '#10b981', soft: '#dcfce7' },
  { value: 'delayed', label: 'Delayed', color: '#f59e0b', soft: '#fef3c7' },
  { value: 'on_break', label: 'On Break', color: '#64748b', soft: '#f1f5f9' },
  { value: 'not_started', label: 'Not Started', color: '#ef4444', soft: '#fee2e2' },
  { value: 'on_leave', label: 'On Leave', color: '#ef4444', soft: '#fee2e2' },
  { value: 'completed', label: 'Done Today', color: '#64748b', soft: '#f1f5f9' },
];

const SPECIALTIES = [
  'General Physician', 'Gynecologist', 'Orthopedic', 'ENT Specialist',
  'Dermatologist', 'Pediatrician', 'Cardiologist', 'Dentist',
  'Ophthalmologist', 'Psychiatrist', 'Neurologist', 'Urologist',
  'Gastroenterologist', 'General Surgeon', 'Diabetologist', 'Physiotherapist',
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DEFAULT_SCHEDULE = {
  Mon: { active: true, start: '10:00', end: '14:00' },
  Tue: { active: true, start: '10:00', end: '14:00' },
  Wed: { active: true, start: '10:00', end: '14:00' },
  Thu: { active: true, start: '10:00', end: '14:00' },
  Fri: { active: true, start: '10:00', end: '14:00' },
  Sat: { active: true, start: '10:00', end: '13:00' },
  Sun: { active: false, start: '10:00', end: '13:00' },
};

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

function getInitials(name = '') {
  return (
    name
      .replace(/^Dr\.?\s*/i, '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'DR'
  );
}

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
  const [showAddForm, setShowAddForm] = useState(false);

  const [newName, setNewName] = useState('');
  const [newDegrees, setNewDegrees] = useState('MBBS, MD');
  const [newPtr, setNewPtr] = useState('99.0');
  const [newSpecialties, setNewSpecialties] = useState(['General Physician']);
  const [newAvgMinutes, setNewAvgMinutes] = useState('10');
  const [newFee, setNewFee] = useState('');
  const [daySchedules, setDaySchedules] = useState(DEFAULT_SCHEDULE);
  const [savingDoctor, setSavingDoctor] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDegrees, setEditDegrees] = useState('');
  const [editPtr, setEditPtr] = useState('');
  const [editSpecialties, setEditSpecialties] = useState([]);
  const [editFee, setEditFee] = useState('');
  const [editDaySchedules, setEditDaySchedules] = useState(DEFAULT_SCHEDULE);

  const [showWalkinForm, setShowWalkinForm] = useState(null);
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');

  const [expandedDoctor, setExpandedDoctor] = useState(null);
  const [bookingsByDoctor, setBookingsByDoctor] = useState({});
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [updatingPatient, setUpdatingPatient] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hId = params.get('hospital_id');
    if (hId) {
      supabase
        .from('hospitals')
        .select('name')
        .eq('id', hId)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.name) setClinicName(data.name);
        });
    }
  }, []);

  const loadDoctors = async (currentPin) => {
    if (!currentPin) return;
    setRefreshing(true);
    try {
      const data = await getDoctorsForClinic(currentPin);
      setDoctors(data || []);
      const bookingsMap = {};
      if (data?.length) {
        for (const doc of data) {
          const bookings = await getTodaysBookings(currentPin, doc.id);
          bookingsMap[doc.id] = bookings || [];
        }
      }
      setBookingsByDoctor(bookingsMap);
    } finally {
      setRefreshing(false);
    }
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
    if (!unlocked || !unlockedPin) return undefined;
    loadDoctors(unlockedPin);
    loadUpi(unlockedPin);
    loadLocation(unlockedPin);
    const interval = setInterval(() => {
      loadDoctors(unlockedPin);
    }, 30000);
    return () => clearInterval(interval);
  }, [unlocked, unlockedPin]);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const cleanPin = pin.trim();
    const hospitalId = await checkClinicPin(cleanPin);
    if (!hospitalId) {
      setError('Invalid Access PIN. Please try again.');
      setLoading(false);
      return;
    }
    const { data: hospData } = await supabase
      .from('hospitals')
      .select('name')
      .eq('id', hospitalId)
      .maybeSingle();

    if (hospData?.name) {
      setClinicName(hospData.name);
    }
    setUnlockedPin(cleanPin);
    setUnlocked(true);
    setLoading(false);
  };

  const handleLogout = () => {
    setUnlocked(false);
    setUnlockedPin('');
    setPin('');
    setDoctors([]);
    setExpandedDoctor(null);
    setBookingsByDoctor({});
    setShowSettingsDrawer(false);
  };

  const handleSaveUpi = async () => {
    setSavingUpi(true);
    const { error: saveError } = await updateHospitalUpi(unlockedPin, upiInput.trim());
    setSavingUpi(false);
    if (saveError) {
      setError('Could not save UPI ID.');
      return;
    }
    setUpiId(upiInput.trim());
    setEditingUpi(false);
  };

  const handleSaveLocation = async () => {
    setSavingLocation(true);
    const { error: saveError } = await updateHospitalLocation(unlockedPin, locationInput.trim());
    setSavingLocation(false);
    if (saveError) {
      setError('Could not save location.');
      return;
    }
    setLocationStr(locationInput.trim());
    setEditingLocation(false);
  };

  const toggleSpecialty = (spec, list, setList) => {
    if (list.includes(spec)) {
      if (list.length > 1) {
        setList(list.filter((s) => s !== spec));
      }
    } else {
      setList([...list, spec]);
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      alert('Please enter doctor name.');
      return;
    }
    setSavingDoctor(true);
    setError('');
    const activeDays = Object.keys(daySchedules).filter((day) => daySchedules[day].active);
    try {
      await addDoctor(
        unlockedPin,
        newName.trim(),
        newSpecialties.join(', '),
        parseInt(newAvgMinutes, 10) || 10,
        activeDays,
        daySchedules.Mon.start || '10:00',
        daySchedules.Mon.end || '14:00',
        JSON.stringify(daySchedules),
        newFee ? parseFloat(newFee) : 0
      );
      const latestDocs = await getDoctorsForClinic(unlockedPin);
      const justAdded = latestDocs?.[latestDocs.length - 1];
      if (justAdded) {
        await supabase
          .from('doctors')
          .update({
            degrees: newDegrees,
            ptr_score: parseFloat(newPtr) || 99.0,
            specialties: newSpecialties,
            custom_schedule: daySchedules,
          })
          .eq('id', justAdded.id);
      }
      setNewName('');
      setNewDegrees('MBBS, MD');
      setNewPtr('99.0');
      setNewSpecialties(['General Physician']);
      setNewAvgMinutes('10');
      setNewFee('');
      setDaySchedules(DEFAULT_SCHEDULE);
      setShowAddForm(false);
      await loadDoctors(unlockedPin);
    } catch (err) {
      alert(`Error adding doctor: ${err.message || String(err)}`);
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
    setEditDaySchedules(doc.custom_schedule || DEFAULT_SCHEDULE);
  };

  const handleSaveEdit = async (doctorId) => {
    const activeDays = Object.keys(editDaySchedules).filter((day) => editDaySchedules[day]?.active);
    
    // Get first active day's start/end time as primary fallback
    const firstActiveDay = activeDays[0] || 'Mon';
    const startTime = editDaySchedules[firstActiveDay]?.start || '10:00';
    const endTime = editDaySchedules[firstActiveDay]?.end || '14:00';

    await updateDoctor(
      unlockedPin,
      doctorId,
      editName,
      editSpecialties.join(', '),
      10,
      activeDays,
      startTime,
      endTime,
      JSON.stringify(editDaySchedules),
      editFee ? parseFloat(editFee) : null
    );

    await supabase.from('doctors').update({
      degrees: editDegrees,
      ptr_score: parseFloat(editPtr) || 99.0,
      specialties: editSpecialties,
      custom_schedule: editDaySchedules,
    }).eq('id', doctorId);

    setEditingId(null);
    await loadDoctors(unlockedPin);
  };
  const handleDelete = async (doctorId, name) => {
    if (!window.confirm(`Remove Dr. ${name} from your clinic?`)) return;
    await deleteDoctor(unlockedPin, doctorId);
    await loadDoctors(unlockedPin);
  };

  const handleStatusChange = async (doctorId, status) => {
    await updateDoctorStatus(unlockedPin, doctorId, status, status === 'delayed' ? 10 : 0);
    await loadDoctors(unlockedPin);
  };

  const refreshBookings = async (doctorId) => {
    const data = await getTodaysBookings(unlockedPin, doctorId);
    setBookingsByDoctor((prev) => ({ ...prev, [doctorId]: data || [] }));
  };

  const handleWalkinSubmit = async (doctorId) => {
    if (!walkinName.trim()) return;
    await addWalkinBooking(unlockedPin, doctorId, walkinName.trim(), walkinPhone.trim());
    setWalkinName('');
    setWalkinPhone('');
    await refreshBookings(doctorId);
    await loadDoctors(unlockedPin);
  };

  const toggleTodaysPatients = async (doctorId) => {
    if (expandedDoctor === doctorId) {
      setExpandedDoctor(null);
      return;
    }
    setExpandedDoctor(doctorId);
    setLoadingBookings(true);
    await refreshBookings(doctorId);
    setLoadingBookings(false);
  };

  const handleCheckIn = async (appointmentId, doctorId) => {
    setUpdatingPatient(appointmentId);
    await checkInAppointment(unlockedPin, appointmentId);
    setUpdatingPatient(null);
    await refreshBookings(doctorId);
  };

  const handleMarkSeen = async (appointmentId, doctorId) => {
    setUpdatingPatient(appointmentId);
    await markAppointmentSeen(unlockedPin, appointmentId);
    setUpdatingPatient(null);
    await refreshBookings(doctorId);
    await loadDoctors(unlockedPin);
  };

  const handleNoShowCancel = async (appointmentId, doctorId) => {
    if (!window.confirm('Mark this patient as cancelled / did not show?')) return;
    setUpdatingPatient(appointmentId);
    await cancelAppointment(appointmentId);
    setUpdatingPatient(null);
    await refreshBookings(doctorId);
    await loadDoctors(unlockedPin);
  };

  if (!unlocked) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0b332c 0%, #062b25 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'sans-serif' }}>
        <div style={{ background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '32px 24px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#e6f4ea', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px', fontWeight: 'bold' }}>✚</div>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '22px', color: '#0b332c', margin: '0 0 6px' }}>{clinicName}</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px' }}>Secure Staff Access Portal. Enter 4-digit PIN.</p>
          <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="password"
              inputMode="numeric"
              placeholder="••••"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              required
              style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '24px', fontWeight: 'bold', letterSpacing: '8px', boxSizing: 'border-box' }}
            />
            <button type="submit" disabled={loading || !pin} style={{ width: '100%', background: '#10b981', color: '#fff', border: 'none', padding: '14px', borderRadius: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', opacity: loading || !pin ? 0.6 : 1 }}>
              {loading ? 'Verifying...' : 'Access Portal →'}
            </button>
          </form>
          {error && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '12px', background: '#fef2f2', padding: '8px', borderRadius: '8px', fontWeight: '600' }}>{error}</p>}
        </div>
      </div>
    );
  }
  const allBookings = Object.values(bookingsByDoctor).flat();
  const totalBookings = allBookings.length;
  const waitingBookings = allBookings.filter((b) => b.status === 'waiting' || b.status === 'checked_in').length;
  const completedBookings = allBookings.filter((b) => b.status === 'completed' || b.status === 'seen').length;
  const todayDateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', background: '#f8f6f0', color: '#0b332c', fontFamily: 'sans-serif', paddingBottom: '60px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '20px 16px', boxSizing: 'border-box' }}>
        
        {/* TOP HEADER */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Clinic Staff Portal</div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '22px', color: '#0b332c', margin: '0 0 4px' }}>{clinicName}</h1>
            <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0 }}>📅 {todayDateStr}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => loadDoctors(unlockedPin)} disabled={refreshing} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', width: '38px', height: '38px', borderRadius: '12px', cursor: 'pointer', fontSize: '16px', color: '#0b332c' }}>↻</button>
            <button onClick={() => setShowSettingsDrawer(!showSettingsDrawer)} style={{ background: '#e6f4ea', border: '1px solid #bbf7d0', padding: '8px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', color: '#0b332c', cursor: 'pointer' }}>⚙ Settings</button>
            <button onClick={handleLogout} style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '8px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', color: '#dc2626', cursor: 'pointer' }}>Logout</button>
          </div>
        </div>

        {/* STATS AT A GLANCE */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Total Tokens', value: totalBookings, bg: '#fff', color: '#0b332c' },
            { label: 'Waiting Queue', value: waitingBookings, bg: '#fffbeb', color: '#d97706' },
            { label: 'Completed', value: completedBookings, bg: '#f0fdf4', color: '#15803d' },
          ].map((st, idx) => (
            <div key={idx} style={{ background: st.bg, border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>{st.label}</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: st.color, fontFamily: 'Fraunces, serif' }}>{st.value}</div>
            </div>
          ))}
        </div>

        {/* SETTINGS DRAWER */}
        {showSettingsDrawer && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px', marginBottom: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', color: '#0b332c', margin: '0 0 12px' }}>Clinic Settings & UPI QR</h3>
            
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#0b332c', display: 'block', marginBottom: '6px' }}>Google Maps Location Link:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input placeholder="Paste Google Maps URL" value={locationInput} onChange={(e) => setLocationInput(e.target.value)} style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                <button onClick={handleSaveLocation} disabled={savingLocation} style={{ background: '#0b332c', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>{savingLocation ? 'Saving...' : 'Save'}</button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#0b332c', display: 'block', marginBottom: '6px' }}>Clinic UPI ID (for Online Payments):</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input placeholder="e.g. clinic@paytm" value={upiInput} onChange={(e) => setUpiInput(e.target.value)} style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                <button onClick={handleSaveUpi} disabled={savingUpi} style={{ background: '#0b332c', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>{savingUpi ? 'Saving...' : 'Save'}</button>
              </div>
              {upiId && (
                <button onClick={() => setShowQrModal(true)} style={{ background: '#fef3c7', border: '1px solid #fde047', color: '#92400e', padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                  📱 View Payment QR Code
                </button>
              )}
            </div>
          </div>
        )}

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>{error}</div>}

        {/* DOCTOR ROSTER HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', color: '#0b332c', margin: 0 }}>Doctor Roster ({doctors.length})</h2>
          <button onClick={() => setShowAddForm(!showAddForm)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>
            {showAddForm ? 'Close Form' : '+ Add Doctor'}
          </button>
        </div>

        {/* ADD DOCTOR FORM */}
        {showAddForm && (
          <form onSubmit={handleAddDoctor} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', color: '#0b332c', margin: '0 0 4px' }}>Add New Doctor</h3>
            
            <Field label="Doctor Name *">
              <input placeholder="Dr. Gautam Banerjee" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13.5px', boxSizing: 'border-box' }} required />
            </Field>

            <Field label="Degrees & Qualifications *">
              <input placeholder="MBBS, MD (General)" value={newDegrees} onChange={(e) => setNewDegrees(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13.5px', boxSizing: 'border-box' }} required />
            </Field>

<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Field label="Consultation Fee (₹)">
                <input type="number" placeholder="500" value={newFee} onChange={(e) => setNewFee(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13.5px', boxSizing: 'border-box' }} />
              </Field>
              
              {/* CRITICAL: Average Time per Patient used for Live Queue Wait Time Calculation */}
              <Field label="Avg Time / Patient (Mins) *">
                <input 
                  type="number" 
                  min="1" 
                  value={newAvgMinutes} 
                  onChange={(e) => setNewAvgMinutes(e.target.value)} 
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #10b981', background: '#f0fdf4', fontSize: '13.5px', fontWeight: 'bold', boxSizing: 'border-box' }} 
                  required 
                />
              </Field>
            </div>

            <SpecialtySelector selected={newSpecialties} onToggle={(spec) => toggleSpecialty(spec, newSpecialties, setNewSpecialties)} />
            
            {/* CRITICAL: Day-wise Clinic Visit Schedule */}
            <div style={{ background: '#f8f6f0', padding: '12px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontSize: '12px', fontWeight: '800', color: '#0b332c', display: 'block', marginBottom: '4px' }}>
                📅 Doctor Clinic Visit Days & Timings *
              </label>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 10px' }}>
                Check the days this doctor visits your clinic and set their shift hours.
              </p>
              <ScheduleEditor value={daySchedules} onChange={setDaySchedules} />
            </div>

            <button type="submit" disabled={savingDoctor} style={{ width: '100%', background: '#0b332c', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
              {savingDoctor ? 'Saving...' : 'Save Doctor Profile'}
            </button>
          </form>
        )}

        {/* DOCTOR LIST CARDS */}
        {doctors.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>👨‍⚕️</div>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', color: '#0b332c', margin: '0 0 4px' }}>No Doctors Added</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Click "+ Add Doctor" above to set up your clinic roster.</p>
          </div>
        ) : (
          doctors.map((doc) => {
            const isEditing = editingId === doc.id;
            const docBookings = bookingsByDoctor[doc.id] || [];
            const waitingCount = docBookings.filter((b) => b.status === 'waiting' || b.status === 'checked_in').length;
            const specs = doc.specialties || [doc.specialty || 'General Physician'];
            const statusInfo = STATUS_OPTIONS.find((s) => s.value === doc.status) || STATUS_OPTIONS[0];

            return (
              <div key={doc.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px', marginBottom: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              {isEditing ? (
                <div style={{ background: '#fcfbf9', border: '1px solid #10b981', borderRadius: '16px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', color: '#0b332c', margin: 0 }}>Edit Doctor Profile</h3>
                    <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>Active Editing</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Doctor Name</label>
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }} placeholder="Doctor Name" />
                    </div>

                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Degrees & Qualifications</label>
                      <input value={editDegrees} onChange={(e) => setEditDegrees(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }} placeholder="Degrees" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Consultation Fee (₹)</label>
                        <input type="number" value={editFee} onChange={(e) => setEditFee(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }} placeholder="Fee ₹" />
                      </div>
                      <div>
                        <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Avg Time / Patient (Mins)</label>
                        <input type="number" min="1" value={doc.avg_minutes_per_patient || 10} onChange={(e) => {
                          // Optional state handler if you want to update avg minutes on edit
                        }} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }} placeholder="10" />
                      </div>
                    </div>

                    {/* Specialty Selector for Editing */}
                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Specialties</label>
                      <SpecialtySelector selected={editSpecialties} onToggle={(spec) => toggleSpecialty(spec, editSpecialties, setEditSpecialties)} />
                    </div>

                    {/* Schedule Editor for Editing */}
                    <div>
                      <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Clinic Visit Days & Timings</label>
                      <ScheduleEditor value={editDaySchedules} onChange={setEditDaySchedules} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                    <button onClick={() => setEditingId(null)} style={{ flex: 1, background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={() => handleSaveEdit(doc.id)} style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>Save Changes</button>
                  </div>
                </div>
              ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#0b332c', color: '#d7b45e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800' }}>
                          {getInitials(doc.name)}
                        </div>
                       <div>
                        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '17px', color: '#0b332c', margin: '0 0 2px' }}>{doc.name}</h3>
                        <p style={{ fontSize: '12px', color: '#10b981', fontWeight: '700', margin: '0 0 2px' }}>{doc.degrees || 'MBBS'}</p>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 4px' }}>{specs.join(', ')}</p>
                        
                        {/* Display Clinic Visit Days & Timings */}
                        {doc.custom_schedule && (
                          <div style={{ fontSize: '11px', color: '#0b332c', background: '#f8f6f0', padding: '4px 8px', borderRadius: '6px', display: 'inline-block', border: '1px solid #e2e8f0', fontWeight: '600' }}>
                            🕒 {Object.keys(doc.custom_schedule)
                              .filter(d => doc.custom_schedule[d]?.active)
                              .map(d => `${d} (${formatTime(doc.custom_schedule[d].start)}-${formatTime(doc.custom_schedule[d].end)})`)
                              .join(', ') || doc.working_days?.join(', ') || 'Schedule not set'}
                          </div>
                        )}
                      </div>
                      </div>

                      <span style={{ fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '100px', background: statusInfo.soft, color: statusInfo.color }}>
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* STATUS SELECTOR CHIPS */}
                    <div style={{ background: '#f8f6f0', padding: '12px', borderRadius: '14px', marginBottom: '14px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Change Queue Status:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => handleStatusChange(doc.id, opt.value)}
                            style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', border: doc.status === opt.value ? `1.5px solid ${opt.color}` : '1px solid #cbd5e1', background: doc.status === opt.value ? opt.soft : '#fff', color: doc.status === opt.value ? opt.color : '#64748b' }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                      <button onClick={() => toggleTodaysPatients(doc.id)} style={{ background: '#0b332c', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                        {expandedDoctor === doc.id ? 'Hide Queue' : `Queue (${waitingCount})`}
                      </button>
                      <button onClick={() => setShowWalkinForm(showWalkinForm === doc.id ? null : doc.id)} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                        + Walk-in
                      </button>
                      <button onClick={() => startEdit(doc)} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#0b332c', padding: '10px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                        Edit / Remove
                      </button>
                    </div>

                    {/* WALK-IN FORM */}
                    {showWalkinForm === doc.id && (
                      <div style={{ background: '#fef3c7', border: '1px solid #fde047', borderRadius: '14px', padding: '14px', marginBottom: '14px' }}>
                        <h4 style={{ margin: '0 0 8px', fontSize: '13px', color: '#92400e', fontWeight: '800' }}>Add Offline Walk-in Patient</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <input placeholder="Patient Name *" value={walkinName} onChange={(e) => setWalkinName(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                          <input placeholder="Phone Number (Optional)" value={walkinPhone} onChange={(e) => setWalkinPhone(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                          <button onClick={() => handleWalkinSubmit(doc.id)} style={{ background: '#d97706', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer' }}>Generate Walk-in Token</button>
                        </div>
                      </div>
                    )}

                    {/* TODAY'S QUEUE EXPANDED LIST */}
                    {expandedDoctor === doc.id && (
                      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px', marginTop: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <h4 style={{ margin: 0, fontSize: '13px', color: '#0b332c', fontWeight: '800' }}>Today's Patient Queue ({docBookings.length})</h4>
                          <button onClick={() => refreshBookings(doc.id)} style={{ background: 'transparent', border: 'none', color: '#10b981', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}>Refresh List</button>
                        </div>

                        {loadingBookings ? (
                          <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748b' }}>Loading queue...</p>
                        ) : docBookings.length === 0 ? (
                          <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', padding: '12px', background: '#f8f6f0', borderRadius: '10px' }}>No patients booked for this doctor today.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {docBookings.map((b) => {
                              const isWaiting = b.status?.toLowerCase() === 'waiting' || b.status?.toLowerCase() === 'checked_in';
                              const isUpdating = updatingPatient === b.id;

                              return (
                                <div key={b.id} style={{ background: '#f8f6f0', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>
                                      #{b.queue_number || b.token_number || '1'}
                                    </div>
                                    <div>
                                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#0b332c' }}>{b.patient_name || 'Patient'}</div>
                                      <div style={{ fontSize: '11px', color: '#64748b' }}>{b.is_walkin ? '🚶 Walk-in' : '📱 App Booking'} • <span style={{ textTransform: 'capitalize', fontWeight: '600', color: isWaiting ? '#d97706' : '#15803d' }}>{b.status}</span></div>
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    {isWaiting ? (
                                      <>
                                        <button onClick={() => handleMarkSeen(b.id, doc.id)} disabled={isUpdating} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                                          Mark Seen
                                        </button>
                                        <button onClick={() => handleNoShowCancel(b.id, doc.id)} disabled={isUpdating} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                                          Cancel
                                        </button>
                                      </>
                                    ) : (
                                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#15803d' }}>✓ Done</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* QR MODAL */}
      {showQrModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(6, 43, 37, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '340px', borderRadius: '24px', padding: '24px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', color: '#0b332c', margin: '0 0 12px' }}>Clinic Payment QR</h3>
            <div style={{ background: '#f8f6f0', padding: '16px', borderRadius: '16px', display: 'inline-block', marginBottom: '12px', border: '1px solid #e2e8f0' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${encodeURIComponent(clinicName)}&cu=INR`)}`}
                alt="UPI QR Code"
                style={{ width: '180px', height: '180px', display: 'block' }}
              />
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px' }}>UPI ID: <strong>{upiId}</strong></p>
            <button onClick={() => setShowQrModal(false)} style={{ width: '100%', background: '#0b332c', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '5px', color: '#0b332c', fontSize: '12px', fontWeight: '700' }}>{label}</label>
      {children}
    </div>
  );
}

function SpecialtySelector({ selected, onToggle }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '6px', color: '#0b332c', fontSize: '12px', fontWeight: '700' }}>Specialties (Multiple Allowed):</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {SPECIALTIES.map((spec) => {
          const active = selected.includes(spec);
          return (
            <button
              key={spec}
              type="button"
              onClick={() => onToggle(spec)}
              style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', border: active ? '1.5px solid #10b981' : '1px solid #cbd5e1', background: active ? '#dcfce7' : '#fff', color: active ? '#15803d' : '#64748b' }}
            >
              {spec}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScheduleEditor({ value, onChange }) {
  const updateDay = (day, patch) => {
    onChange({
      ...value,
      [day]: {
        ...(value[day] || { active: false, start: '10:00', end: '14:00' }),
        ...patch,
      },
    });
  };

  return (
    <div style={{ background: '#f8f6f0', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '14px' }}>
      <p style={{ margin: '0 0 10px', color: '#0b332c', fontSize: '12px', fontWeight: '800' }}>🕒 Day-wise Consultation Timings</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {DAYS.map((day) => {
          const slot = value[day] || { active: false, start: '10:00', end: '14:00' };
          return (
            <div key={day} style={{ display: 'grid', gridTemplateColumns: '40px 24px 1fr 16px 1fr', gap: '6px', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '6px 8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: slot.active ? '#0b332c' : '#94a3b8' }}>{day}</span>
              <input type="checkbox" checked={slot.active} onChange={(e) => updateDay(day, { active: e.target.checked })} />
              <input type="time" value={slot.start} onChange={(e) => updateDay(day, { start: e.target.value })} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px', fontSize: '11px' }} />
              <span style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center' }}>to</span>
              <input type="time" value={slot.end} onChange={(e) => updateDay(day, { end: e.target.value })} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px', fontSize: '11px' }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
