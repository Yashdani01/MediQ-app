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
import './Login.css';

const STATUS_OPTIONS = [
  {
    value: 'available',
    label: 'Available',
    color: '#0f9f78',
    soft: '#e8f8f2',
  },
  {
    value: 'delayed',
    label: 'Delayed',
    color: '#c98917',
    soft: '#fff7df',
  },
  {
    value: 'on_break',
    label: 'On Break',
    color: '#64748b',
    soft: '#f1f5f9',
  },
  {
    value: 'not_started',
    label: 'Not Started',
    color: '#dc5a50',
    soft: '#fff0ef',
  },
  {
    value: 'on_leave',
    label: 'On Leave / Holiday',
    color: '#dc5a50',
    soft: '#fff0ef',
  },
  {
    value: 'completed',
    label: 'Done for Today',
    color: '#64748b',
    soft: '#f1f5f9',
  },
];

const SPECIALTIES = [
  'General Physician',
  'Gynecologist',
  'Orthopedic',
  'ENT Specialist',
  'Dermatologist',
  'Pediatrician',
  'Cardiologist',
  'Dentist',
  'Ophthalmologist',
  'Psychiatrist',
  'Neurologist',
  'Urologist',
  'Gastroenterologist',
  'General Surgeon',
  'Diabetologist',
  'Nephrologist',
  'Pulmonologist',
  'Homeopath',
  'Ayurvedic Physician',
  'Physiotherapist',
];

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const formatTime = (time) => {
  if (!time) return '--';

  const [hours, minutes] = time.split(':');

  const date = new Date();
  date.setHours(hours, minutes);

  return date.toLocaleTimeString(
    'en-IN',
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  );
};

const DEFAULT_SCHEDULE = {
  Mon: { active: true, start: '10:00', end: '14:00' },
  Tue: { active: true, start: '10:00', end: '14:00' },
  Wed: { active: true, start: '10:00', end: '14:00' },
  Thu: { active: true, start: '10:00', end: '14:00' },
  Fri: { active: true, start: '10:00', end: '14:00' },
  Sat: { active: true, start: '10:00', end: '13:00' },
  Sun: { active: false, start: '10:00', end: '13:00' },
};

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

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e8e4dc',
  borderRadius: 24,
  boxShadow: '0 10px 28px rgba(32,44,39,0.06)',
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 14px',
  borderRadius: 14,
  border: '1px solid #dedbd3',
  background: '#fff',
  color: '#173a34',
  fontSize: 14,
  outline: 'none',
};

const primaryBtn = {
  border: 'none',
  background: '#123c35',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
  borderRadius: 14,
};

const goldBtn = {
  border: 'none',
  background: '#c99d43',
  color: '#173a34',
  fontWeight: 800,
  cursor: 'pointer',
  borderRadius: 14,
};

const ghostBtn = {
  border: '1px solid #dfdbd2',
  background: '#fff',
  color: '#24433d',
  fontWeight: 700,
  cursor: 'pointer',
  borderRadius: 14,
};

const dangerBtn = {
  border: '1px solid #f1c9c5',
  background: '#fff5f4',
  color: '#c94f45',
  fontWeight: 800,
  cursor: 'pointer',
  borderRadius: 14,
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
  const [newSpecialties, setNewSpecialties] = useState([
    'General Physician',
  ]);
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
  const [editDaySchedules, setEditDaySchedules] =
    useState(DEFAULT_SCHEDULE);

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
          const bookings = await getTodaysBookings(
            currentPin,
            doc.id
          );

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

    const { error: saveError } =
      await updateHospitalUpi(
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

    const { error: saveError } =
      await updateHospitalLocation(
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

      const latestDocs =
        await getDoctorsForClinic(unlockedPin);

      const justAdded =
        latestDocs?.[latestDocs.length - 1];

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
      alert(
        `Error adding doctor: ${
          err.message || String(err)
        }`
      );
    } finally {
      setSavingDoctor(false);
    }
  };

  const startEdit = (doc) => {
    setEditingId(doc.id);

    setEditName(doc.name);

    setEditDegrees(
      doc.degrees || 'MBBS'
    );

    setEditPtr(
      String(doc.ptr_score || 99.0)
    );

    setEditSpecialties(
      doc.specialties || [
        doc.specialty || 'General Physician',
      ]
    );

    setEditFee(
      doc.consultation_fee != null
        ? String(doc.consultation_fee)
        : ''
    );

    setEditDaySchedules(
      doc.custom_schedule || DEFAULT_SCHEDULE
    );
  };

  const handleSaveEdit = async (doctorId) => {
    const activeDays =
      Object.keys(editDaySchedules).filter(
        (day) => editDaySchedules[day]?.active
      );

    await updateDoctor(
      unlockedPin,
      doctorId,
      editName,
      editSpecialties.join(', '),
      10,
      activeDays,
      '10:00',
      '14:00',
      '',
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

  const handleDelete = async (
    doctorId,
    name
  ) => {
    if (
      !window.confirm(
        `Remove Dr. ${name} from your clinic?`
      )
    ) {
      return;
    }

    await deleteDoctor(
      unlockedPin,
      doctorId
    );

    await loadDoctors(unlockedPin);
  };

  const handleStatusChange = async (
    doctorId,
    status
  ) => {
    await updateDoctorStatus(
      unlockedPin,
      doctorId,
      status,
      status === 'delayed' ? 10 : 0
    );

    await loadDoctors(unlockedPin);
  };

  const refreshBookings = async (doctorId) => {
    const data = await getTodaysBookings(
      unlockedPin,
      doctorId
    );

    setBookingsByDoctor((prev) => ({
      ...prev,
      [doctorId]: data || [],
    }));
  };

  const handleWalkinSubmit = async (
    doctorId
  ) => {
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

  const toggleTodaysPatients = async (
    doctorId
  ) => {
    if (expandedDoctor === doctorId) {
      setExpandedDoctor(null);
      return;
    }

    setExpandedDoctor(doctorId);

    setLoadingBookings(true);

    await refreshBookings(doctorId);

    setLoadingBookings(false);
  };

  const handleCheckIn = async (
    appointmentId,
    doctorId
  ) => {
    setUpdatingPatient(appointmentId);

    const { error: checkInError } =
      await checkInAppointment(
        unlockedPin,
        appointmentId
      );

    setUpdatingPatient(null);

    if (checkInError) {
      setError('Could not check in patient.');
      return;
    }

    await refreshBookings(doctorId);
  };

  const handleMarkSeen = async (
    appointmentId,
    doctorId
  ) => {
    setUpdatingPatient(appointmentId);

    const { error: seenError } =
      await markAppointmentSeen(
        unlockedPin,
        appointmentId
      );

    setUpdatingPatient(null);

    if (seenError) {
      console.error(
        'Mark seen error:',
        seenError
      );

      setError(
        'Could not update patient status.'
      );

      return;
    }

    await refreshBookings(doctorId);
    await loadDoctors(unlockedPin);
  };

  const handleNoShowCancel = async (
    appointmentId,
    doctorId
  ) => {
    if (
      !window.confirm(
        'Mark this patient as cancelled / did not show?'
      )
    ) {
      return;
    }

    setUpdatingPatient(appointmentId);

    const { error: cancelError } =
      await cancelAppointment(
        appointmentId
      );

    setUpdatingPatient(null);

    if (cancelError) {
      console.error(
        'Cancel appointment error:',
        cancelError
      );

      setError(
        'Could not cancel booking.'
      );

      return;
    }

    await refreshBookings(doctorId);
    await loadDoctors(unlockedPin);
  };

  /* LOGIN SCREEN */

  if (!unlocked) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background:
            'radial-gradient(circle at top right, rgba(201,157,67,0.15), transparent 32%), #f6f3ed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            ...cardStyle,
            width: '100%',
            maxWidth: 410,
            padding: '34px 28px 28px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: '#edf7f3',
              border: '1px solid #cfe8de',
              color: '#0f7b60',
              fontSize: 11,
              fontWeight: 800,
              padding: '6px 12px',
              borderRadius: 999,
              marginBottom: 22,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#0f9f78',
              }}
            />

            MEDIQ SECURE ACCESS
          </div>

          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 24,
              background: '#123c35',
              color: '#d7b45e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              fontSize: 28,
            }}
          >
            ✚
          </div>

          <h1
            style={{
              fontFamily:
                'Georgia, "Times New Roman", serif',
              fontSize: 28,
              color: '#173a34',
              margin: '0 0 8px',
            }}
          >
            {clinicName}
          </h1>

          <p
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              color: '#78817d',
              margin: '0 0 28px',
            }}
          >
            Clinic staff portal
            <br />
            Enter your secure access PIN to continue.
          </p>

          <form
            onSubmit={handleUnlock}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <input
              type="password"
              inputMode="numeric"
              placeholder="••••••"
              maxLength={6}
              value={pin}
              onChange={(e) =>
                setPin(
                  e.target.value.replace(/\D/g, '')
                )
              }
              required
              style={{
                ...inputStyle,
                textAlign: 'center',
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: 9,
                padding: '16px',
              }}
            />

            <button
              type="submit"
              disabled={loading || !pin}
              style={{
                ...primaryBtn,
                width: '100%',
                padding: '15px',
                fontSize: 14,
                opacity:
                  loading || !pin ? 0.55 : 1,
              }}
            >
              {loading
                ? 'Verifying access...'
                : 'Enter Clinic Portal →'}
            </button>
          </form>

          {error && (
            <p
              style={{
                color: '#b7473e',
                fontSize: 13,
                margin: '16px 0 0',
                background: '#fff1ef',
                border:
                  '1px solid #f1cbc7',
                padding: '10px 12px',
                borderRadius: 12,
              }}
            >
              {error}
            </p>
          )}
        </div>
      </div>
  );
  }

  const allBookings =
    Object.values(bookingsByDoctor).flat();

  const totalBookings =
    allBookings.length;

  const waitingBookings =
    allBookings.filter(
      (b) => b.status === 'waiting'
    ).length;

  const completedBookings =
    allBookings.filter(
      (b) =>
        b.status === 'completed' ||
        b.status === 'seen'
    ).length;

  const todayDateStr =
    new Date().toLocaleDateString(
      'en-US',
      {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }
    );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f6f3ed',
        color: '#173a34',
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 680,
          margin: '0 auto',
          padding: '18px 14px 48px',
          boxSizing: 'border-box',
        }}
      >
        {/* HEADER */}

        <div
          style={{
            background: '#fdfcf9',
            borderRadius: 24,
            padding: '18px',
            marginBottom: 14,
            border: '1px solid #ebe7de',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              gap: 12,
              alignItems: 'flex-start',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#0f7b60',
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: 1,
                  marginBottom: 7,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#0f9f78',
                  }}
                />

                MEDIQ CLINIC PORTAL
              </div>

              <h1
                style={{
                  margin: 0,
                  fontFamily:
                    'Georgia, "Times New Roman", serif',
                  color: '#173a34',
                  fontSize: 25,
                  lineHeight: 1.12,
                }}
              >
                {clinicName}
              </h1>

              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: 12,
                  color: '#8a918e',
                }}
              >
                {todayDateStr}
              </p>
            </div>

            <button
              onClick={() =>
                loadDoctors(unlockedPin)
              }
              disabled={refreshing}
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                border:
                  '1px solid #e4e0d7',
                background: '#fff',
                color: '#173a34',
                cursor: 'pointer',
                fontSize: 18,
                opacity:
                  refreshing ? 0.6 : 1,
              }}
            >
              ↻
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 18,
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() =>
                setShowSettingsDrawer(
                  !showSettingsDrawer
                )
              }
              style={{
                ...ghostBtn,
                padding: '10px 14px',
                fontSize: 12,
              }}
            >
              ⚙ Clinic Settings
            </button>

            <button
              onClick={handleLogout}
              style={{
                ...dangerBtn,
                padding: '10px 14px',
                fontSize: 12,
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* STATS */}

        <div style={{ marginBottom: 22 }}>
          <p
            style={{
              margin: '0 0 9px 4px',
              fontSize: 11,
              fontWeight: 900,
              color: '#8a918e',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}
          >
            Today at a glance
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(3, minmax(0, 1fr))',
              gap: 8,
            }}
          >
            {[
              {
                label: 'Total',
                value: totalBookings,
                color: '#173a34',
                bg: '#fff',
              },
              {
                label: 'Waiting',
                value: waitingBookings,
                color: '#b67c13',
                bg: '#fffaf0',
              },
              {
                label: 'Completed',
                value: completedBookings,
                color: '#0f8c6b',
                bg: '#f0faf6',
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: item.bg,
                  border:
                    '1px solid #e9e5dc',
                  borderRadius: 18,
                  padding: '14px 12px',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#8a918e',
                    textTransform: 'uppercase',
                  }}
                >
                  {item.label}
                </p>

                <p
                  style={{
                    margin: '5px 0 0',
                    fontSize: 24,
                    fontWeight: 900,
                    color: item.color,
                  }}
                >
                  {item.value}
                </p>
            </div>
          ))}
        </div>
      </div>

      {/* SETTINGS */}

      {showSettingsDrawer && (
        <div
          style={{
            ...cardStyle,
            padding: 16,
            marginBottom: 22,
            background: '#fffdf8',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  color: '#9a7a35',
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: 0.8,
                }}
              >
                CLINIC MANAGEMENT
              </p>

              <h3
                style={{
                  margin: '4px 0 0',
                  color: '#173a34',
                  fontSize: 17,
                }}
              >
                Settings & Payment
              </h3>
          </div>

          <button
            onClick={() =>
              setShowSettingsDrawer(false)
            }
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              border:
                '1px solid #e3ded4',
              background: '#fff',
              color: '#65716d',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gap: 12,
          }}
        >
          {/* LOCATION */}

          <div
            style={{
              padding: 14,
              borderRadius: 18,
              background: '#f8f7f2',
              border:
                '1px solid #ebe7de',
            }}
          >
            <p
              style={{
                margin: '0 0 4px',
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              📍 Clinic Location
            </p>

            <p
              style={{
                margin: '0 0 12px',
                fontSize: 12,
                color: '#7c8581',
              }}
            >
              Add the Google Maps link patients
              can use for navigation.
            </p>

            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={() => {
                  setLocationInput(locationStr);

                  setEditingLocation(
                    !editingLocation
                  );
                }}
                style={{
                  ...ghostBtn,
                  padding: '9px 12px',
                  fontSize: 12,
                }}
              >
                {locationStr
                  ? 'Edit Map Link'
                  : '+ Add Map Link'}
              </button>

              {locationStr && (
                <a
                  href={locationStr}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    ...primaryBtn,
                    padding: '9px 12px',
                    fontSize: 12,
                    textDecoration: 'none',
                  }}
                >
                  Test Route →
                </a>
              )}
            </div>

            {editingLocation && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  marginTop: 10,
                }}
              >
                <input
                  placeholder="Paste Google Maps share link"
                  value={locationInput}
                  onChange={(e) =>
                    setLocationInput(
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />

                <button
                  onClick={handleSaveLocation}
                  disabled={savingLocation}
                  style={{
                    ...primaryBtn,
                    padding: 11,
                  }}
                >
                  {savingLocation
                    ? 'Saving...'
                    : 'Save Location'}
                </button>
              </div>
            )}
          </div>

          {/* UPI */}

          <div
            style={{
              padding: 14,
              borderRadius: 18,
              background: '#f8f7f2',
              border:
                '1px solid #ebe7de',
            }}
          >
            <p
              style={{
                margin: '0 0 4px',
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              ₹ Clinic UPI Payment
            </p>

            <p
              style={{
                margin: '0 0 12px',
                fontSize: 12,
                color: '#7c8581',
              }}
            >
              Manage the UPI ID and show a
              payment QR code.
            </p>

            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={() => {
                  setUpiInput(upiId);

                  setEditingUpi(
                    !editingUpi
                  );
                }}
                style={{
                  ...ghostBtn,
                  padding: '9px 12px',
                  fontSize: 12,
                }}
              >
                {upiId
                  ? 'Edit UPI ID'
                  : '+ Add UPI ID'}
              </button>

              {upiId && (
                <button
                  onClick={() =>
                    setShowQrModal(true)
                  }
                  style={{
                    ...goldBtn,
                    padding: '9px 12px',
                    fontSize: 12,
                  }}
                >
                  Show Payment QR
                </button>
              )}
            </div>

            {editingUpi && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  marginTop: 10,
                }}
              >
                <input
                  placeholder="Clinic UPI ID"
                  value={upiInput}
                  onChange={(e) =>
                    setUpiInput(
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />

                <button
                  onClick={handleSaveUpi}
                  disabled={savingUpi}
                  style={{
                    ...primaryBtn,
                    padding: 11,
                  }}
                >
                  {savingUpi
                    ? 'Saving...'
                    : 'Save UPI ID'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: '11px 13px',
            borderRadius: 14,
            background: '#fff1ef',
            border:
              '1px solid #f0cbc6',
            color: '#b7473e',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* DOCTOR HEADER */}

      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'end',
          gap: 12,
          margin: '0 2px 12px',
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              color: '#9a7a35',
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: 0.8,
            }}
          >
            DOCTOR ROSTER
          </p>

          <h2
            style={{
              margin: '4px 0 0',
              fontFamily:
                'Georgia, "Times New Roman", serif',
              fontSize: 23,
              color: '#173a34',
            }}
          >
            Manage your doctors
          </h2>
        </div>

        <span
          style={{
            background: '#eaf5f0',
            color: '#0f7b60',
            borderRadius: 999,
            padding: '7px 10px',
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          {doctors.length} Doctor
          {doctors.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* EMPTY STATE */}

      {doctors.length === 0 && (
        <div
          style={{
            ...cardStyle,
            padding: '34px 20px',
            textAlign: 'center',
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 36,
              marginBottom: 8,
            }}
          >
            🩺
          </div>

          <h3
            style={{
              fontFamily:
                'Georgia, "Times New Roman", serif',
              margin: '0 0 6px',
            }}
          >
            No doctors added yet
          </h3>

          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: '#7c8581',
            }}
          >
            Add your first doctor profile to
            start managing appointments.
          </p>
        </div>
      )}

      {/* DOCTOR CARDS */}

      {doctors.map((doc) => {
        const isEditing =
          editingId === doc.id;

        const docBookings =
          bookingsByDoctor[doc.id] || [];

        const docWaitingCount =
          docBookings.filter(
            (b) =>
              b.status === 'waiting'
          ).length;

        const specs =
          doc.specialties || [
            doc.specialty ||
              'General Physician',
          ];

        const scheduleObj =
          doc.custom_schedule || {};

        const statusInfo =
          STATUS_OPTIONS.find(
            (s) =>
              s.value === doc.status
          ) || STATUS_OPTIONS[0];

        return (
          <div
            key={doc.id}
            style={{
              ...cardStyle,
              padding: 16,
              marginBottom: 14,
            }}
          >
            {isEditing ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        color: '#9a7a35',
                        fontSize: 10,
                        fontWeight: 900,
                      }}
                    >
                      EDIT PROFILE
                    </p>

                    <h3
                      style={{
                        margin: '4px 0 0',
                      }}
                    >
                      Doctor Details
                    </h3>
                  </div>

                  <button
                    onClick={() =>
                      setEditingId(null)
                    }
                    style={{
                      border: 'none',
                      background:
                        'transparent',
                      fontSize: 20,
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <input
                    value={editName}
                    onChange={(e) =>
                      setEditName(
                        e.target.value
                      )
                    }
                    style={inputStyle}
                    placeholder="Doctor Name"
                  />

                  <input
                    value={editDegrees}
                    onChange={(e) =>
                      setEditDegrees(
                        e.target.value
                      )
                    }
                    style={inputStyle}
                    placeholder="Degrees"
                  />

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        '1fr 1fr',
                      gap: 8,
                    }}
                  >
                    <input
                      type="number"
                      step="0.1"
                      value={editPtr}
                      onChange={(e) =>
                        setEditPtr(
                          e.target.value
                        )
                      }
                      style={inputStyle}
                      placeholder="PTR Score"
                    />

                    <input
                      type="number"
                      value={editFee}
                      onChange={(e) =>
                        setEditFee(
                          e.target.value
                        )
                      }
                      style={inputStyle}
                      placeholder="Fee ₹"
                    />
                  </div>

                  <SpecialtySelector
                    selected={
                      editSpecialties
                    }
                    onToggle={(spec) =>
                      toggleSpecialty(
                        spec,
                        editSpecialties,
                        setEditSpecialties
                      )
                    }
                  />

                  <ScheduleEditor
                    value={
                      editDaySchedules
                    }
                    onChange={
                      setEditDaySchedules
                    }
                  />

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        '1fr 1fr',
                      gap: 8,
                    }}
                  >
                    <button
                      onClick={() =>
                        handleSaveEdit(
                          doc.id
                        )
                      }
                      style={{
                        ...primaryBtn,
                        padding: 12,
                      }}
                    >
                      Save Changes
                    </button>

                    <button
                      onClick={() =>
                        setEditingId(null)
                      }
                      style={{
                        ...ghostBtn,
                        padding: 12,
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* DOCTOR INFO */}

                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    gap: 12,
                    alignItems:
                      'flex-start',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: 11,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        flex: '0 0 48px',
                        borderRadius: 17,
                        background:
                          '#123c35',
                        color: '#d7b45e',
                        display: 'flex',
                        alignItems:
                          'center',
                        justifyContent:
                          'center',
                        fontSize: 14,
                        fontWeight: 900,
                      }}
                    >
                      {getInitials(
                        doc.name
                      )}
                    </div>

                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 16,
                        }}
                      >
                        {doc.name}
                      </h3>

                      <p
                        style={{
                          margin:
                            '3px 0 0',
                          fontSize: 11,
                          color:
                            '#a0782b',
                          fontWeight: 800,
                        }}
                      >
                        {doc.degrees ||
                          'MBBS, General Practitioner'}
                      </p>

                      <p
                        style={{
                          margin:
                            '4px 0 0',
                          fontSize: 11,
                          color:
                            '#7c8581',
                        }}
                      >
                        {specs.join(' • ')}
                      </p>
                    </div>
                  </div>

                  <span
                    style={{
                      background:
                        statusInfo.soft,
                      color:
                        statusInfo.color,
                      borderRadius: 999,
                      padding: '6px 9px',
                      fontSize: 10,
                      fontWeight: 900,
                    }}
                  >
                    {statusInfo.label}
                  </span>
                </div>

                {/* INFO PILLS */}

                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                    marginTop: 14,
                  }}
                >
                  <span
                    style={{
                      background:
                        '#faf7ef',
                      color: '#9a7a35',
                      border:
                        '1px solid #eee2c8',
                      padding: '6px 9px',
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    ★ PTR{' '}
                    {doc.ptr_score ||
                      '99.0'}
                    %
                  </span>

                  {doc.consultation_fee !=
                    null && (
                    <span
                      style={{
                        background:
                          '#edf8f3',
                        color:
                          '#0f7b60',
                        border:
                          '1px solid #d5eadf',
                        padding:
                          '6px 9px',
                        borderRadius: 10,
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      ₹
                      {
                        doc.consultation_fee
                      }{' '}
                      Fee
                    </span>
                  )}

                  <span
                    style={{
                      background:
                        '#f4f5f3',
                      color: '#68746f',
                      padding: '6px 9px',
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    {docWaitingCount} Waiting
                  </span>
                </div>

                {/* STATUS */}

                <div
                  style={{
                    marginTop: 15,
                    padding: 12,
                    borderRadius: 17,
                    background:
                      '#faf9f6',
                    border:
                      '1px solid #ebe7de',
                  }}
                >
                  <p
                    style={{
                      margin: '0 0 8px',
                      color: '#8a918e',
                      fontSize: 10,
                      fontWeight: 900,
                      letterSpacing: 0.6,
                    }}
                  >
                    LIVE QUEUE STATUS
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6,
                    }}
                  >
                    {STATUS_OPTIONS.map(
                      (opt) => {
                        const active =
                          doc.status ===
                          opt.value;

                        return (
                          <button
                            key={
                              opt.value
                            }
                            onClick={() =>
                              handleStatusChange(
                                doc.id,
                                opt.value
                              )
                            }
                            style={{
                              padding:
                                '7px 9px',
                              borderRadius: 10,
                              fontSize: 10,
                              fontWeight: 800,
                              cursor:
                                'pointer',
                              border: active
                                ? `1px solid ${opt.color}`
                                : '1px solid #e5e1d9',
                              background:
                                active
                                  ? opt.soft
                                  : '#fff',
                              color: active
                                ? opt.color
                                : '#78817d',
                            }}
                        >
                          {
                            opt.label
                          }
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* ================================
    DOCTOR SCHEDULE
================================ */}

<div
  style={{
    marginTop: 12,
    padding: '12px',
    borderRadius: 14,
    background: '#f8f7f3',
    border: '1px solid #ebe7de',
  }}
>

  <div
    style={{
      fontSize: 10,
      fontWeight: 900,
      letterSpacing: 0.8,
      color: '#9a7a35',
      marginBottom: 8,
    }}
  >
    DOCTOR SCHEDULE
  </div>

  {DAYS.map((day) => {
    const schedule =
      scheduleObj[day];

    if (!schedule?.active) {
      return null;
    }

    return (
      <div
        key={day}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '5px 0',
          fontSize: 12,
        }}
      >

        <span
          style={{
            fontWeight: 700,
            color: '#173a34',
          }}
        >
          {day}
        </span>

        <span
          style={{
            color: '#64706b',
          }}
        >
          {formatTime(schedule.start)}
          {' – '}
          {formatTime(schedule.end)}
        </span>

      </div>
    );
  })}

  {Object.values(scheduleObj).every(
    (schedule) =>
      !schedule?.active
  ) && (

    <div
      style={{
        fontSize: 12,
        color: '#8a918e',
      }}
    >
      No active schedule
    </div>

  )}

</div>

                {/* ACTIONS */}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '1.65fr 1fr',
                    gap: 8,
                    marginTop: 14,
                  }}
                >
                  <button
                    onClick={() =>
                      toggleTodaysPatients(
                        doc.id
                      )
                    }
                    style={{
                      ...(expandedDoctor ===
                      doc.id
                        ? ghostBtn
                        : primaryBtn),
                      padding: 12,
                      fontSize: 12,
                    }}
                  >
                    {expandedDoctor ===
                    doc.id
                      ? 'Hide Queue'
                      : `Manage Queue (${docWaitingCount})`}
                  </button>

                  <button
                    onClick={() =>
                      setShowWalkinForm(
                        showWalkinForm ===
                          doc.id
                          ? null
                          : doc.id
                      )
                    }
                    style={{
                      ...goldBtn,
                      padding: 12,
                      fontSize: 12,
                    }}
                  >
                    + Walk-in
                  </button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '1fr 1fr',
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  <button
                    onClick={() =>
                      startEdit(doc)
                    }
                    style={{
                      ...ghostBtn,
                      padding: 10,
                      fontSize: 12,
                    }}
                  >
                    Edit Doctor
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(
                        doc.id,
                        doc.name
                      )
                    }
                    style={{
                      ...dangerBtn,
                      padding: 10,
                      fontSize: 12,
                    }}
                  >
                    Remove Doctor
                  </button>
                </div>

                {/* WALK-IN */}

                {showWalkinForm ===
                  doc.id && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 13,
                      borderRadius: 18,
                      background:
                        '#fffaf0',
                      border:
                        '1px solid #eee0bd',
                    }}
                  >
                    <p
                      style={{
                        margin:
                          '0 0 10px',
                        color:
                          '#85611d',
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      Add Walk-in Patient
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection:
                          'column',
                        gap: 8,
                      }}
                    >
                      <input
                        placeholder="Patient name"
                        value={walkinName}
                        onChange={(e) =>
                          setWalkinName(
                            e.target.value
                          )
                        }
                        style={
                          inputStyle
                        }
                      />

                      <input
                        placeholder="Phone (optional)"
                        value={walkinPhone}
                        onChange={(e) =>
                          setWalkinPhone(
                            e.target.value
                          )
                        }
                        style={
                          inputStyle
                        }
                      />

                      <button
                        onClick={() =>
                          handleWalkinSubmit(
                            doc.id
                          )
                        }
                        style={{
                          ...primaryBtn,
                          padding: 11,
                        }}
                      >
                        Create Token
                      </button>
                    </div>
                  </div>
                )}

                {/* QUEUE */}

                {expandedDoctor ===
                  doc.id && (
                  <div
                    style={{
                      marginTop: 15,
                      paddingTop: 14,
                      borderTop:
                        '1px solid #ebe7de',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        alignItems:
                          'center',
                        marginBottom: 10,
                      }}
                    >
                      <div>
                        <p
                          style={{
                            margin: 0,
                            color:
                              '#9a7a35',
                            fontSize: 10,
                            fontWeight: 900,
                        }}
                        >
                          TODAY'S QUEUE
                        </p>

                        <h4
                          style={{
                            margin:
                              '4px 0 0',
                          }}
                        >
                          {
                            docBookings.length
                          }{' '}
                          Patient
                          {docBookings.length ===
                          1
                            ? ''
                            : 's'}
                        </h4>
                      </div>

                      <button
                        onClick={() =>
                          refreshBookings(
                            doc.id
                          )
                        }
                        style={{
                          ...ghostBtn,
                          padding:
                            '8px 10px',
                          fontSize: 11,
                        }}
                      >
                        Refresh
                      </button>
                    </div>

                    {loadingBookings ? (
                      <p
                        style={{
                          textAlign:
                            'center',
                          color:
                            '#8a918e',
                        }}
                      >
                        Loading queue...
                      </p>
                    ) : docBookings.length ===
                      0 ? (
                      <div
                        style={{
                          padding:
                            '22px 12px',
                          textAlign:
                            'center',
                          background:
                            '#faf9f6',
                          borderRadius: 16,
                          color:
                            '#8a918e',
                          fontSize: 13,
                        }}
                      >
                        No bookings for today yet.
                      </div>
                    ) : (
                      docBookings.map(
                        (b) => {
                          const isWaiting =
                            b.status ===
                            'waiting';

                          const isUpdating =
                            updatingPatient ===
                            b.id;

                          return (
                            <div
                              key={b.id}
                              style={{
                                background:
                                  '#faf9f6',
                                border:
                                  '1px solid #ebe7de',
                                borderRadius: 18,
                                padding: 13,
                                marginBottom: 9,
                              }}
                            >
                              <div
                                style={{
                                  display:
                                    'flex',
                                  justifyContent:
                                    'space-between',
                                  gap: 10,
                                  alignItems:
                                    'flex-start',
                                }}
                            >
                                <div
                                  style={{
                                    display:
                                      'flex',
                                    gap: 10,
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 38,
                                      height: 38,
                                      borderRadius: 13,
                                      background:
                                        '#123c35',
                                      color:
                                        '#d7b45e',
                                      display:
                                        'flex',
                                      alignItems:
                                        'center',
                                      justifyContent:
                                        'center',
                                      fontSize: 13,
                                      fontWeight: 900,
                                    }}
                                  >
                                    #
                                    {
                                      b.token_number
                                    }
                                  </div>

                                  <div>
                                    <h5
                                      style={{
                                        margin:
                                          '1px 0 2px',
                                        fontSize: 14,
                                      }}
                                    >
                                      {b.patient_name ||
                                        'Patient'}
                                    </h5>

                                    <p
                                      style={{
                                        margin: 0,
                                        fontSize: 11,
                                        color:
                                          '#8a918e',
                                      }}
                                    >
                                      {b.is_walkin
                                        ? 'Walk-in patient'
                                        : 'App booking'}
                                    </p>
                                  </div>
                                </div>

                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 900,
                                    padding:
                                      '5px 8px',
                                    borderRadius: 999,
                                    background:
                                      isWaiting
                                        ? '#fff4dc'
                                        : '#edf8f3',
                                    color:
                                      isWaiting
                                        ? '#aa7413'
                                        : '#0f8c6b',
                                  }}
                                >
                                  {isWaiting
                                    ? 'WAITING'
                                    : 'COMPLETED'}
                                </span>
                              </div>

                              {isWaiting ? (
                                <div
                                  style={{
                                    display:
                                      'grid',
                                    gridTemplateColumns:
                                      '1fr 1fr 1fr',
                                    gap: 7,
                                    marginTop: 11,
                                }}
                              >
                                <button
                                  onClick={() =>
                                    handleCheckIn(
                                      b.id,
                                      doc.id
                                  )
                                }
                                disabled={
                                  isUpdating
                              }
                                style={{
                                  ...ghostBtn,
                                  padding: 9,
                                  fontSize: 10,
                              }}
                            >
                              Check In
                            </button>

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
                                  ...primaryBtn,
                                  padding: 9,
                                  fontSize: 10,
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
                                  ...dangerBtn,
                                  padding: 9,
                                  fontSize: 10,
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <p
                            style={{
                              color:
                                '#0f8c6b',
                            fontWeight: 800,
                            fontSize: 11,
                            margin:
                              '10px 0 0',
                          }}
                        >
                          ✓ Completed / Seen
                        </p>
                      )}
                      </div>
                      );
                      }
                    )
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* ADD DOCTOR BUTTON */}

      <button
        onClick={() =>
          setShowAddForm(!showAddForm)
        }
        style={{
          ...(showAddForm
            ? ghostBtn
            : primaryBtn),
          width: '100%',
          padding: 14,
          fontSize: 14,
          marginTop: 4,
        }}
      >
        {showAddForm
          ? 'Close Add Doctor Form'
          : '+ Add New Doctor'}
      </button>

      {/* ADD DOCTOR FORM */}

      {showAddForm && (
        <form
          onSubmit={handleAddDoctor}
          style={{
            ...cardStyle,
            marginTop: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: '#9a7a35',
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 0.8,
              }}
            >
              NEW DOCTOR
            </p>

            <h3
              style={{
                margin: '4px 0 0',
                fontFamily:
                  'Georgia, "Times New Roman", serif',
                color: '#173a34',
                fontSize: 22,
              }}
            >
              Create Doctor Profile
            </h3>
          </div>

          <Field label="Doctor Name *">
            <input
              placeholder="e.g. Dr. Gautam Banerjee"
              value={newName}
              onChange={(e) =>
                setNewName(e.target.value)
              }
              style={inputStyle}
              required
            />
          </Field>

          <Field label="Degrees & Qualifications *">
            <input
              placeholder="e.g. MBBS, MD (General Medicine)"
              value={newDegrees}
              onChange={(e) =>
                setNewDegrees(e.target.value)
              }
              style={inputStyle}
              required
            />
          </Field>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                '1fr 1fr',
              gap: 9,
            }}
          >
            <Field label="Consultation Fee ₹">
              <input
                type="number"
                placeholder="500"
                value={newFee}
                onChange={(e) =>
                  setNewFee(e.target.value)
                }
                style={inputStyle}
              />
            </Field>

            <Field label="PTR Trust Score %">
              <input
                type="number"
                step="0.1"
                placeholder="99.5"
                value={newPtr}
                onChange={(e) =>
                  setNewPtr(e.target.value)
                }
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="Average Consultation Time (Minutes)">
            <input
              type="number"
              min="1"
              value={newAvgMinutes}
              onChange={(e) =>
                setNewAvgMinutes(
                  e.target.value
                )
              }
              style={inputStyle}
            />
          </Field>

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

          <ScheduleEditor
            value={daySchedules}
            onChange={setDaySchedules}
          />

          <button
            type="submit"
            disabled={savingDoctor}
            style={{
              ...primaryBtn,
              padding: 14,
              fontSize: 14,
              opacity:
                savingDoctor ? 0.65 : 1,
            }}
          >
            {savingDoctor
              ? 'Saving Doctor...'
              : 'Save Doctor Profile'}
          </button>
        </form>
      )}
    </div>

    {/* QR MODAL */}

    {showQrModal && (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background:
            'rgba(20,30,27,0.56)',
          backdropFilter: 'blur(7px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          zIndex: 1000,
        }}
      >
        <div
          style={{
            background: '#fffdf8',
            border:
              '1px solid #ebe4d8',
            borderRadius: 28,
            padding: 22,
            width: '100%',
            maxWidth: 360,
            textAlign: 'center',
            boxShadow:
              '0 22px 60px rgba(0,0,0,0.22)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',I encountered an error doing what you asked. Could you try again?
