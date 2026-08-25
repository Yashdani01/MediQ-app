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
  { value: 'available', label: 'Available', color: '#0f9f8f', soft: '#e8f8f5' },
  { value: 'delayed', label: 'Delayed', color: '#d97706', soft: '#fff7e6' },
  { value: 'on_break', label: 'On Break', color: '#64748b', soft: '#f1f5f9' },
  { value: 'not_started', label: 'Not Started', color: '#dc2626', soft: '#fef2f2' },
  { value: 'on_leave', label: 'On Leave', color: '#dc2626', soft: '#fef2f2' },
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

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid #dce6e4',
  background: '#ffffff',
  color: '#18332f',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

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

    const { error: saveError } = await updateHospitalUpi(
      unlockedPin,
      upiInput.trim()
    );

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

    const { error: saveError } = await updateHospitalLocation(
      unlockedPin,
      locationInput.trim()
    );

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

    const activeDays = Object.keys(daySchedules).filter(
      (day) => daySchedules[day].active
    );

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
    setEditSpecialties(
      doc.specialties || [doc.specialty || 'General Physician']
    );
    setEditFee(
      doc.consultation_fee != null
        ? String(doc.consultation_fee)
        : ''
    );

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
    const activeDays = Object.keys(editDaySchedules).filter(
      (day) => editDaySchedules[day]?.active
    );

    const firstActiveDay = activeDays[0] || 'Mon';

    const startTime =
      editDaySchedules[firstActiveDay]?.start || '10:00';

    const endTime =
      editDaySchedules[firstActiveDay]?.end || '14:00';

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

    await supabase
      .from('doctors')
      .update({
        degrees: editDegrees,
        ptr_score: parseFloat(editPtr) || 99.0,
        specialties: editSpecialties,
        custom_schedule: editDaySchedules,
      })
      .eq('id', doctorId);

    setEditingId(null);

    await loadDoctors(unlockedPin);
  };

  const handleDelete = async (doctorId, name) => {
    if (!window.confirm(`Remove Dr. ${name} from your clinic?`)) return;

    await deleteDoctor(unlockedPin, doctorId);
    await loadDoctors(unlockedPin);
  };

  const handleStatusChange = async (doctorId, status) => {
    await updateDoctorStatus(
      unlockedPin,
      doctorId,
      status,
      status === 'delayed' ? 10 : 0
    );

    await loadDoctors(unlockedPin);
  };

  const refreshBookings = async (doctorId) => {
    const data = await getTodaysBookings(unlockedPin, doctorId);

    setBookingsByDoctor((prev) => ({
      ...prev,
      [doctorId]: data || [],
    }));
  };

  const handleWalkinSubmit = async (doctorId) => {
    if (!walkinName.trim()) return;

    await addWalkinBooking(
      unlockedPin,
      doctorId,
      walkinName.trim(),
      walkinPhone.trim()
    );

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
      <div
        style={{
          minHeight: '100vh',
          background:
            'radial-gradient(circle at top left, #dff7f2 0%, transparent 32%), radial-gradient(circle at bottom right, #eef5f2 0%, transparent 38%), #f7faf9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'Inter, sans-serif',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '410px',
            background: 'rgba(255,255,255,0.94)',
            border: '1px solid rgba(214,228,224,0.9)',
            borderRadius: '28px',
            padding: '34px 28px',
            boxShadow: '0 24px 70px rgba(24, 66, 59, 0.12)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '22px',
              background:
                'linear-gradient(135deg, #0f9f8f, #23b9a5)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '30px',
              boxShadow: '0 10px 24px rgba(15,159,143,0.24)',
            }}
          >
            ✚
          </div>

          <div
            style={{
              fontSize: '10px',
              letterSpacing: '1.8px',
              fontWeight: '800',
              color: '#0f9f8f',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            MediQ Staff Access
          </div>

          <h1
            style={{
              fontFamily: 'Fraunces, serif',
              fontSize: '27px',
              color: '#18332f',
              margin: '0 0 8px',
              letterSpacing: '-0.5px',
            }}
          >
            {clinicName}
          </h1>

          <p
            style={{
              fontSize: '13px',
              lineHeight: 1.6,
              color: '#71807c',
              margin: '0 0 28px',
            }}
          >
            Secure Staff Access Portal. Enter 4-digit PIN.
          </p>

          <form
            onSubmit={handleUnlock}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <input
              type="password"
              inputMode="numeric"
              placeholder="••••"
              maxLength={6}
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, ''))
              }
              required
              style={{
                ...inputStyle,
                textAlign: 'center',
                fontSize: '25px',
                fontWeight: '800',
                letterSpacing: '8px',
                padding: '16px',
                background: '#fbfdfc',
              }}
            />

            <button
              type="submit"
              disabled={loading || !pin}
              style={{
                width: '100%',
                background:
                  'linear-gradient(135deg, #0f9f8f, #149f8e)',
                color: '#fff',
                border: 'none',
                padding: '15px',
                borderRadius: '14px',
                fontSize: '14px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(15,159,143,0.2)',
                opacity: loading || !pin ? 0.6 : 1,
              }}
            >
              {loading ? 'Verifying...' : 'Access Portal →'}
            </button>
          </form>

          {error && (
            <p
              style={{
                color: '#dc2626',
                fontSize: '12px',
                marginTop: '16px',
                background: '#fff5f5',
                border: '1px solid #fee2e2',
                padding: '10px 12px',
                borderRadius: '12px',
                fontWeight: '600',
              }}
            >
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  const allBookings = Object.values(bookingsByDoctor).flat();

  const totalBookings = allBookings.length;

  const waitingBookings = allBookings.filter(
    (b) => b.status === 'waiting' || b.status === 'checked_in'
  ).length;

  const completedBookings = allBookings.filter(
    (b) => b.status === 'completed' || b.status === 'seen'
  ).length;

  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, #eaf8f5 0%, transparent 32%), #f7faf9',
        color: '#18332f',
        fontFamily: 'Inter, sans-serif',
        paddingBottom: '70px',
      }}
    >
      <div
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: '24px 16px',
          boxSizing: 'border-box',
        }}
      >
        {/* TOP HEADER */}

        <div
          style={{
            background: 'rgba(255,255,255,0.94)',
            borderRadius: '24px',
            padding: '22px',
            marginBottom: '16px',
            border: '1px solid #e0ebe8',
            boxShadow: '0 10px 35px rgba(30,70,62,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: '800',
                color: '#0f9f8f',
                textTransform: 'uppercase',
                letterSpacing: '1.4px',
                marginBottom: '5px',
              }}
            >
              Clinic Staff Portal
            </div>

            <h1
              style={{
                fontFamily: 'Fraunces, serif',
                fontSize: '25px',
                color: '#18332f',
                margin: '0 0 5px',
                letterSpacing: '-0.4px',
              }}
            >
              {clinicName}
            </h1>

            <p
              style={{
                fontSize: '11.5px',
                color: '#7b8985',
                margin: 0,
              }}
            >
              📅 {todayDateStr}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            <button
              onClick={() => loadDoctors(unlockedPin)}
              disabled={refreshing}
              style={{
                background: '#f4f8f7',
                border: '1px solid #e0e9e7',
                width: '40px',
                height: '40px',
                borderRadius: '13px',
                cursor: 'pointer',
                fontSize: '17px',
                color: '#45615a',
              }}
            >
              ↻
            </button>

            <button
              onClick={() =>
                setShowSettingsDrawer(!showSettingsDrawer)
              }
              style={{
                background: '#edf9f6',
                border: '1px solid #cceee7',
                padding: '9px 13px',
                borderRadius: '13px',
                fontSize: '12px',
                fontWeight: '750',
                color: '#137b70',
                cursor: 'pointer',
              }}
            >
              ⚙ Settings
            </button>

            <button
              onClick={handleLogout}
              style={{
                background: '#fff6f6',
                border: '1px solid #fee2e2',
                padding: '9px 13px',
                borderRadius: '13px',
                fontSize: '12px',
                fontWeight: '750',
                color: '#dc2626',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* STATS */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            marginBottom: '20px',
          }}
        >
          {[
            {
              label: 'Total Tokens',
              value: totalBookings,
              bg: '#ffffff',
              color: '#18332f',
            },
            {
              label: 'Waiting Queue',
              value: waitingBookings,
              bg: '#fffaf0',
              color: '#d97706',
            },
            {
              label: 'Completed',
              value: completedBookings,
              bg: '#f0fbf7',
              color: '#138a64',
            },
          ].map((st, idx) => (
            <div
              key={idx}
              style={{
                background: st.bg,
                border: '1px solid #e1ebe8',
                borderRadius: '18px',
                padding: '16px 10px',
                textAlign: 'center',
                boxShadow: '0 5px 18px rgba(30,70,62,0.035)',
              }}
            >
              <div
                style={{
                  fontSize: '9.5px',
                  fontWeight: '800',
                  color: '#81908b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  marginBottom: '6px',
                }}
              >
                {st.label}
              </div>

              <div
                style={{
                  fontSize: '28px',
                  fontWeight: '900',
                  color: st.color,
                  fontFamily: 'Fraunces, serif',
                }}
              >
                {st.value}
              </div>
            </div>
          ))}
        </div>

        {/* SETTINGS DRAWER */}

        {showSettingsDrawer && (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e0ebe8',
              borderRadius: '22px',
              padding: '22px',
              marginBottom: '18px',
              boxShadow: '0 10px 30px rgba(30,70,62,0.06)',
            }}
          >
            <div
              style={{
                marginBottom: '18px',
                paddingBottom: '14px',
                borderBottom: '1px solid #edf2f0',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: '800',
                  letterSpacing: '1px',
                  color: '#0f9f8f',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                Clinic Management
              </div>

              <h3
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontSize: '20px',
                  color: '#18332f',
                  margin: 0,
                }}
              >
                Clinic Settings & UPI QR
              </h3>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label
                style={{
                  fontSize: '12px',
                  fontWeight: '750',
                  color: '#405650',
                  display: 'block',
                  marginBottom: '7px',
                }}
              >
                Google Maps Location Link:
              </label>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  placeholder="Paste Google Maps URL"
                  value={locationInput}
                  onChange={(e) =>
                    setLocationInput(e.target.value)
                  }
                  style={{ ...inputStyle, flex: 1 }}
                />

                <button
                  onClick={handleSaveLocation}
                  disabled={savingLocation}
                  style={{
                    background: '#18332f',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 17px',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {savingLocation ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            <div>
              <label
                style={{
                  fontSize: '12px',
                  fontWeight: '750',
                  color: '#405650',
                  display: 'block',
                  marginBottom: '7px',
                }}
              >
                Clinic UPI ID (for Online Payments):
              </label>

              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '10px',
                }}
              >
                <input
                  placeholder="e.g. clinic@paytm"
                  value={upiInput}
                  onChange={(e) =>
                    setUpiInput(e.target.value)
                  }
                  style={{ ...inputStyle, flex: 1 }}
                />

                <button
                  onClick={handleSaveUpi}
                  disabled={savingUpi}
                  style={{
                    background: '#18332f',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 17px',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {savingUpi ? 'Saving...' : 'Save'}
                </button>
              </div>

              {upiId && (
                <button
                  onClick={() => setShowQrModal(true)}
                  style={{
                    background: '#fffaf0',
                    border: '1px solid #fde6a9',
                    color: '#a16207',
                    padding: '9px 14px',
                    borderRadius: '11px',
                    fontSize: '12px',
                    fontWeight: '750',
                    cursor: 'pointer',
                  }}
                >
                  📱 View Payment QR Code
                </button>
              )}
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              background: '#fff6f6',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '13px',
              borderRadius: '14px',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        {/* ROSTER HEADER */}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '13px',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                color: '#84928e',
                fontWeight: '800',
                letterSpacing: '1px',
                marginBottom: '3px',
              }}
            >
              Your Team
            </div>

            <h2
              style={{
                fontFamily: 'Fraunces, serif',
                fontSize: '22px',
                color: '#18332f',
                margin: 0,
              }}
            >
              Doctor Roster ({doctors.length})
            </h2>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              background:
                'linear-gradient(135deg, #0f9f8f, #1bb5a2)',
              color: '#fff',
              border: 'none',
              padding: '11px 17px',
              borderRadius: '13px',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(15,159,143,0.18)',
            }}
          >
            {showAddForm ? 'Close Form' : '+ Add Doctor'}
          </button>
        </div>

        {/* ADD DOCTOR FORM */}

        {showAddForm && (
          <form
            onSubmit={handleAddDoctor}
            style={{
              background: '#fff',
              border: '1px solid #e0ebe8',
              borderRadius: '24px',
              padding: '22px',
              marginBottom: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 10px 32px rgba(30,70,62,0.05)',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '10px',
                  color: '#0f9f8f',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '4px',
                }}
              >
                New Profile
              </div>

              <h3
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontSize: '21px',
                  color: '#18332f',
                  margin: 0,
                }}
              >
                Add New Doctor
              </h3>
            </div>

            <Field label="Doctor Name *">
              <input
                placeholder="Dr. Gautam Banerjee"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={inputStyle}
                required
              />
            </Field>

            <Field label="Degrees & Qualifications *">
              <input
                placeholder="MBBS, MD (General)"
                value={newDegrees}
                onChange={(e) => setNewDegrees(e.target.value)}
                style={inputStyle}
                required
              />
            </Field>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}
            >
              <Field label="Consultation Fee (₹)">
                <input
                  type="number"
                  placeholder="500"
                  value={newFee}
                  onChange={(e) => setNewFee(e.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="Avg Time / Patient (Mins) *">
                <input
                  type="number"
                  min="1"
                  value={newAvgMinutes}
                  onChange={(e) =>
                    setNewAvgMinutes(e.target.value)
                  }
                  style={{
                    ...inputStyle,
                    border: '1px solid #a7e3d9',
                    background: '#f4fcfa',
                    fontWeight: '700',
                  }}
                  required
                />
              </Field>
            </div>

            <SpecialtySelector
              selected={newSpecialties}
              onToggle={(spec) =>
                toggleSpecialty(
                  spec,
                  newSpecialties,
                  setNewSpecialties
                )
              }
            />

            <div
              style={{
                background: '#f8fbfa',
                padding: '15px',
                borderRadius: '17px',
                border: '1px solid #e2ece9',
              }}
            >
              <label
                style={{
                  fontSize: '12px',
                  fontWeight: '800',
                  color: '#18332f',
                  display: 'block',
                  marginBottom: '5px',
                }}
              >
                📅 Doctor Clinic Visit Days & Timings *
              </label>

              <p
                style={{
                  fontSize: '11px',
                  color: '#7b8985',
                  margin: '0 0 12px',
                  lineHeight: 1.5,
                }}
              >
                Check the days this doctor visits your clinic and set their shift hours.
              </p>

              <ScheduleEditor
                value={daySchedules}
                onChange={setDaySchedules}
              />
            </div>

            <button
              type="submit"
              disabled={savingDoctor}
              style={{
                width: '100%',
                background: '#18332f',
                color: '#fff',
                border: 'none',
                padding: '15px',
                borderRadius: '14px',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(24,51,47,0.14)',
              }}
            >
              {savingDoctor ? 'Saving...' : 'Save Doctor Profile'}
            </button>
          </form>
        )}

        {/* DOCTOR LIST */}

        {doctors.length === 0 ? (
          <div
            style={{
              background: '#fff',
              border: '1px solid #e0ebe8',
              borderRadius: '24px',
              padding: '48px 22px',
              textAlign: 'center',
              boxShadow: '0 8px 25px rgba(30,70,62,0.04)',
            }}
          >
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '22px',
                background: '#edf9f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '30px',
                margin: '0 auto 14px',
              }}
            >
              👨‍⚕️
            </div>

            <h3
              style={{
                fontFamily: 'Fraunces, serif',
                fontSize: '21px',
                color: '#18332f',
                margin: '0 0 6px',
              }}
            >
              No Doctors Added
            </h3>

            <p
              style={{
                fontSize: '13px',
                color: '#7b8985',
                margin: 0,
              }}
            >
              Click "+ Add Doctor" above to set up your clinic roster.
            </p>
          </div>
        ) : (
          doctors.map((doc) => {
            const isEditing = editingId === doc.id;
            const docBookings = bookingsByDoctor[doc.id] || [];

            const waitingCount = docBookings.filter(
              (b) =>
                b.status === 'waiting' ||
                b.status === 'checked_in'
            ).length;

            const specs =
              doc.specialties ||
              [doc.specialty || 'General Physician'];

            const statusInfo =
              STATUS_OPTIONS.find(
                (s) => s.value === doc.status
              ) || STATUS_OPTIONS[0];

            return (
              <div
                key={doc.id}
                style={{
                  background: '#fff',
                  border: '1px solid #e0ebe8',
                  borderRadius: '24px',
                  padding: '20px',
                  marginBottom: '16px',
                  boxShadow: '0 8px 28px rgba(30,70,62,0.045)',
                }}
              >
                {isEditing ? (
                  <div
                    style={{
                      background: '#fbfefd',
                      border: '1px solid #bfe9e1',
                      borderRadius: '18px',
                      padding: '18px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '14px',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: '10px',
                            color: '#0f9f8f',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: '4px',
                          }}
                        >
                          Doctor Profile
                        </div>

                        <h3
                          style={{
                            fontFamily: 'Fraunces, serif',
                            fontSize: '20px',
                            color: '#18332f',
                            margin: 0,
                          }}
                        >
                          Edit Doctor Profile
                        </h3>
                      </div>

                      <span
                        style={{
                          fontSize: '10px',
                          background: '#e8f8f5',
                          color: '#0f887b',
                          padding: '5px 9px',
                          borderRadius: '20px',
                          fontWeight: '800',
                        }}
                      >
                        Active Editing
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '11px',
                        marginBottom: '12px',
                      }}
                    >
                      <div>
                        <label style={labelStyle}>
                          Doctor Name
                        </label>

                        <input
                          value={editName}
                          onChange={(e) =>
                            setEditName(e.target.value)
                          }
                          style={inputStyle}
                          placeholder="Doctor Name"
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>
                          Degrees & Qualifications
                        </label>

                        <input
                          value={editDegrees}
                          onChange={(e) =>
                            setEditDegrees(e.target.value)
                          }
                          style={inputStyle}
                          placeholder="Degrees"
                        />
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '10px',
                        }}
                      >
                        <div>
                          <label style={labelStyle}>
                            Consultation Fee (₹)
                          </label>

                          <input
                            type="number"
                            value={editFee}
                            onChange={(e) =>
                              setEditFee(e.target.value)
                            }
                            style={inputStyle}
                            placeholder="Fee ₹"
                          />
                        </div>

                        <div>
                          <label style={labelStyle}>
                            Avg Time / Patient (Mins)
                          </label>

                          <input
                            type="number"
                            min="1"
                            value={
                              doc.avg_minutes_per_patient || 10
                            }
                            onChange={(e) => {
                              // Optional state handler if you want to update avg minutes on edit
                            }}
                            style={inputStyle}
                            placeholder="10"
                          />
                        </div>
                      </div>

                      <div>
                        <label style={labelStyle}>
                          Specialties
                        </label>

                        <SpecialtySelector
                          selected={editSpecialties}
                          onToggle={(spec) =>
                            toggleSpecialty(
                              spec,
                              editSpecialties,
                              setEditSpecialties
                            )
                          }
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>
                          Clinic Visit Days & Timings
                        </label>

                        <ScheduleEditor
                          value={editDaySchedules}
                          onChange={setEditDaySchedules}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        marginTop: '16px',
                      }}
                    >
                      <button
                        onClick={() => setEditingId(null)}
                        style={{
                          flex: 1,
                          background: '#f5f8f7',
                          border: '1px solid #dce6e4',
                          padding: '12px',
                          borderRadius: '12px',
                          fontWeight: '750',
                          fontSize: '13px',
                          cursor: 'pointer',
                          color: '#52635f',
                        }}
                      >
                        Cancel
                      </button>

                      <button
                        onClick={() =>
                          handleSaveEdit(doc.id)
                        }
                        style={{
                          flex: 1,
                          background: '#0f9f8f',
                          color: '#fff',
                          border: 'none',
                          padding: '12px',
                          borderRadius: '12px',
                          fontWeight: '800',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '16px',
                        gap: '12px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          gap: '13px',
                          alignItems: 'center',
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            minWidth: '52px',
                            height: '52px',
                            borderRadius: '17px',
                            background:
                              'linear-gradient(135deg, #18332f, #2b5a52)',
                            color: '#d9fff7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontWeight: '800',
                            boxShadow:
                              '0 8px 18px rgba(24,51,47,0.13)',
                          }}
                        >
                          {getInitials(doc.name)}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <h3
                            style={{
                              fontFamily: 'Fraunces, serif',
                              fontSize: '19px',
                              color: '#18332f',
                              margin: '0 0 3px',
                            }}
                          >
                            {doc.name}
                          </h3>

                          <p
                            style={{
                              fontSize: '12px',
                              color: '#0f9f8f',
                              fontWeight: '750',
                              margin: '0 0 3px',
                            }}
                          >
                            {doc.degrees || 'MBBS'}
                          </p>

                          <p
                            style={{
                              fontSize: '11px',
                              color: '#7b8985',
                              margin: '0 0 6px',
                              lineHeight: 1.4,
                            }}
                          >
                            {specs.join(', ')}
                          </p>

                          <div
                            style={{
                              marginTop: '5px',
                              fontSize: '10.5px',
                              color: '#48605a',
                              background: '#f7faf9',
                              padding: '7px 10px',
                              borderRadius: '10px',
                              display: 'inline-block',
                              border: '1px solid #e2ece9',
                              fontWeight: '650',
                              lineHeight: 1.5,
                            }}
                          >
                            🕒{' '}
                            {doc.custom_schedule
                              ? Object.keys(
                                  doc.custom_schedule
                                )
                                  .filter(
                                    (d) =>
                                      doc.custom_schedule[d]
                                        ?.active
                                  )
                                  .map(
                                    (d) =>
                                      `${d} · ${formatTime(
                                        doc.custom_schedule[d]
                                          .start
                                      )} – ${formatTime(
                                        doc.custom_schedule[d]
                                          .end
                                      )}`
                                  )
                                  .join(' | ') ||
                                'No active days selected'
                              : doc.working_days?.join(', ') ||
                                'Schedule not set'}
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          flexShrink: 0,
                          fontSize: '10px',
                          fontWeight: '800',
                          padding: '6px 10px',
                          borderRadius: '20px',
                          background: statusInfo.soft,
                          color: statusInfo.color,
                          border: `1px solid ${statusInfo.color}22`,
                        }}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* STATUS SELECTOR */}

                    <div
                      style={{
                        background: '#f8fbfa',
                        padding: '14px',
                        borderRadius: '16px',
                        marginBottom: '14px',
                        border: '1px solid #e3ecea',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: '800',
                          color: '#84928e',
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px',
                          display: 'block',
                          marginBottom: '8px',
                        }}
                      >
                        Change Queue Status
                      </span>

                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px',
                        }}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() =>
                              handleStatusChange(
                                doc.id,
                                opt.value
                              )
                            }
                            style={{
                              padding: '7px 10px',
                              borderRadius: '9px',
                              fontSize: '10.5px',
                              fontWeight: '750',
                              cursor: 'pointer',
                              border:
                                doc.status === opt.value
                                  ? `1.5px solid ${opt.color}`
                                  : '1px solid #dce6e4',
                              background:
                                doc.status === opt.value
                                  ? opt.soft
                                  : '#fff',
                              color:
                                doc.status === opt.value
                                  ? opt.color
                                  : '#71807c',
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ACTIONS */}

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          '1fr 1fr 1fr',
                        gap: '8px',
                        marginBottom: '14px',
                      }}
                    >
                      <button
                        onClick={() =>
                          toggleTodaysPatients(doc.id)
                        }
                        style={{
                          background: '#18332f',
                          color: '#fff',
                          border: 'none',
                          padding: '11px 8px',
                          borderRadius: '12px',
                          fontSize: '11.5px',
                          fontWeight: '750',
                          cursor: 'pointer',
                        }}
                      >
                        {expandedDoctor === doc.id
                          ? 'Hide Queue'
                          : `Queue (${waitingCount})`}
                      </button>

                      <button
                        onClick={() =>
                          setShowWalkinForm(
                            showWalkinForm === doc.id
                              ? null
                              : doc.id
                          )
                        }
                        style={{
                          background: '#fff8e8',
                          color: '#b96d05',
                          border: '1px solid #fde5ad',
                          padding: '11px 8px',
                          borderRadius: '12px',
                          fontSize: '11.5px',
                          fontWeight: '750',
                          cursor: 'pointer',
                        }}
                      >
                        + Walk-in
                      </button>

                      <button
                        onClick={() => startEdit(doc)}
                        style={{
                          background: '#f5f8f7',
                          border: '1px solid #dfe8e6',
                          color: '#405650',
                          padding: '11px 8px',
                          borderRadius: '12px',
                          fontSize: '11.5px',
                          fontWeight: '750',
                          cursor: 'pointer',
                        }}
                      >
                        Edit / Remove
                      </button>
                    </div>

                    {/* WALK-IN */}

                    {showWalkinForm === doc.id && (
                      <div
                        style={{
                          background: '#fffaf0',
                          border: '1px solid #fde7b3',
                          borderRadius: '16px',
                          padding: '16px',
                          marginBottom: '14px',
                        }}
                      >
                        <h4
                          style={{
                            margin: '0 0 10px',
                            fontSize: '13px',
                            color: '#a16207',
                            fontWeight: '800',
                          }}
                        >
                          Add Offline Walk-in Patient
                        </h4>

                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          <input
                            placeholder="Patient Name *"
                            value={walkinName}
                            onChange={(e) =>
                              setWalkinName(e.target.value)
                            }
                            style={inputStyle}
                          />

                          <input
                            placeholder="Phone Number (Optional)"
                            value={walkinPhone}
                            onChange={(e) =>
                              setWalkinPhone(e.target.value)
                            }
                            style={inputStyle}
                          />

                          <button
                            onClick={() =>
                              handleWalkinSubmit(doc.id)
                            }
                            style={{
                              background: '#d97706',
                              color: '#fff',
                              border: 'none',
                              padding: '11px',
                              borderRadius: '10px',
                              fontWeight: '800',
                              fontSize: '12.5px',
                              cursor: 'pointer',
                            }}
                          >
                            Generate Walk-in Token
                          </button>
                        </div>
                      </div>
                    )}

                    {/* QUEUE */}

                    {expandedDoctor === doc.id && (
                      <div
                        style={{
                          borderTop:
                            '1px solid #edf2f0',
                          paddingTop: '16px',
                          marginTop: '14px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent:
                              'space-between',
                            alignItems: 'center',
                            marginBottom: '11px',
                          }}
                        >
                          <h4
                            style={{
                              margin: 0,
                              fontSize: '13px',
                              color: '#18332f',
                              fontWeight: '800',
                            }}
                          >
                            Today's Patient Queue (
                            {docBookings.length})
                          </h4>

                          <button
                            onClick={() =>
                              refreshBookings(doc.id)
                            }
                            style={{
                              background: '#edf9f6',
                              border: 'none',
                              color: '#0f887b',
                              fontSize: '11px',
                              fontWeight: '750',
                              cursor: 'pointer',
                              padding: '7px 9px',
                              borderRadius: '9px',
                            }}
                          >
                            Refresh List
                          </button>
                        </div>

                        {loadingBookings ? (
                          <p
                            style={{
                              textAlign: 'center',
                              fontSize: '12px',
                              color: '#7b8985',
                            }}
                          >
                            Loading queue...
                          </p>
                        ) : docBookings.length === 0 ? (
                          <p
                            style={{
                              textAlign: 'center',
                              fontSize: '12px',
                              color: '#7b8985',
                              padding: '15px',
                              background: '#f8fbfa',
                              borderRadius: '12px',
                              border:
                                '1px dashed #d9e5e2',
                            }}
                          >
                            No patients booked for this doctor today.
                          </p>
                        ) : (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                            }}
                          >
                            {docBookings.map((b) => {
                              const isWaiting =
                                b.status?.toLowerCase() ===
                                  'waiting' ||
                                b.status?.toLowerCase() ===
                                  'checked_in';

                              const isUpdating =
                                updatingPatient === b.id;

                              return (
                                <div
                                  key={b.id}
                                  style={{
                                    background: '#fbfdfc',
                                    border:
                                      '1px solid #e1ebe8',
                                    borderRadius: '15px',
                                    padding: '12px',
                                    display: 'flex',
                                    justifyContent:
                                      'space-between',
                                    alignItems: 'center',
                                    gap: '10px',
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '10px',
                                      minWidth: 0,
                                    }}
                                  >
                                    <div
                                      style={{
                                        minWidth: '36px',
                                        height: '36px',
                                        borderRadius: '11px',
                                        background:
                                          'linear-gradient(135deg, #0f9f8f, #22b8a5)',
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent:
                                          'center',
                                        fontSize: '11px',
                                        fontWeight: '800',
                                      }}
                                    >
                                      #
                                      {b.queue_number ||
                                        b.token_number ||
                                        '1'}
                                    </div>

                                    <div>
                                      <div
                                        style={{
                                          fontSize: '13px',
                                          fontWeight: '750',
                                          color: '#18332f',
                                        }}
                                      >
                                        {b.patient_name ||
                                          'Patient'}
                                      </div>

                                      <div
                                        style={{
                                          fontSize: '10.5px',
                                          color: '#7b8985',
                                          marginTop: '2px',
                                        }}
                                      >
                                        {b.is_walkin
                                          ? '🚶 Walk-in'
                                          : '📱 App Booking'}{' '}
                                        •{' '}
                                        <span
                                          style={{
                                            textTransform:
                                              'capitalize',
                                            fontWeight: '700',
                                            color: isWaiting
                                              ? '#d97706'
                                              : '#138a64',
                                          }}
                                        >
                                          {b.status}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div
                                    style={{
                                      display: 'flex',
                                      gap: '6px',
                                      flexShrink: 0,
                                    }}
                                  >
                                    {isWaiting ? (
                                      <>
                                        <button
                                          onClick={() =>
                                            handleMarkSeen(
                                              b.id,
                                              doc.id
                                            )
                                          }
                                          disabled={
                                            isUpdating
                                          }
                                          style={{
                                            background:
                                              '#0f9f8f',
                                            color: '#fff',
                                            border: 'none',
                                            padding:
                                              '7px 10px',
                                            borderRadius:
                                              '9px',
                                            fontSize: '10.5px',
                                            fontWeight:
                                              '750',
                                            cursor: 'pointer',
                                          }}
                                        >
                                          Mark Seen
                                        </button>

                                        <button
                                          onClick={() =>
                                            handleNoShowCancel(
                                              b.id,
                                              doc.id
                                            )
                                          }
                                          disabled={
                                            isUpdating
                                          }
                                          style={{
                                            background:
                                              '#fff1f1',
                                            color: '#dc2626',
                                            border:
                                              '1px solid #fee2e2',
                                            padding:
                                              '7px 10px',
                                            borderRadius:
                                              '9px',
                                            fontSize: '10.5px',
                                            fontWeight:
                                              '750',
                                            cursor: 'pointer',
                                          }}
                                        >
                                          Cancel
                                        </button>
                                      </>
                                    ) : (
                                      <span
                                        style={{
                                          fontSize: '11px',
                                          fontWeight: '800',
                                          color: '#138a64',
                                          background:
                                            '#ecfdf5',
                                          padding: '7px 9px',
                                          borderRadius:
                                            '9px',
                                        }}
                                      >
                                        ✓ Done
                                      </span>
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
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background: 'rgba(20, 48, 43, 0.42)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '18px',
          }}
        >
          <div
            style={{
              background: '#fff',
              width: '100%',
              maxWidth: '350px',
              borderRadius: '28px',
              padding: '28px',
              textAlign: 'center',
              boxShadow:
                '0 28px 80px rgba(20,48,43,0.2)',
              border: '1px solid #e3ece9',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background: '#edf9f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '23px',
                margin: '0 auto 12px',
              }}
            >
              📱
            </div>

            <h3
              style={{
                fontFamily: 'Fraunces, serif',
                fontSize: '22px',
                color: '#18332f',
                margin: '0 0 16px',
              }}
            >
              Clinic Payment QR
            </h3>

            <div
              style={{
                background: '#f8fbfa',
                padding: '18px',
                borderRadius: '20px',
                display: 'inline-block',
                marginBottom: '14px',
                border: '1px solid #e2ece9',
              }}
            >
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
                    clinicName
                  )}&cu=INR`
                )}`}
                alt="UPI QR Code"
                style={{
                  width: '180px',
                  height: '180px',
                  display: 'block',
                  borderRadius: '8px',
                }}
              />
            </div>

            <p
              style={{
                fontSize: '12px',
                color: '#71807c',
                margin: '0 0 18px',
              }}
            >
              UPI ID: <strong>{upiId}</strong>
            </p>

            <button
              onClick={() => setShowQrModal(false)}
              style={{
                width: '100%',
                background: '#18332f',
                color: '#fff',
                border: 'none',
                padding: '13px',
                borderRadius: '13px',
                fontWeight: '800',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  fontSize: '11.5px',
  fontWeight: '750',
  color: '#62736e',
  display: 'block',
  marginBottom: '5px',
};

function Field({ label, children }) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          marginBottom: '6px',
          color: '#405650',
          fontSize: '12px',
          fontWeight: '750',
        }}
      >
        {label}
      </label>

      {children}
    </div>
  );
}

function SpecialtySelector({ selected, onToggle }) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          marginBottom: '8px',
          color: '#405650',
          fontSize: '12px',
          fontWeight: '750',
        }}
      >
        Specialties (Multiple Allowed):
      </label>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '7px',
        }}
      >
        {SPECIALTIES.map((spec) => {
          const active = selected.includes(spec);

          return (
            <button
              key={spec}
              type="button"
              onClick={() => onToggle(spec)}
              style={{
                padding: '7px 11px',
                borderRadius: '10px',
                fontSize: '10.5px',
                fontWeight: '750',
                cursor: 'pointer',
                border: active
                  ? '1.5px solid #0f9f8f'
                  : '1px solid #dce6e4',
                background: active
                  ? '#e8f8f5'
                  : '#ffffff',
                color: active
                  ? '#0f887b'
                  : '#71807c',
              }}
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
        ...(value[day] || {
          active: false,
          start: '10:00',
          end: '14:00',
        }),
        ...patch,
      },
    });
  };

  return (
    <div
      style={{
        background: '#f8fbfa',
        border: '1px solid #e1ebe8',
        padding: '14px',
        borderRadius: '16px',
      }}
    >
      <p
        style={{
          margin: '0 0 11px',
          color: '#18332f',
          fontSize: '12px',
          fontWeight: '800',
        }}
      >
        🕒 Day-wise Consultation Timings
      </p>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '7px',
        }}
      >
        {DAYS.map((day) => {
          const slot = value[day] || {
            active: false,
            start: '10:00',
            end: '14:00',
          };

          return (
            <div
              key={day}
              style={{
                display: 'grid',
                gridTemplateColumns:
                  '40px 24px 1fr 18px 1fr',
                gap: '6px',
                alignItems: 'center',
                background: '#ffffff',
                border: slot.active
                  ? '1px solid #d4ece7'
                  : '1px solid #e5ecea',
                borderRadius: '11px',
                padding: '7px 8px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: slot.active
                    ? '#18332f'
                    : '#9aa7a3',
                }}
              >
                {day}
              </span>

              <input
                type="checkbox"
                checked={slot.active}
                onChange={(e) =>
                  updateDay(day, {
                    active: e.target.checked,
                  })
                }
              />

              <input
                type="time"
                value={slot.start}
                onChange={(e) =>
                  updateDay(day, {
                    start: e.target.value,
                  })
                }
                style={{
                  width: '100%',
                  border: '1px solid #dce6e4',
                  borderRadius: '7px',
                  padding: '5px',
                  fontSize: '11px',
                  background: '#fbfdfc',
                  boxSizing: 'border-box',
                }}
              />

              <span
                style={{
                  fontSize: '10px',
                  color: '#9aa7a3',
                  textAlign: 'center',
                }}
              >
                to
              </span>

              <input
                type="time"
                value={slot.end}
                onChange={(e) =>
                  updateDay(day, {
                    end: e.target.value,
                  })
                }
                style={{
                  width: '100%',
                  border: '1px solid #dce6e4',
                  borderRadius: '7px',
                  padding: '5px',
                  fontSize: '11px',
                  background: '#fbfdfc',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
