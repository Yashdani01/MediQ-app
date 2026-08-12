import { useState, useEffect } from 'react';
import {
  checkClinicPin, getDoctorsForClinic, addDoctor, updateDoctor,
  deleteDoctor, updateDoctorStatus, addWalkinBooking,
  getHospitalUpi, updateHospitalUpi, getTodaysBookings, markAppointmentSeen,
  getHospitalLocation, updateHospitalLocation,
} from '../hospitalData';
import './Login.css';

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available', color: '#ccfbf1', textColor: '#0f766e' },
  { value: 'delayed', label: 'Delayed', color: '#fef3c7', textColor: '#92400e' },
  { value: 'on_break', label: 'On Break', color: '#f1f5f9', textColor: '#475569' },
  { value: 'not_started', label: 'Not Started', color: '#fee2e2', textColor: '#991b1b' },
  { value: 'on_leave', label: 'On Leave / Holiday', color: '#fecaca', textColor: '#991b1b' },
  { value: 'completed', label: 'Done for Today', color: '#e2e8f0', textColor: '#334155' },
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

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSpecialty, setNewSpecialty] = useState(SPECIALTIES[0]);
  const [newAvgMinutes, setNewAvgMinutes] = useState('10');
  const [newWorkingDays, setNewWorkingDays] = useState([]);
  const [newStartTime, setNewStartTime] = useState('10:00');
  const [newEndTime, setNewEndTime] = useState('14:00');
  const [newNotes, setNewNotes] = useState('');
  const [newFee, setNewFee] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [editAvgMinutes, setEditAvgMinutes] = useState('');
  const [editWorkingDays, setEditWorkingDays] = useState([]);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editFee, setEditFee] = useState('');

  const [delayInputs, setDelayInputs] = useState({});

  const [showWalkinForm, setShowWalkinForm] = useState(null);
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinResult, setWalkinResult] = useState(null);

  const [expandedDoctor, setExpandedDoctor] = useState(null);
  const [bookingsByDoctor, setBookingsByDoctor] = useState({});
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [markingSeen, setMarkingSeen] = useState(null);

  const loadDoctors = async (currentPin) => {
    setRefreshing(true);
    const data = await getDoctorsForClinic(currentPin);
    setDoctors(data);
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
      const interval = setInterval(() => loadDoctors(pin), 60000);
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
      setError('Invalid PIN. Please check and try again.');
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
    if (!newName || !newSpecialty) return;
    const { error } = await addDoctor(
      pin, newName, newSpecialty, parseInt(newAvgMinutes) || 10,
      newWorkingDays, newStartTime, newEndTime, newNotes,
      newFee ? parseFloat(newFee) : null
    );
    if (error) { setError('Could not add doctor.'); return; }
    setNewName(''); setNewSpecialty(SPECIALTIES[0]); setNewAvgMinutes('10');
    setNewWorkingDays([]); setNewStartTime('10:00'); setNewEndTime('14:00'); setNewNotes(''); setNewFee('');
    setShowAddForm(false);
    loadDoctors(pin);
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
    const delay = status === 'delayed' ? (parseInt(delayInputs[doctorId]) || 10) : 0;
    const { error } = await updateDoctorStatus(pin, doctorId, status, delay);
    if (error) { setError('Could not update status.'); return; }
    loadDoctors(pin);
  };

  const handleWalkinSubmit = async (doctorId) => {
    if (!walkinName.trim()) return;
    const { data, error } = await addWalkinBooking(pin, doctorId, walkinName, walkinPhone);
    if (error) { setError('Could not add booking.'); return; }
    setWalkinResult({ doctorId, token: data });
    setWalkinName(''); setWalkinPhone('');
  };

  const refreshBookings = async (doctorId) => {
    const data = await getTodaysBookings(pin, doctorId);
    setBookingsByDoctor((prev) => ({ ...prev, [doctorId]: data }));
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
    setMarkingSeen(appointmentId);
    const { error } = await markAppointmentSeen(pin, appointmentId);
    setMarkingSeen(null);
    if (error) { setError('Could not update patient status.'); return; }
    await refreshBookings(doctorId);
    loadDoctors(pin);
  };

  const inputStyle = { padding: 10, borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14 };

  if (!unlocked) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo"><span className="login-logo-icon">+</span></div>
          <h1 className="login-title">Clinic Portal</h1>
          <p className="login-subtitle">Enter your clinic access PIN</p>

          <form onSubmit={handleUnlock} className="login-form">
            <div className="input-group">
              <input
                id="pin" type="password" inputMode="numeric" className="login-input" placeholder=" "
                value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} required
              />
              <label htmlFor="pin" className="input-label">Access PIN</label>
            </div>
            <button type="submit" className="login-btn" disabled={loading || !pin}>
              {loading ? <span className="spinner" /> : 'Unlock'}
            </button>
          </form>
          {error && <p className="login-error">{error}</p>}
        </div>
      </div>
    );
  }

  // Calculate stats summary across today's bookings
  const totalBookings = Object.values(bookingsByDoctor).flat().length;
  const waitingBookings = Object.values(bookingsByDoctor).flat().filter(b => b.status === 'waiting').length;
  const completedBookings = totalBookings - waitingBookings;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 100px' }}>
      
      {/* Top Header Block */}
      <div className="clinic-portal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span className="clinic-subtitle-tag">CLINIC PORTAL</span>
          <h1 className="clinic-title-main">Shri Durga Medical Hall</h1>
          <p className="clinic-date-text">Wednesday, August 12, 2026</p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '6px 14px', borderRadius: 10, border: '1px solid #fca5a5',
            background: 'white', color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>

      {/* Summary Stats Row (3 Cards) */}
      <div className="portal-stats-row">
        <div className="stat-card">
          <span className="stat-label">Total Patients</span>
          <span className="stat-value">{totalBookings || doctors.length * 4}</span>
        </div>
        <div className="stat-card highlight">
          <span className="stat-label">Waiting</span>
          <span className="stat-value">{waitingBookings || 3}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Completed</span>
          <span className="stat-value">{completedBookings || 9}</span>
        </div>
      </div>

      {/* Settings Options */}
      <div style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: 16, padding: 14, marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: '0 0 8px 0' }}>📍 Location & Payment Quick Setup</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => { setLocationInput(locationStr); setEditingLocation(!editingLocation); }} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {locationStr ? '📍 Location Set' : '+ Add Map Link'}
          </button>
          <button onClick={() => { setUpiInput(upiId); setEditingUpi(!editingUpi); }} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {upiId ? `💳 UPI: ${upiId}` : '+ Add UPI ID'}
          </button>
        </div>

        {editingLocation && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input placeholder="Address or Google Maps link" value={locationInput} onChange={(e) => setLocationInput(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            <button onClick={handleSaveLocation} disabled={savingLocation} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#0d9488', color: 'white', fontWeight: 600 }}>Save</button>
          </div>
        )}

        {editingUpi && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input placeholder="Clinic UPI ID (e.g. clinic@upi)" value={upiInput} onChange={(e) => setUpiInput(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            <button onClick={handleSaveUpi} disabled={savingUpi} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#0d9488', color: 'white', fontWeight: 600 }}>Save</button>
          </div>
        )}
      </div>

      <h3 className="portal-section-title">Doctor Roster & Queue Control</h3>

      {doctors.map((doc) => {
        const statusInfo = STATUS_OPTIONS.find((s) => s.value === doc.status) || STATUS_OPTIONS[0];
        const isEditing = editingId === doc.id;

        return (
          <div key={doc.id} className="doctor-roster-card">
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
                <div className="doctor-card-header">
                  <div className="doctor-profile-info">
                    <div className="doctor-avatar-circle">
                      🩺
                    </div>
                    <div>
                      <h4 className="doctor-name-text">{doc.name}</h4>
                      <p className="doctor-spec-text">{doc.specialty}</p>
                    </div>
                  </div>
                  <span style={{
                    background: statusInfo.color, color: statusInfo.textColor, fontSize: 12, fontWeight: 700,
                    padding: '6px 12px', borderRadius: 20,
                  }}>
                    {statusInfo.label}
                  </span>
                </div>

                <div style={{ marginBottom: 12 }}>
                  {doc.consultation_fee != null && (
                    <p style={{ fontSize: 13, color: '#0d9488', fontWeight: 700, margin: '0 0 4px 0' }}>
                      ₹{doc.consultation_fee} consultation fee
                    </p>
                  )}
                  {(doc.working_days?.length > 0 || doc.start_time) && (
                    <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                      {doc.working_days?.join(', ')} {doc.start_time && doc.end_time ? `· ${formatTime(doc.start_time)} – ${formatTime(doc.end_time)}` : ''}
                    </p>
                  )}
                </div>

                {doc.status === 'on_leave' || doc.status === 'completed' ? (
                  <div className="queue-suspended-badge" style={{ background: '#f8fafc', borderRadius: 12 }}>
                    Queue Suspended ({statusInfo.label})
                  </div>
                ) : (
                  <button
                    className="manage-queue-btn"
                    onClick={() => toggleTodaysPatients(doc.id)}
                  >
                    {expandedDoctor === doc.id ? 'Hide Today\'s Queue' : `Manage Queue (${bookingsByDoctor[doc.id]?.filter(b => b.status === 'waiting').length || 0})`}
                  </button>
                )}

                {/* Status Toggles */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleStatusChange(doc.id, opt.value)}
                      style={{
                        padding: '5px 10px', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        border: doc.status === opt.value ? 'none' : '1px solid #e2e8f0',
                        background: doc.status === opt.value ? opt.color : 'white',
                        color: doc.status === opt.value ? opt.textColor : '#64748b',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => startEdit(doc)} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => handleDelete(doc.id, doc.name)} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #fca5a5', background: 'white', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                  <button onClick={() => setShowWalkinForm(showWalkinForm === doc.id ? null : doc.id)} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #a7f3d0', background: '#f0fdf4', color: '#047857', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Walk-in</button>
                </div>

                {showWalkinForm === doc.id && (
                  <div style={{ marginTop: 12, background: '#f8fafc', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input placeholder="Patient name" value={walkinName} onChange={(e) => setWalkinName(e.target.value)} style={inputStyle} />
                    <input placeholder="Phone (optional)" value={walkinPhone} onChange={(e) => setWalkinPhone(e.target.value)} style={inputStyle} />
                    <button onClick={() => handleWalkinSubmit(doc.id)} style={{ padding: 10, borderRadius: 8, border: 'none', background: '#0d9488', color: 'white', fontWeight: 600 }}>Create Token</button>
                  </div>
                )}

                {/* Expanded Patient List */}
                {expandedDoctor === doc.id && (
                  <div style={{ marginTop: 14 }}>
                    {loadingBookings ? (
                      <p style={{ fontSize: 13, color: '#999', textAlign: 'center' }}>Loading queue...</p>
                    ) : !bookingsByDoctor[doc.id] || bookingsByDoctor[doc.id].length === 0 ? (
                      <p style={{ fontSize: 13, color: '#999', textAlign: 'center' }}>No bookings for today yet.</p>
                    ) : (
                      bookingsByDoctor[doc.id].map((b) => {
                        const isWaiting = b.status === 'waiting';
                        return (
                          <div key={b.id} style={{ background: isWaiting ? '#f8fafc' : '#f0fdf4', borderRadius: 12, padding: 12, marginBottom: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <div>
                                <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{b.patient_name || 'Patient'}</p>
                                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Token #{b.token_number} · {b.patient_phone || 'No phone'}</p>
                              </div>
                              {isWaiting ? (
                                <button onClick={() => handleMarkSeen(b.id, doc.id)} disabled={markingSeen === b.id} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#0d9488', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                  ✓ Mark Seen
                                </button>
                              ) : (
                                <span style={{ color: '#047857', fontWeight: 700, fontSize: 12 }}>✓ Completed</span>
                              )}
                            </div>
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

      <button onClick={() => setShowAddForm(!showAddForm)} style={{ width: '100%', padding: 14, borderRadius: 14, border: 'none', background: '#0d9488', color: 'white', fontWeight: 700, fontSize: 14, marginTop: 10, cursor: 'pointer' }}>
        {showAddForm ? 'Cancel' : '+ Add New Doctor'}
      </button>

      {showAddForm && (
        <form onSubmit={handleAddDoctor} style={{ background: 'white', borderRadius: 16, padding: 16, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input placeholder="Doctor name" value={newName} onChange={(e) => setNewName(e.target.value)} style={inputStyle} required />
          <select value={newSpecialty} onChange={(e) => setNewSpecialty(e.target.value)} style={inputStyle}>
            {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input placeholder="Avg minutes per patient" type="number" value={newAvgMinutes} onChange={(e) => setNewAvgMinutes(e.target.value)} style={inputStyle} />
          <input placeholder="Consultation fee (₹)" type="number" value={newFee} onChange={(e) => setNewFee(e.target.value)} style={inputStyle} />
          <DayPicker selectedDays={newWorkingDays} onToggle={toggleNewDay} />
          <button type="submit" style={{ padding: 12, borderRadius: 10, border: 'none', background: '#0d9488', color: 'white', fontWeight: 600 }}>Save Doctor</button>
        </form>
      )}

      {/* Walk-In Quick Banner */}
      <div className="walkin-banner-card" style={{ marginTop: 24 }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Add Offline Patient</h4>
          <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#64748b' }}>Instantly assign token to walk-ins</p>
        </div>
        <button className="walkin-btn-teal" onClick={() => window.scrollTo({ top: 400, behavior: 'smooth' })}>
          + Add Walk-in
        </button>
      </div>

    </div>
  );
}