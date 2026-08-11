import { useState, useEffect } from 'react';
import {
  checkClinicPin, getDoctorsForClinic, addDoctor, updateDoctor,
  deleteDoctor, updateDoctorStatus, addWalkinBooking,
  getHospitalUpi, updateHospitalUpi, getTodaysBookings, markAppointmentSeen,
} from '../hospitalData';
import './Login.css';

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available', color: '#22c55e' },
  { value: 'delayed', label: 'Delayed', color: '#f59e0b' },
  { value: 'on_break', label: 'On Break', color: '#6b7280' },
  { value: 'not_started', label: 'Not Started', color: '#ef4444' },
  { value: 'completed', label: 'Done for Today', color: '#374151' },
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
            background: selectedDays.includes(day) ? '#4f6ef7' : 'white',
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

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSpecialty, setNewSpecialty] = useState(SPECIALTIES[0]);
  const [newAvgMinutes, setNewAvgMinutes] = useState('10');
  const [newWorkingDays, setNewWorkingDays] = useState([]);
  const [newStartTime, setNewStartTime] = useState('10:00');
  const [newEndTime, setNewEndTime] = useState('14:00');
  const [newNotes, setNewNotes] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [editAvgMinutes, setEditAvgMinutes] = useState('');
  const [editWorkingDays, setEditWorkingDays] = useState([]);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editNotes, setEditNotes] = useState('');

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

  useEffect(() => {
    if (unlocked) {
      loadDoctors(pin);
      loadUpi(pin);
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

  const handleSaveUpi = async () => {
    setSavingUpi(true);
    const { error } = await updateHospitalUpi(pin, upiInput.trim());
    setSavingUpi(false);
    if (error) { setError('Could not save UPI ID.'); return; }
    setUpiId(upiInput.trim());
    setEditingUpi(false);
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
      newWorkingDays, newStartTime, newEndTime, newNotes
    );
    if (error) { setError('Could not add doctor.'); return; }
    setNewName(''); setNewSpecialty(SPECIALTIES[0]); setNewAvgMinutes('10');
    setNewWorkingDays([]); setNewStartTime('10:00'); setNewEndTime('14:00'); setNewNotes('');
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
  };

  const handleSaveEdit = async (doctorId) => {
    const { error } = await updateDoctor(
      pin, doctorId, editName, editSpecialty, parseInt(editAvgMinutes) || 10,
      editWorkingDays, editStartTime, editEndTime, editNotes
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

  const timeAgo = (timestamp) => {
    if (!timestamp) return '';
    const diffMin = Math.floor((Date.now() - new Date(timestamp)) / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin === 1) return '1 min ago';
    return `${diffMin} min ago`;
  };

  const inputStyle = { padding: 10, borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14 };

  if (!unlocked) {
    return (
      <div className="login-page">
        <div className="login-bg-shape shape-1" />
        <div className="login-bg-shape shape-2" />
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

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px 100px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Clinic Portal</h1>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>
        {refreshing ? 'Refreshing...' : `${doctors.length} doctor(s) on your roster`}
      </p>

      <div style={{
        background: '#f8f9fb', border: '1px solid #eee', borderRadius: 14, padding: 16, marginBottom: 16,
      }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 8 }}>Payment Settings</p>
        {editingUpi ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              placeholder="Your UPI ID (e.g. clinicname@upi)"
              value={upiInput} onChange={(e) => setUpiInput(e.target.value)}
              style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 14 }}
            />
            <button onClick={handleSaveUpi} disabled={savingUpi} style={{
              padding: '10px 16px', borderRadius: 8, border: 'none', background: '#22c55e', color: 'white', fontWeight: 600, cursor: 'pointer',
            }}>
              {savingUpi ? 'Saving...' : 'Save'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: upiId ? '#333' : '#999' }}>
              {upiId || 'No UPI ID set — patients will only see Cash option'}
            </span>
            <button onClick={() => { setUpiInput(upiId); setEditingUpi(true); }} style={{
              padding: '6px 12px', borderRadius: 8, border: '1px solid #ddd', background: 'white', fontSize: 13, cursor: 'pointer',
            }}>
              {upiId ? 'Edit' : '+ Add'}
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => setShowAddForm(!showAddForm)}
        style={{
          width: '100%', padding: '14px', borderRadius: 12, border: 'none',
          background: '#4f6ef7', color: 'white', fontWeight: 600, fontSize: 15, marginBottom: 16, cursor: 'pointer',
        }}
      >
        {showAddForm ? 'Cancel' : '+ Add Doctor'}
      </button>

      {showAddForm && (
        <form onSubmit={handleAddDoctor} style={{
          background: '#f8f9fb', borderRadius: 14, padding: 16, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <input placeholder="Doctor name" value={newName} onChange={(e) => setNewName(e.target.value)} style={inputStyle} required />

          <select value={newSpecialty} onChange={(e) => setNewSpecialty(e.target.value)} style={inputStyle}>
            {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <input placeholder="Avg minutes per patient" type="number" value={newAvgMinutes} onChange={(e) => setNewAvgMinutes(e.target.value)} style={inputStyle} />

          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>Working Days</p>
            <DayPicker selectedDays={newWorkingDays} onToggle={toggleNewDay} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>Start Time</p>
              <input type="time" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>End Time</p>
              <input type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
            </div>
          </div>

          <textarea
            placeholder="Notes (optional) e.g. Evening slot only on Saturdays"
            value={newNotes} onChange={(e) => setNewNotes(e.target.value)}
            style={{ ...inputStyle, minHeight: 60, fontFamily: 'inherit', resize: 'vertical' }}
          />

          <button type="submit" style={{
            padding: 12, borderRadius: 10, border: 'none', background: '#22c55e', color: 'white', fontWeight: 600, cursor: 'pointer',
          }}>
            Save Doctor
          </button>
        </form>
      )}

      {error && <p style={{ color: '#ef4444', marginBottom: 12 }}>{error}</p>}

      {doctors.map((doc) => {
        const statusInfo = STATUS_OPTIONS.find((s) => s.value === doc.status) || STATUS_OPTIONS[0];
        const isEditing = editingId === doc.id;

        return (
          <div key={doc.id} style={{
            background: 'white', border: '1px solid #eee', borderRadius: 16, padding: 16, marginBottom: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} style={inputStyle} />

                <select value={editSpecialty} onChange={(e) => setEditSpecialty(e.target.value)} style={inputStyle}>
                  {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>

                <input type="number" value={editAvgMinutes} onChange={(e) => setEditAvgMinutes(e.target.value)} style={inputStyle} />

                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>Working Days</p>
                  <DayPicker selectedDays={editWorkingDays} onToggle={toggleEditDay} />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="time" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                  <input type="time" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                </div>

                <textarea
                  placeholder="Notes (optional)"
                  value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
                  style={{ ...inputStyle, minHeight: 50, fontFamily: 'inherit', resize: 'vertical' }}
                />

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleSaveEdit(doc.id)} style={{
                    flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#22c55e', color: 'white', fontWeight: 600, cursor: 'pointer',
                  }}>Save</button>
                  <button onClick={() => setEditingId(null)} style={{
                    flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ccc', background: 'white', cursor: 'pointer',
                  }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{doc.name}</h3>
                    <p style={{ fontSize: 14, color: '#666', margin: '2px 0 0' }}>{doc.specialty}</p>
                  </div>
                  <span style={{
                    background: statusInfo.color, color: 'white', fontSize: 12, fontWeight: 600,
                    padding: '4px 10px', borderRadius: 20,
                  }}>
                    {statusInfo.label}{doc.status === 'delayed' && doc.delay_minutes ? ` ${doc.delay_minutes}m` : ''}
                  </span>
                </div>

                {(doc.working_days?.length > 0 || doc.start_time) && (
                  <p style={{ fontSize: 13, color: '#4f6ef7', margin: '8px 0 0', fontWeight: 600 }}>
                    {doc.working_days?.join(', ')}
                    {doc.start_time && doc.end_time ? ` · ${formatTime(doc.start_time)} – ${formatTime(doc.end_time)}` : ''}
                  </p>
                )}
                {doc.notes && (
                  <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0', fontStyle: 'italic' }}>{doc.notes}</p>
                )}

                <p style={{ fontSize: 12, color: '#999', margin: '8px 0' }}>
                  Updated {timeAgo(doc.status_updated_at)}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleStatusChange(doc.id, opt.value)}
                      style={{
                        padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        border: doc.status === opt.value ? 'none' : '1px solid #ddd',
                        background: doc.status === opt.value ? opt.color : 'white',
                        color: doc.status === opt.value ? 'white' : '#333',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {doc.status !== 'delayed' ? null : (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="number" placeholder="Delay (min)"
                      value={delayInputs[doc.id] ?? doc.delay_minutes ?? ''}
                      onChange={(e) => setDelayInputs({ ...delayInputs, [doc.id]: e.target.value })}
                      style={{ padding: 8, borderRadius: 8, border: '1px solid #e0e0e0', width: 120 }}
                    />
                    <button
                      onClick={() => handleStatusChange(doc.id, 'delayed')}
                      style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#f59e0b', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Update Delay
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => startEdit(doc)} style={{
                    flex: 1, padding: 9, borderRadius: 8, border: '1px solid #ddd', background: 'white', fontSize: 13, cursor: 'pointer',
                  }}>Edit</button>
                  <button onClick={() => handleDelete(doc.id, doc.name)} style={{
                    flex: 1, padding: 9, borderRadius: 8, border: '1px solid #fca5a5', background: 'white', color: '#ef4444', fontSize: 13, cursor: 'pointer',
                  }}>Remove</button>
                  <button
                    onClick={() => { setShowWalkinForm(showWalkinForm === doc.id ? null : doc.id); setWalkinResult(null); }}
                    style={{ flex: 1, padding: 9, borderRadius: 8, border: '1px solid #93c5fd', background: 'white', color: '#4f6ef7', fontSize: 13, cursor: 'pointer' }}
                  >
                    + Walk-in
                  </button>
                </div>

                {showWalkinForm === doc.id && (
                  <div style={{ marginTop: 10, background: '#f8f9fb', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input placeholder="Patient name" value={walkinName} onChange={(e) => setWalkinName(e.target.value)} style={inputStyle} />
                    <input placeholder="Phone (optional)" value={walkinPhone} onChange={(e) => setWalkinPhone(e.target.value)} style={inputStyle} />
                    <button onClick={() => handleWalkinSubmit(doc.id)} style={{
                      padding: 10, borderRadius: 8, border: 'none', background: '#4f6ef7', color: 'white', fontWeight: 600, cursor: 'pointer',
                    }}>
                      Create Token
                    </button>
                    {walkinResult?.doctorId === doc.id && (
                      <p style={{ textAlign: 'center', fontWeight: 700, color: '#22c55e' }}>
                        Token #{walkinResult.token} created
                      </p>
                    )}
                  </div>
                )}

                <button
                  onClick={() => toggleTodaysPatients(doc.id)}
                  style={{
                    width: '100%', marginTop: 10, padding: 9, borderRadius: 8, border: '1px solid #ddd',
                    background: expandedDoctor === doc.id ? '#f0f2ff' : 'white', color: '#4f6ef7', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {expandedDoctor === doc.id ? 'Hide Today\'s Patients' : "View Today's Patients"}
                </button>

                {expandedDoctor === doc.id && (
                  <div style={{ marginTop: 10 }}>
                    {loadingBookings ? (
                      <p style={{ fontSize: 13, color: '#999', textAlign: 'center' }}>Loading...</p>
                    ) : !bookingsByDoctor[doc.id] || bookingsByDoctor[doc.id].length === 0 ? (
                      <p style={{ fontSize: 13, color: '#999', textAlign: 'center' }}>No bookings for today yet.</p>
                    ) : (
                      bookingsByDoctor[doc.id].map((b) => {
                        const isWaiting = b.status === 'waiting';
                        return (
                          <div key={b.id} style={{
                            background: isWaiting ? '#f8f9fb' : '#f0fdf4', borderRadius: 10, padding: 12, marginBottom: 8,
                            opacity: isWaiting ? 1 : 0.75,
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{b.patient_name || 'Unknown'}</p>
                                <p style={{ fontSize: 13, color: '#666', margin: '2px 0 0' }}>{b.patient_phone || 'No phone'}</p>
                              </div>
                              <span style={{
                                background: b.payment_method === 'upi' ? '#4f6ef7' : '#6b7280', color: 'white',
                                fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                              }}>
                                {b.payment_method === 'upi' ? 'UPI' : 'Cash'}
                              </span>
                            </div>
                            <p style={{ fontSize: 12, color: '#999', margin: '6px 0 0' }}>
                              Booking ID: <strong>{b.booking_code || '—'}</strong> · Token: <strong>{b.token_number}</strong>
                            </p>
                            {b.payment_method === 'upi' && (
                              <p style={{ fontSize: 12, color: '#999', margin: '4px 0 0' }}>
                                Txn ID: <strong>{b.transaction_id || '—'}</strong>
                                {b.payment_screenshot_url && (
                                  <> · <a href={b.payment_screenshot_url} target="_blank" rel="noopener noreferrer" style={{ color: '#4f6ef7' }}>View screenshot</a></>
                                )}
                              </p>
                            )}
                            {isWaiting ? (
                              <button
                                onClick={() => handleMarkSeen(b.id, doc.id)}
                                disabled={markingSeen === b.id}
                                style={{
                                  width: '100%', marginTop: 8, padding: 8, borderRadius: 8, border: 'none',
                                  background: '#22c55e', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                }}
                              >
                                {markingSeen === b.id ? 'Updating...' : '✓ Mark as Seen'}
                              </button>
                            ) : (
                              <p style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, margin: '8px 0 0' }}>✓ Seen</p>
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
    </div>
  );
}
