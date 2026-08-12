import { useState, useEffect } from 'react';
import {
  checkClinicPin, getDoctorsForClinic, addDoctor, updateDoctor,
  deleteDoctor, updateDoctorStatus, addWalkinBooking,
  getHospitalUpi, updateHospitalUpi, getTodaysBookings, markAppointmentSeen,
  getHospitalLocation, updateHospitalLocation, cancelAppointment,
} from '../hospitalData';
import './Login.css';

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available', color: '#d1fae5', textColor: '#065f46', dotColor: '#10b981' },
  { value: 'delayed', label: 'Delayed', color: '#fef3c7', textColor: '#92400e', dotColor: '#f59e0b' },
  { value: 'on_break', label: 'On Break', color: '#f1f5f9', textColor: '#475569', dotColor: '#64748b' },
  { value: 'not_started', label: 'Not Started', color: '#fee2e2', textColor: '#991b1b', dotColor: '#ef4444' },
  { value: 'on_leave', label: 'On Leave / Holiday', color: '#fecaca', textColor: '#991b1b', dotColor: '#dc2626' },
  { value: 'completed', label: 'Done for Today', color: '#e2e8f0', textColor: '#334155', dotColor: '#475569' },
];

const SPECIALTIES = [
  'General Physician', 'Gynecologist', 'Orthopedic', 'ENT Specialist', 'Dermatologist',
  'Pediatrician', 'Cardiologist', 'Dentist', 'Ophthalmologist', 'Psychiatrist',
  'Neurologist', 'Urologist', 'Gastroenterologist', 'General Surgeon', 'Diabetologist',
  'Nephrologist', 'Pulmonologist', 'Homeopath', 'Ayurvedic Physician', 'Physiotherapist',
  'Radiologist', 'Anesthesiologist', 'Oncologist', 'Other',
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function DayPicker({ selectedDays, onToggle }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {DAYS.map((day) => (
        <button
          key={day}
          type="button"
          onClick={() => onToggle(day)}
          style={{
            padding: '6px 10px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            border: selectedDays.includes(day) ? 'none' : '1px solid #ddd',
            background: selectedDays.includes(day) ? '#0d9488' : 'white',
            color: selectedDays.includes(day) ? 'white' : '#333',
          }}
        >
          {day}
        </button>
      ))}
    </div>
  );
}

export default function ClinicPortal() {
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
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
  const [newSpecialty, setNewSpecialty] = useState(SPECIALTIES[0]);
  const [newAvgMinutes, setNewAvgMinutes] = useState('10');
  const [newWorkingDays, setNewWorkingDays] = useState([]);
  const [newStartTime, setNewStartTime] = useState('10:00');
  const [newEndTime, setNewEndTime] = useState('14:00');
  const [newNotes, setNewNotes] = useState('');
  const [newFee, setNewFee] = useState('');
  const [savingDoctor, setSavingDoctor] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [editAvgMinutes, setEditAvgMinutes] = useState('');
  const [editWorkingDays, setEditWorkingDays] = useState([]);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editFee, setEditFee] = useState('');

  const [showWalkinForm, setShowWalkinForm] = useState(null);
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');

  const [expandedDoctor, setExpandedDoctor] = useState(null);
  const [bookingsByDoctor, setBookingsByDoctor] = useState({});
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [updatingPatient, setUpdatingPatient] = useState(null);

  const [viewScreenshotModal, setViewScreenshotModal] = useState(null);

  const loadDoctors = async (currentPin) => {
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
    const data = await getHospitalUpi(currentPin);
    setUpiId(data || '');
    setUpiInput(data || '');
  };

  const loadLocation = async (currentPin) => {
    const data = await getHospitalLocation(currentPin);
    setLocationStr(data || '');
    setLocationInput(data || '');
  };

  useEffect(() => {
    if (unlocked) {
      loadDoctors(pin);
      loadUpi(pin);
      loadLocation(pin);
      const interval = setInterval(() => loadDoctors(pin), 30000);
      return () => clearInterval(interval);
    }
  }, [unlocked]);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const hospitalId = await checkClinicPin(pin);
    setLoading(false);
    if (!hospitalId) {
      setError('Invalid Access PIN. Please try again.');
      return;
    }
    setUnlocked(true);
  };

  const handleLogout = () => {
    setUnlocked(false);
    setPin('');
    setDoctors([]);
    setExpandedDoctor(null);
    setBookingsByDoctor({});
  };

  const handleSaveUpi = async () => {
    setSavingUpi(true);
    const { error } = await updateHospitalUpi(pin, upiInput.trim());
    setSavingUpi(false);
    if (error) { setError('Could not save UPI ID.'); return; }
    setUpiId(upiInput.trim());
    setEditingUpi(false);
  };

  const handleSaveLocation = async () => {
    setSavingLocation(true);
    const { error } = await updateHospitalLocation(pin, locationInput.trim());
    setSavingLocation(false);
    if (error) { setError('Could not save location.'); return; }
    setLocationStr(locationInput.trim());
    setEditingLocation(false);
  };

  const toggleNewDay = (day) => {
    setNewWorkingDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const toggleEditDay = (day) => {
    setEditWorkingDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newSpecialty) {
      setError('Please provide doctor name and specialty.');
      return;
    }
    setSavingDoctor(true);
    setError('');
    const { error } = await addDoctor(
      pin, newName.trim(), newSpecialty, parseInt(newAvgMinutes) || 10,
      newWorkingDays, newStartTime, newEndTime, newNotes,
      newFee ? parseFloat(newFee) : null
    );
    setSavingDoctor(false);
    if (error) {
      setError('Could not add doctor. Please try again.');
      return;
    }
    setNewName(''); setNewSpecialty(SPECIALTIES[0]); setNewAvgMinutes('10');
    setNewWorkingDays([]); setNewStartTime('10:00'); setNewEndTime('14:00'); setNewNotes(''); setNewFee('');
    setShowAddForm(false);
    await loadDoctors(pin);
  };

  const startEdit = (doc) => {
    setEditingId(doc.id);
    setEditName(doc.name);
    setEditSpecialty(doc.specialty);
    setEditAvgMinutes(String(doc.avg_minutes_per_patient || 10));
    setEditWorkingDays(doc.working_days || []);
    setEditStartTime(doc.start_time || '10:00');
    setEditEndTime(doc.end_time || '14:00');
    setEditNotes(doc.notes || '');
    setEditFee(doc.consultation_fee != null ? String(doc.consultation_fee) : '');
  };

  const handleSaveEdit = async (doctorId) => {
    const { error } = await updateDoctor(
      pin, doctorId, editName, editSpecialty, parseInt(editAvgMinutes) || 10,
      editWorkingDays, editStartTime, editEndTime, editNotes,
      editFee ? parseFloat(editFee) : null
    );
    if (error) { setError('Could not save changes.'); return; }
    setEditingId(null);
    loadDoctors(pin);
  };

  const handleDelete = async (doctorId, name) => {
    if (!window.confirm(`Remove Dr. ${name} from your clinic?`)) return;
    const { error } = await deleteDoctor(pin, doctorId);
    if (error) { setError('Could not remove doctor.'); return; }
    loadDoctors(pin);
  };

  const handleStatusChange = async (doctorId, status) => {
    const delay = status === 'delayed' ? 10 : 0;
    const { error } = await updateDoctorStatus(pin, doctorId, status, delay);
    if (error) { setError('Could not update status.'); return; }
    loadDoctors(pin);
  };

  const handleWalkinSubmit = async (doctorId) => {
    if (!walkinName.trim()) return;
    const { data, error } = await addWalkinBooking(pin, doctorId, walkinName, walkinPhone);
    if (error) { setError('Could not add booking.'); return; }
    setWalkinName(''); setWalkinPhone('');
    refreshBookings(doctorId);
  };

  const refreshBookings = async (doctorId) => {
    const data = await getTodaysBookings(pin, doctorId);
    setBookingsByDoctor((prev) => ({ ...prev, [doctorId]: data || [] }));
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

  const handleMarkSeen = async (appointmentId, doctorId) => {
    setUpdatingPatient(appointmentId);
    const { error } = await markAppointmentSeen(pin, appointmentId);
    setUpdatingPatient(null);
    if (error) { setError('Could not update patient status.'); return; }
    await refreshBookings(doctorId);
    loadDoctors(pin);
  };

  const handleNoShowCancel = async (appointmentId, doctorId) => {
    if (!window.confirm('Mark this patient as "Did Not Show Up / Cancel"?')) return;
    setUpdatingPatient(appointmentId);
    const { error } = await cancelAppointment(appointmentId);
    setUpdatingPatient(null);
    if (error) { setError('Could not cancel booking.'); return; }
    await refreshBookings(doctorId);
    loadDoctors(pin);
  };

  const inputStyle = { width: '100%', padding: 12, borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, boxSizing: 'border-box' };

  if (!unlocked) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 50% 30%, #115e59 0%, #0f172a 70%, #020617 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.96)', backdropFilter: 'blur(20px)', borderRadius: 32,
          padding: '40px 32px 32px', width: '100%', maxWidth: 400, textAlign: 'center',
          boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.45)',
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#d1fae5', border: '1px solid #a7f3d0', color: '#065f46', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, marginBottom: 20 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
            MediQ Secure Terminal Active
          </div>
          <div style={{ width: 64, height: 64, borderRadius: 22, background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>
            🏥
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>Shri Durga Medical Hall</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 28px 0', fontWeight: 600 }}>Staff Access Gateway · Enter Access PIN</p>
          <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <input
              type="password" inputMode="numeric" placeholder="• • • •" maxLength={6}
              value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} required
              style={{ width: '100%', padding: '16px', borderRadius: 16, border: '2px solid #cbd5e1', background: '#f8fafc', fontSize: 24, fontWeight: 800, letterSpacing: '12px', textAlign: 'center', outline: 'none' }}
            />
            <button type="submit" disabled={loading || !pin} style={{ width: '100%', padding: '16px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              {loading ? 'Verifying PIN...' : 'Unlock Portal →'}
            </button>
          </form>
          {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 16, background: '#fef2f2', padding: '10px 14px', borderRadius: 12 }}>{error}</p>}
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
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 100px', background: '#f8fafc', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#d1fae5', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: 20, marginBottom: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#065f46', letterSpacing: 0.5 }}>OPERATIONAL · QUEUE ACTIVE</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>Shri Durga Medical Hall</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{todayDateStr}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            style={{ padding: '8px 12px', borderRadius: 12, border: '1px solid #cbd5e1', background: 'white', color: '#0f172a', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            ⚙️ Settings
          </button>
          <button onClick={handleLogout} style={{ padding: '8px 16px', borderRadius: 12, border: '1px solid #fca5a5', background: 'white', color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Logout ➔
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 12, border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Total Patients</span>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '4px 0 0 0' }}>{totalBookings}</p>
        </div>
        <div style={{ background: '#ccfbf1', borderRadius: 16, padding: 12, border: '1px solid #99f6e4', textAlign: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#0f766e' }}>Waiting</span>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#0f766e', margin: '4px 0 0 0' }}>{waitingBookings}</p>
        </div>
        <div style={{ background: 'white', borderRadius: 16, padding: 12, border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Completed</span>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '4px 0 0 0' }}>{completedBookings}</p>
        </div>
      </div>

      {/* Settings Drawer */}
      {showSettingsDrawer && (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 20, padding: 18, marginBottom: 20, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>⚙️ Clinic Configurations</h4>
            <button onClick={() => setShowSettingsDrawer(false)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: 26, height: 26, fontWeight: 700, cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: 12, border: '1px solid #f1f5f9' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', margin: '0 0 6px 0', textTransform: 'uppercase' }}>📍 Google Maps Navigation Link</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => { setLocationInput(locationStr); setEditingLocation(!editingLocation); }} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {locationStr ? '✏️ Edit Map Link' : '+ Add Map Link'}
                </button>
                {locationStr && (
                  <a href={locationStr} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}>
                    🔗 Test Route Link ➔
                  </a>
                )}
              </div>

              {editingLocation && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <input placeholder="Paste Google Maps share link" value={locationInput} onChange={(e) => setLocationInput(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={handleSaveLocation} disabled={savingLocation} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#0d9488', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Save</button>
                </div>
              )}
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 12, padding: 12, border: '1px solid #f1f5f9' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', margin: '0 0 6px 0', textTransform: 'uppercase' }}>💳 Clinic UPI & On-Screen QR Code</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => { setUpiInput(upiId); setEditingUpi(!editingUpi); }} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {upiId ? `✏️ Change UPI (${upiId})` : '+ Add UPI ID'}
                </button>
                {upiId && (
                  <button onClick={() => setShowQrModal(true)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#ccfbf1', color: '#0f766e', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    📱 Show On-Screen QR Code
                  </button>
                )}
              </div>

              {editingUpi && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <input placeholder="Clinic UPI ID (e.g. 9064036668@slc)" value={upiInput} onChange={(e) => setUpiInput(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={handleSaveUpi} disabled={savingUpi} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#0d9488', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Save</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Doctor Roster & Queue Control</h3>

      {/* Doctor Roster */}
      {doctors.map((doc) => {
        const statusInfo = STATUS_OPTIONS.find((s) => s.value === doc.status) || STATUS_OPTIONS[0];
        const isEditing = editingId === doc.id;
        const docWaitingCount = bookingsByDoctor[doc.id]?.filter(b => b.status === 'waiting').length || 0;

        return (
          <div key={doc.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 24, padding: 18, marginBottom: 18, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03)' }}>
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} style={inputStyle} />
                <select value={editSpecialty} onChange={(e) => setEditSpecialty(e.target.value)} style={inputStyle}>
                  {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input type="number" value={editAvgMinutes} onChange={(e) => setEditAvgMinutes(e.target.value)} style={inputStyle} placeholder="Avg min per patient" />
                <input placeholder="Consultation fee (₹)" type="number" value={editFee} onChange={(e) => setEditFee(e.target.value)} style={inputStyle} />
                <DayPicker selectedDays={editWorkingDays} onToggle={toggleEditDay} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleSaveEdit(doc.id)} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#0d9488', color: 'white', fontWeight: 600 }}>Save</button>
                  <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ccc', background: 'white' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 16, background: '#e6fffa', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>
                      🩺
                    </div>
                    <div>
                      <h4 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.3px' }}>{doc.name}</h4>
                      <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0 0', fontWeight: 500 }}>{doc.specialty}</p>
                    </div>
                  </div>

                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: statusInfo.color, color: statusInfo.textColor, fontSize: 11, fontWeight: 700,
                    padding: '6px 12px', borderRadius: 20, border: `1px solid ${statusInfo.color}`,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusInfo.dotColor, display: 'inline-block' }} />
                    {statusInfo.label}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {doc.consultation_fee != null && (
                    <span style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      💳 ₹{doc.consultation_fee} Fee
                    </span>
                  )}
                  {(doc.working_days?.length > 0 || doc.start_time) && (
                    <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      🕒 {doc.working_days?.join(', ')} {doc.start_time && doc.end_time ? `· ${formatTime(doc.start_time)} – ${formatTime(doc.end_time)}` : ''}
                    </span>
                  )}
                </div>

                <div style={{ background: '#f8fafc', borderRadius: 14, padding: 10, marginBottom: 14, border: '1px solid #f1f5f9' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>Update Live Queue Status:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleStatusChange(doc.id, opt.value)}
                        style={{
                          padding: '5px 11px', borderRadius: 12, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          border: doc.status === opt.value ? 'none' : '1px solid #cbd5e1',
                          background: doc.status === opt.value ? opt.color : 'white',
                          color: doc.status === opt.value ? opt.textColor : '#64748b',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8 }}>
                  <button
                    onClick={() => toggleTodaysPatients(doc.id)}
                    style={{
                      padding: '10px 12px', borderRadius: 12, border: 'none',
                      background: expandedDoctor === doc.id ? '#115e59' : '#0d9488', color: 'white',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)',
                    }}
                  >
                    {expandedDoctor === doc.id ? 'Hide Queue' : `👥 Queue (${docWaitingCount})`}
                  </button>
                  <button onClick={() => setShowWalkinForm(showWalkinForm === doc.id ? null : doc.id)} style={{ padding: '10px 8px', borderRadius: 12, border: '1px solid #a7f3d0', background: '#f0fdf4', color: '#047857', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    + Walk-in
                  </button>
                  <button onClick={() => startEdit(doc)} style={{ padding: '10px 8px', borderRadius: 12, border: '1px solid #cbd5e1', background: 'white', color: '#334155', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    ⚙️ Edit
                  </button>
                  <button onClick={() => handleDelete(doc.id, doc.name)} style={{ padding: '10px 8px', borderRadius: 12, border: '1px solid #fca5a5', background: '#fff5f5', color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    🗑️
                  </button>
                </div>

                {showWalkinForm === doc.id && (
                  <div style={{ marginTop: 12, background: '#f8fafc', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid #e2e8f0' }}>
                    <input placeholder="Patient name" value={walkinName} onChange={(e) => setWalkinName(e.target.value)} style={inputStyle} />
                    <input placeholder="Phone (optional)" value={walkinPhone} onChange={(e) => setWalkinPhone(e.target.value)} style={inputStyle} />
                    <button onClick={() => handleWalkinSubmit(doc.id)} style={{ padding: 10, borderRadius: 8, border: 'none', background: '#0d9488', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Create Token</button>
                  </div>
                )}

                {/* Queue Drawer */}
                {expandedDoctor === doc.id && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                    {loadingBookings ? (
                      <p style={{ fontSize: 13, color: '#999', textAlign: 'center' }}>Loading queue...</p>
                    ) : !bookingsByDoctor[doc.id] || bookingsByDoctor[doc.id].length === 0 ? (
                      <p style={{ fontSize: 13, color: '#999', textAlign: 'center' }}>No bookings for today yet.</p>
                    ) : (
                      bookingsByDoctor[doc.id].map((b) => {
                        const isWaiting = b.status === 'waiting';
                        const isUpi = b.payment_method === 'upi';
                        const isWalkin = b.is_walkin;

                        return (
                          <div key={b.id} style={{ background: isWaiting ? '#ffffff' : '#f0fdf4', border: '1px solid #e2e8f0', borderRadius: 16, padding: 14, marginBottom: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 16, fontWeight: 800, color: '#0d9488' }}>#{b.token_number}</span>
                                  <h5 style={{ fontWeight: 800, fontSize: 15, margin: 0, color: '#0f172a' }}>{b.patient_name || 'Patient'}</h5>
                                </div>
                                {b.patient_phone && (
                                  <a href={`tel:${b.patient_phone}`} style={{ fontSize: 12, color: '#0284c7', textDecoration: 'none', fontWeight: 600, display: 'inline-block', marginTop: 4 }}>
                                    📞 {b.patient_phone}
                                  </a>
                                )}
                              </div>

                              <span style={{
                                background: isWalkin ? '#f1f5f9' : '#e0e7ff', color: isWalkin ? '#334155' : '#3730a3',
                                fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 8,
                              }}>
                                {isWalkin ? '🚪 Walk-In' : '📱 App Token'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 10px', borderRadius: 10, margin: '8px 0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{
                                  background: isUpi ? '#d1fae5' : '#fef3c7', color: isUpi ? '#065f46' : '#92400e',
                                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                                }}>
                                  {isUpi ? '🟢 UPI Verified' : '🪙 Cash Pending'}
                                </span>
                                {b.utr_id && <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>UTR: {b.utr_id}</span>}
                              </div>

                              {isUpi && b.payment_screenshot_url && (
                                <button
                                  onClick={() => setViewScreenshotModal({ ...b, doctorName: doc.name })}
                                  style={{ border: 'none', background: '#ccfbf1', color: '#0f766e', fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}
                                >
                                  🖼️ Screenshot
                                </button>
                              )}
                            </div>

                            {isWaiting ? (
                              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                <button
                                  onClick={() => handleMarkSeen(b.id, doc.id)}
                                  disabled={updatingPatient === b.id}
                                  style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: '#0d9488', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                                >
                                  {updatingPatient === b.id ? 'Updating...' : '✓ Call & Mark Seen'}
                                </button>
                                <button
                                  onClick={() => handleNoShowCancel(b.id, doc.id)}
                                  disabled={updatingPatient === b.id}
                                  style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid #fca5a5', background: '#fff5f5', color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                                >
                                  Did Not Show
                                </button>
                              </div>
                            ) : (
                              <p style={{ color: '#047857', fontWeight: 700, fontSize: 12, margin: '6px 0 0 0' }}>✓ Completed / Seen</p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* Add New Doctor Button & Form */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', background: '#0d9488', color: 'white', fontWeight: 700, fontSize: 14, marginTop: 10, cursor: 'pointer' }}
      >
        {showAddForm ? 'Close Form' : '+ Add New Doctor'}
      </button>

      {showAddForm && (
        <form onSubmit={handleAddDoctor} style={{ background: 'white', borderRadius: 20, padding: 20, marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Add Doctor Profile</h4>
          
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>Doctor Name *</label>
            <input placeholder="e.g. Dr. Siddika Khatun" value={newName} onChange={(e) => setNewName(e.target.value)} style={inputStyle} required />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>Specialty *</label>
            <select value={newSpecialty} onChange={(e) => setNewSpecialty(e.target.value)} style={inputStyle}>
              {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>Fee (₹)</label>
              <input placeholder="200" type="number" value={newFee} onChange={(e) => setNewFee(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>Avg Min / Patient</label>
              <input placeholder="10" type="number" value={newAvgMinutes} onChange={(e) => setNewAvgMinutes(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>Working Days</label>
            <DayPicker selectedDays={newWorkingDays} onToggle={toggleNewDay} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>Start Time</label>
              <input type="time" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>End Time</label>
              <input type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingDoctor}
            style={{ padding: 14, borderRadius: 12, border: 'none', background: '#0d9488', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 6 }}
          >
            {savingDoctor ? 'Saving Doctor...' : '✓ Save Doctor Profile'}
          </button>
        </form>
      )}

      {/* Screenshot Modal */}
      {viewScreenshotModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 1000,
        }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 20, width: '100%', maxWidth: 420, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Verify Payment Receipt</h3>
              <button onClick={() => setViewScreenshotModal(null)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: 28, height: 28, fontWeight: 700, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 14, border: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Patient: {viewScreenshotModal.patient_name || 'N/A'}</p>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#64748b' }}>Token #{viewScreenshotModal.token_number} · Doctor: {viewScreenshotModal.doctorName}</p>
              {viewScreenshotModal.utr_id && (
                <p style={{ margin: '6px 0 0 0', fontSize: 13, fontWeight: 700, color: '#0d9488' }}>UTR ID: {viewScreenshotModal.utr_id}</p>
              )}
            </div>

            <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#0f172a', maxHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <img
                src={viewScreenshotModal.payment_screenshot_url}
                alt="Payment Screenshot"
                style={{ width: '100%', height: 'auto', maxHeight: 320, objectFit: 'contain' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <a
                href={viewScreenshotModal.payment_screenshot_url}
                target="_blank"
                rel="noreferrer"
                style={{ flex: 1, padding: 12, borderRadius: 12, border: '1px solid #cbd5e1', background: 'white', color: '#0f172a', fontWeight: 700, fontSize: 13, textDecoration: 'none', textAlign: 'center' }}
              >
                🔍 Open Full Image
              </a>
              <button
                onClick={() => setViewScreenshotModal(null)}
                style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: '#0d9488', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                ✓ Confirm Verified
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 1000,
        }}>
          <div style={{ background: 'white', borderRadius: 28, padding: 24, width: '100%', maxWidth: 360, textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#0d9488', background: '#ccfbf1', padding: '4px 10px', borderRadius: 12 }}>CLINIC PAYMENT QR</span>
              <button onClick={() => setShowQrModal(false)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: 28, height: 28, fontWeight: 700, cursor: 'pointer' }}>✕</button>
            </div>

            <h3 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Scan to Pay Reception</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: 12, color: '#64748b' }}>Works with Google Pay, PhonePe, Paytm & BHIM</p>

            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 20, border: '1px solid #e2e8f0', display: 'inline-block', marginBottom: 16 }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=Shri Durga Medical Hall&cu=INR`)}`}
                alt="Clinic UPI QR Code"
                style={{ width: 180, height: 180, display: 'block', margin: '0 auto' }}
              />
            </div>

            <p style={{ fontSize: 13, fontWeight: 700, color: '#0d9488', margin: '0 0 18px 0', background: '#f0fdf4', padding: '8px 12px', borderRadius: 10 }}>
              UPI ID: {upiId}
            </p>

            <button
              onClick={() => setShowQrModal(false)}
              style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', background: '#0f172a', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            >
              Done / Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}