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

function formatBookingDateTime(ts) {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
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

  // Screen width state for responsive mobile/desktop layout
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Command Center Navigation Tab State: 'dashboard', 'roster', 'settings'
  const [activeTab, setActiveTab] = useState('dashboard');

  const [doctors, setDoctors] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [upiId, setUpiId] = useState('');
  const [upiInput, setUpiInput] = useState('');
  const [savingUpi, setSavingUpi] = useState(false);

  const [locationStr, setLocationStr] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [savingLocation, setSavingLocation] = useState(false);

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
  const [editAvgMinutes, setEditAvgMinutes] = useState('10');
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
    setActiveTab('dashboard');
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
    alert('UPI ID updated successfully!');
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
    alert('Location link updated successfully!');
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
    setEditAvgMinutes(String(doc.avg_minutes_per_patient || 10));
    
    const mergedSchedule = { ...DEFAULT_SCHEDULE };
    if (doc.custom_schedule) {
      for (const day of DAYS) {
        if (doc.custom_schedule[day]) {
          mergedSchedule[day] = {
            active: Boolean(doc.custom_schedule[day].active),
            start: doc.custom_schedule[day].start || '10:00',
            end: doc.custom_schedule[day].end || '14:00',
          };
        }
      }
    }
    setEditDaySchedules(mergedSchedule);
  };

  const handleSaveEdit = async (doctorId) => {
    const activeDays = Object.keys(editDaySchedules).filter((day) => editDaySchedules[day]?.active);
    const firstActiveDay = activeDays[0] || 'Mon';
    const startTime = editDaySchedules[firstActiveDay]?.start || '10:00';
    const endTime = editDaySchedules[firstActiveDay]?.end || '14:00';

    await updateDoctor(
      unlockedPin,
      doctorId,
      editName,
      editSpecialties.join(', '),
      parseInt(editAvgMinutes, 10) || 10,
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

  // Next Patient Dispatch Action
  const callNextPatient = async (doctorId) => {
    const docBookings = bookingsByDoctor[doctorId] || [];
    const nextWaiting = docBookings.find(b => b.status === 'waiting' || b.status === 'checked_in');
    if (!nextWaiting) {
      alert('No waiting patients in the queue for this doctor.');
      return;
    }
    await handleMarkSeen(nextWaiting.id, doctorId);
  };

  if (!unlocked) {
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 20% 20%, #12463d 0%, #0b332c 45%, #062b25 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '36px 28px', boxShadow: '0 25px 60px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#e6f4ea', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: '28px', fontWeight: 'bold', boxShadow: 'inset 0 0 0 1px rgba(16,185,129,0.15)' }}>✚</div>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '23px', color: '#0b332c', margin: '0 0 6px', letterSpacing: '-0.01em' }}>{clinicName}</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 26px', lineHeight: 1.5 }}>Secure Staff Access Portal. Enter 4-digit PIN.</p>
          <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="password"
              inputMode="numeric"
              placeholder="••••"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              required
              style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1.5px solid #e7e1d3', textAlign: 'center', fontSize: '26px', fontWeight: 'bold', letterSpacing: '10px', boxSizing: 'border-box', color: '#0b332c', transition: 'border-color 0.15s ease' }}
            />
            <button type="submit" disabled={loading || !pin} style={{ width: '100%', background: '#10b981', color: '#fff', border: 'none', padding: '14px', borderRadius: '14px', fontSize: '14px', fontWeight: '700', cursor: loading || !pin ? 'not-allowed' : 'pointer', opacity: loading || !pin ? 0.55 : 1, boxShadow: '0 8px 20px rgba(16,185,129,0.28)', transition: 'opacity 0.15s ease' }}>
              {loading ? 'Verifying...' : 'Access Portal →'}
            </button>
          </form>
          {error && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '14px', background: '#fef2f2', padding: '10px', borderRadius: '10px', fontWeight: '600' }}>{error}</p>}
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
    <div style={{ minHeight: '100vh', background: '#f8f6f0', color: '#0b332c', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
      
      {/* SIDEBAR NAVIGATION (Converts to Top Bar on Mobile) */}
      <aside style={{ width: isMobile ? '100%' : '260px', background: '#0b332c', color: '#fff', display: 'flex', flexDirection: isMobile ? 'row' : 'column', justifyContent: isMobile ? 'space-between' : 'flex-start', alignItems: isMobile ? 'center' : 'stretch', padding: isMobile ? '12px 16px' : '24px 16px', boxSizing: 'border-box', flexShrink: 0, position: isMobile ? 'relative' : 'sticky', top: 0, height: isMobile ? 'auto' : '100vh', overflowY: 'auto', zIndex: 100 }}>
        <div style={{ marginBottom: isMobile ? '0' : '28px', paddingLeft: isMobile ? '0' : '8px' }}>
          <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '2px' }}>MediQ Command</div>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: isMobile ? '15px' : '18px', color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{clinicName}</h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '6px', overflowX: isMobile ? 'auto' : 'visible' }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '12px', border: 'none', background: activeTab === 'dashboard' ? 'rgba(16,185,129,0.18)' : 'transparent', color: activeTab === 'dashboard' ? '#34d399' : '#cbd5e1', fontSize: '13px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease' }}
          >
            <span>⚡</span> {isMobile ? 'Operations' : 'Live Operations Desk'}
          </button>
          
          <button
            onClick={() => setActiveTab('roster')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '12px', border: 'none', background: activeTab === 'roster' ? 'rgba(16,185,129,0.18)' : 'transparent', color: activeTab === 'roster' ? '#34d399' : '#cbd5e1', fontSize: '13px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease' }}
          >
            <span>👨‍⚕️</span> {isMobile ? 'Roster' : 'Doctor Roster & Setup'}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '12px', border: 'none', background: activeTab === 'settings' ? 'rgba(16,185,129,0.18)' : 'transparent', color: activeTab === 'settings' ? '#34d399' : '#cbd5e1', fontSize: '13px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease' }}
          >
            <span>⚙️</span> {isMobile ? 'Settings' : 'Clinic Settings & UPI'}
          </button>
        </nav>

        {!isMobile ? (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', marginTop: 'auto' }}>
            <button onClick={handleLogout} style={{ width: '100%', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '10px', borderRadius: '10px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' }}>
              🚪 Logout Staff
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
            Logout
          </button>
        )}
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, padding: isMobile ? '16px' : '24px 28px', boxSizing: 'border-box', overflowY: 'auto', width: '100%' }}>
        
        {/* TOP STATUS BAR */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '16px 20px', marginBottom: '20px', border: '1px solid #e7e1d3', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(11,51,44,0.03)', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', margin: '0 0 2px' }}>📅 {todayDateStr}</p>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '17px', color: '#0b332c', margin: 0 }}>
              {activeTab === 'dashboard' && '⚡ Live Operations & Token Stream'}
              {activeTab === 'roster' && '👨‍⚕️ Doctor Roster Management'}
              {activeTab === 'settings' && '⚙️ Clinic Settings & QR Code'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => loadDoctors(unlockedPin)} disabled={refreshing} style={{ background: '#f1f5f9', border: '1px solid #e7e1d3', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#0b332c' }}>
              {refreshing ? 'Refreshing...' : '↻ Sync Data'}
            </button>
          </div>
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>{error}</div>}

        {/* ================= SECTION 1: DASHBOARD / LIVE OPERATIONS ================= */}
        {activeTab === 'dashboard' && (
          <div>
            {/* STATS AT A GLANCE */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
              {[
                { label: 'Total Tokens Today', value: totalBookings, bg: '#fff', color: '#0b332c' },
                { label: 'Waiting in Queue', value: waitingBookings, bg: '#fffbeb', color: '#d97706' },
                { label: 'Consulted / Done', value: completedBookings, bg: '#f0fdf4', color: '#15803d' },
              ].map((st, idx) => (
                <div key={idx} style={{ background: st.bg, border: '1px solid #e7e1d3', borderRadius: '16px', padding: '18px 16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(11,51,44,0.04)' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>{st.label}</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: st.color, fontFamily: 'Fraunces, serif', lineHeight: 1 }}>{st.value}</div>
                </div>
              ))}
            </div>

            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '17px', color: '#0b332c', marginBottom: '12px' }}>Active Doctor Queues &amp; Next Patient Dispatch</h3>

            {doctors.length === 0 ? (
              <div style={{ background: '#fff', border: '1px dashed #d8d0bd', borderRadius: '16px', padding: '36px', textAlign: 'center' }}>
                <p style={{ color: '#64748b', fontSize: '13px' }}>No active doctors found. Add doctors in the Roster tab.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {doctors.map((doc) => {
                  const docBookings = bookingsByDoctor[doc.id] || [];
                  const waitingList = docBookings.filter((b) => b.status === 'waiting' || b.status === 'checked_in');
                  const currentPatient = waitingList[0];
                  const statusInfo = STATUS_OPTIONS.find((s) => s.value === doc.status) || STATUS_OPTIONS[0];
                  const specs = doc.specialties || [doc.specialty || 'General Physician'];

                  return (
                    <div key={doc.id} style={{ background: '#fff', border: '1px solid #e7e1d3', borderRadius: '16px', padding: '18px', boxShadow: '0 2px 10px rgba(11,51,44,0.03)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#0b332c', color: '#d7b45e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '800', flexShrink: 0 }}>
                            {getInitials(doc.name)}
                          </div>
                          <div>
                            <h4 style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', color: '#0b332c', margin: '0 0 2px' }}>{doc.name}</h4>
                            <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0 }}>{specs.join(', ')}</p>
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '100px', background: statusInfo.soft, color: statusInfo.color }}>
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* STATUS SELECTOR CHIPS */}
                      <div style={{ background: '#f8f6f0', padding: '10px 12px', borderRadius: '12px', marginBottom: '12px', border: '1px solid #e7e1d3' }}>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Status:</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {STATUS_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => handleStatusChange(doc.id, opt.value)}
                              style={{ padding: '5px 9px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '700', cursor: 'pointer', border: doc.status === opt.value ? `1.5px solid ${opt.color}` : '1px solid #cbd5e1', background: doc.status === opt.value ? opt.soft : '#fff', color: doc.status === opt.value ? opt.color : '#64748b' }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* NEXT PATIENT CALL DISPATCHER */}
                      <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '14px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Current Active Token</div>
                          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0b332c' }}>
                            {currentPatient ? `Token #${currentPatient.queue_number || '1'} — ${currentPatient.patient_name}` : 'Queue is clear / No patients waiting'}
                          </div>
                        </div>
                        <button
                          onClick={() => callNextPatient(doc.id)}
                          disabled={!currentPatient}
                          style={{ background: currentPatient ? '#10b981' : '#cbd5e1', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontSize: '12.5px', fontWeight: '800', cursor: currentPatient ? 'pointer' : 'not-allowed', boxShadow: currentPatient ? '0 4px 12px rgba(16,185,129,0.3)' : 'none' }}
                        >
                          📢 Call Next Patient →
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                        <button onClick={() => toggleTodaysPatients(doc.id)} style={{ background: '#f1f5f9', border: '1px solid #e7e1d3', color: '#0b332c', padding: '8px 12px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}>
                          {expandedDoctor === doc.id ? 'Hide Full Queue' : `View Full Queue (${waitingList.length} Waiting)`}
                        </button>
                        <button onClick={() => setShowWalkinForm(showWalkinForm === doc.id ? null : doc.id)} style={{ background: '#fef3c7', border: '1px solid #fde047', color: '#92400e', padding: '8px 12px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}>
                          + Add Walk-in Token
                        </button>
                      </div>

                      {/* WALK-IN FORM */}
                      {showWalkinForm === doc.id && (
                        <div style={{ background: '#fffbeb', border: '1px solid #fde047', borderRadius: '12px', padding: '14px', marginTop: '12px' }}>
                          <h5 style={{ margin: '0 0 8px', fontSize: '12px', color: '#92400e', fontWeight: '800' }}>Generate Offline Walk-in Token</h5>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <input placeholder="Patient Name *" value={walkinName} onChange={(e) => setWalkinName(e.target.value)} style={{ flex: 1, padding: '9px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', minWidth: '150px' }} />
                            <input placeholder="Phone (Optional)" value={walkinPhone} onChange={(e) => setWalkinPhone(e.target.value)} style={{ width: '130px', padding: '9px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }} />
                            <button onClick={() => handleWalkinSubmit(doc.id)} style={{ background: '#d97706', color: '#fff', border: 'none', padding: '9px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>Issue Token</button>
                          </div>
                        </div>
                      )}

                      {/* EXPANDED QUEUE LIST */}
                      {expandedDoctor === doc.id && (
                        <div style={{ borderTop: '1px solid #e7e1d3', paddingTop: '14px', marginTop: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h5 style={{ margin: 0, fontSize: '12px', color: '#0b332c', fontWeight: '800' }}>Full Queue List ({docBookings.length})</h5>
                            <button onClick={() => refreshBookings(doc.id)} style={{ background: 'transparent', border: 'none', color: '#10b981', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Refresh</button>
                          </div>
                          {docBookings.length === 0 ? (
                            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>No bookings today.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {docBookings.map((b) => {
                                const isWaiting = b.status?.toLowerCase() === 'waiting' || b.status?.toLowerCase() === 'checked_in';
                                const isUpdating = updatingPatient === b.id;
                                return (
                                  <div key={b.id} style={{ background: '#f8f6f0', border: '1px solid #e7e1d3', borderRadius: '10px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <div>
                                      <span style={{ fontWeight: 'bold', fontSize: '12.5px', color: '#0b332c' }}>#{b.queue_number || '1'} — {b.patient_name}</span>
                                      <div style={{ fontSize: '11px', color: '#64748b' }}>{b.is_walkin ? '🚶 Walk-in' : '📱 App'} • <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>{b.status}</span></div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                      {isWaiting ? (
                                        <>
                                          <button onClick={() => handleMarkSeen(b.id, doc.id)} disabled={isUpdating} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Mark Seen</button>
                                          <button onClick={() => handleNoShowCancel(b.id, doc.id)} disabled={isUpdating} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
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
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= SECTION 2: DOCTOR ROSTER & SETUP ================= */}
        {activeTab === 'roster' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '17px', color: '#0b332c', margin: 0 }}>Clinic Doctors ({doctors.length})</h3>
              <button onClick={() => setShowAddForm(!showAddForm)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '10px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' }}>
                {showAddForm ? 'Close Form' : '+ Add Doctor'}
              </button>
            </div>

            {/* ADD DOCTOR FORM */}
            {showAddForm && (
              <form onSubmit={handleAddDoctor} style={{ background: '#fff', border: '1px solid #e7e1d3', borderRadius: '16px', padding: '20px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', color: '#0b332c', margin: 0 }}>Add New Doctor Profile</h4>
                
                <Field label="Doctor Name *">
                  <input placeholder="Dr. Gautam Banerjee" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} required />
                </Field>

                <Field label="Degrees & Qualifications *">
                  <input placeholder="MBBS, MD (General)" value={newDegrees} onChange={(e) => setNewDegrees(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} required />
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <Field label="Consultation Fee (₹)">
                    <input type="number" placeholder="500" value={newFee} onChange={(e) => setNewFee(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} />
                  </Field>
                  <Field label="Avg Time / Patient (Mins) *">
                    <input type="number" min="1" value={newAvgMinutes} onChange={(e) => setNewAvgMinutes(e.target.value)} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1.5px solid #10b981', background: '#f0fdf4', fontSize: '13px', fontWeight: 'bold', boxSizing: 'border-box' }} required />
                  </Field>
                </div>

                <SpecialtySelector selected={newSpecialties} onToggle={(spec) => toggleSpecialty(spec, newSpecialties, setNewSpecialties)} />
                
                <div style={{ background: '#f8f6f0', padding: '12px', borderRadius: '12px', border: '1px solid #e7e1d3' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: '800', color: '#0b332c', display: 'block', marginBottom: '4px' }}>📅 Visit Days &amp; Shift Hours *</label>
                  <ScheduleEditor value={daySchedules} onChange={setDaySchedules} />
                </div>

                <button type="submit" disabled={savingDoctor} style={{ width: '100%', background: '#0b332c', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '700', fontSize: '13.5px', cursor: 'pointer' }}>
                  {savingDoctor ? 'Saving...' : 'Save Doctor Profile'}
                </button>
              </form>
            )}

            {/* DOCTOR LIST CARDS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {doctors.map((doc) => {
                const isEditing = editingId === doc.id;
                const specs = doc.specialties || [doc.specialty || 'General Physician'];

                return (
                  <div key={doc.id} style={{ background: '#fff', border: '1px solid #e7e1d3', borderRadius: '16px', padding: '18px' }}>
                    {isEditing ? (
                      <div style={{ background: '#fcfbf9', border: '1.5px solid #10b981', borderRadius: '14px', padding: '16px' }}>
                        <h4 style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', color: '#0b332c', margin: '0 0 12px' }}>Edit Doctor Profile</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                          <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} placeholder="Name" />
                          <input value={editDegrees} onChange={(e) => setEditDegrees(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} placeholder="Degrees" />
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <input type="number" value={editFee} onChange={(e) => setEditFee(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} placeholder="Fee ₹" />
                            <input type="number" value={editAvgMinutes} onChange={(e) => setEditAvgMinutes(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} placeholder="Mins/patient" />
                          </div>
                          <SpecialtySelector selected={editSpecialties} onToggle={(spec) => toggleSpecialty(spec, editSpecialties, setEditSpecialties)} />
                          <ScheduleEditor value={editDaySchedules} onChange={setEditDaySchedules} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => setEditingId(null)} style={{ flex: 1, background: '#f1f5f9', padding: '10px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', border: '1px solid #cbd5e1' }}>Cancel</button>
                          <button onClick={() => handleSaveEdit(doc.id)} style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>Save</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <div>
                          <h4 style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', color: '#0b332c', margin: '0 0 2px' }}>{doc.name}</h4>
                          <p style={{ fontSize: '12px', color: '#10b981', fontWeight: '700', margin: '0 0 2px' }}>{doc.degrees || 'MBBS'} • ₹{doc.consultation_fee || 0}</p>
                          <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0 }}>{specs.join(', ')}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => startEdit(doc)} style={{ background: '#f1f5f9', border: '1px solid #e7e1d3', color: '#0b332c', padding: '7px 12px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}>Edit</button>
                          <button onClick={() => handleDelete(doc.id, doc.name)} style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '7px 12px', borderRadius: '8px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}>Remove</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= SECTION 3: SETTINGS & UPI QR ================= */}
        {activeTab === 'settings' && (
          <div style={{ background: '#fff', border: '1px solid #e7e1d3', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(11,51,44,0.03)' }}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', color: '#0b332c', margin: '0 0 16px' }}>Clinic Configuration &amp; Payments</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#0b332c', display: 'block', marginBottom: '6px' }}>Google Maps Location Link:</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input placeholder="Paste Google Maps URL" value={locationInput} onChange={(e) => setLocationInput(e.target.value)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', minWidth: '200px' }} />
                <button onClick={handleSaveLocation} disabled={savingLocation} style={{ background: '#0b332c', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>{savingLocation ? 'Saving...' : 'Save'}</button>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#0b332c', display: 'block', marginBottom: '6px' }}>Clinic UPI ID (for Patient Token Payments):</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <input placeholder="e.g. clinic@paytm" value={upiInput} onChange={(e) => setUpiInput(e.target.value)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', minWidth: '200px' }} />
                <button onClick={handleSaveUpi} disabled={savingUpi} style={{ background: '#0b332c', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>{savingUpi ? 'Saving...' : 'Save'}</button>
              </div>
              {upiId && (
                <button onClick={() => setShowQrModal(true)} style={{ background: '#fef3c7', border: '1px solid #fde047', color: '#92400e', padding: '9px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                  📱 View Payment QR Code
                </button>
              )}
            </div>
          </div>
        )}

      </main>

      {/* QR MODAL */}
      {showQrModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(6, 43, 37, 0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '340px', borderRadius: '24px', padding: '26px', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', color: '#0b332c', margin: '0 0 14px' }}>Clinic Payment QR</h3>
            <div style={{ background: '#f8f6f0', padding: '18px', borderRadius: '16px', display: 'inline-block', marginBottom: '14px', border: '1px solid #e7e1d3' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${encodeURIComponent(clinicName)}&cu=INR`)}`}
                alt="UPI QR Code"
                style={{ width: '180px', height: '180px', display: 'block' }}
              />
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 18px' }}>UPI ID: <strong style={{ color: '#0b332c' }}>{upiId}</strong></p>
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
      <label style={{ display: 'block', marginBottom: '6px', color: '#0b332c', fontSize: '12px', fontWeight: '700' }}>{label}</label>
      {children}
    </div>
  );
}

function SpecialtySelector({ selected, onToggle }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '7px', color: '#0b332c', fontSize: '12px', fontWeight: '700' }}>Specialties (Multiple Allowed):</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {SPECIALTIES.map((spec) => {
          const active = selected.includes(spec);
          return (
            <button
              key={spec}
              type="button"
              onClick={() => onToggle(spec)}
              style={{ padding: '7px 11px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', border: active ? '1.5px solid #10b981' : '1px solid #cbd5e1', background: active ? '#dcfce7' : '#fff', color: active ? '#15803d' : '#64748b' }}
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
    <div style={{ background: '#f8f6f0', border: '1px solid #e7e1d3', padding: '14px', borderRadius: '14px' }}>
      <p style={{ margin: '0 0 10px', color: '#0b332c', fontSize: '12px', fontWeight: '800' }}>🕒 Day-wise Consultation Timings</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {DAYS.map((day) => {
          const slot = value[day] || { active: false, start: '10:00', end: '14:00' };
          return (
            <div key={day} style={{ display: 'grid', gridTemplateColumns: '40px 24px 1fr 16px 1fr', gap: '7px', alignItems: 'center', background: '#fff', border: '1px solid #e7e1d3', borderRadius: '10px', padding: '7px 9px', opacity: slot.active ? 1 : 0.65 }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: slot.active ? '#0b332c' : '#94a3b8' }}>{day}</span>
              <input type="checkbox" checked={slot.active} onChange={(e) => updateDay(day, { active: e.target.checked })} />
              <input type="time" value={slot.start} onChange={(e) => updateDay(day, { start: e.target.value })} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '5px', fontSize: '11px', boxSizing: 'border-box' }} />
              <span style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center' }}>to</span>
              <input type="time" value={slot.end} onChange={(e) => updateDay(day, { end: e.target.value })} style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '5px', fontSize: '11px', boxSizing: 'border-box' }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}