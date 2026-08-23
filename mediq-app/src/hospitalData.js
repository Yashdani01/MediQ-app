// src/hospitalData.js
// Single data-access layer for the whole app. Every Supabase call
// (table queries + RPC calls) lives here — components never talk
// to Supabase directly except for auth (supabaseClient) and small
// one-off lookups already established elsewhere (e.g. ClinicPortal's
// hospital-name lookup).
//
// Sections:
//   1. Hospitals & Cities
//   2. Doctors (patient-facing: browse/search)
//   3. Booking (patient-facing: book/cancel/status)
//   4. Patient Profile & History
//   5. Patient Reports (Health Vault)
//   6. Clinic Portal (staff-facing, PIN-gated)

import { supabase } from './supabaseClient';

/* =========================================================
   1. HOSPITALS & CITIES
========================================================= */

export async function getHospitals(city = '') {
  let query = supabase
    .from('hospitals')
    .select('id, name, location, city, google_maps_url')
    .order('name', { ascending: true });

  if (city && city.trim() !== '') {
    query = query.ilike('city', city.trim());
  }

  const { data, error } = await query;
  if (error) { console.error('Error fetching hospitals:', error); return []; }
  return data || [];
}

export async function getAllCities() {
  const { data, error } = await supabase
    .from('hospitals')
    .select('city')
    .not('city', 'is', null);

  if (error) { console.error('Error fetching cities:', error); return []; }

  const cities = [
    ...new Set(
      (data || [])
        .map((h) => h.city?.trim())
        .filter((c) => c && c.length > 0)
    ),
  ];
  cities.sort((a, b) => a.localeCompare(b));
  return cities;
}

/* =========================================================
   2. DOCTORS (patient-facing)
========================================================= */

export async function getDoctorsForHospital(hospitalId) {
  const { data, error } = await supabase
    .from('doctors')
    .select(`
      id, name, specialty, avg_minutes_per_patient, status, delay_minutes,
      status_updated_at, working_days, start_time, end_time, notes,
      consultation_fee, degrees, ptr_score, specialties, custom_schedule
    `)
    .eq('hospital_id', hospitalId);

  if (error) { console.error('Error fetching doctors:', error); return []; }
  return data || [];
}

export async function getWaitingCount(doctorId) {
  const { data, error } = await supabase.rpc('get_waiting_count', { doc_id: doctorId });
  if (error) { console.error('Error counting queue:', error); return 0; }
  return data || 0;
}

const DAY_ABBR_COUNT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function isAvailableToday(doc) {
  const today = DAY_ABBR_COUNT[new Date().getDay()];
  const worksToday = !doc.working_days || doc.working_days.length === 0 || doc.working_days.includes(today);
  const notBlocked = doc.status !== 'completed' && doc.status !== 'on_leave';
  return worksToday && notBlocked;
}

export async function getAvailableDoctorCounts(hospitalIds) {
  if (!hospitalIds || hospitalIds.length === 0) return {};

  const { data, error } = await supabase
    .from('doctors')
    .select('hospital_id, status, working_days')
    .in('hospital_id', hospitalIds);

  if (error) { console.error('Error fetching doctor counts:', error); return {}; }

  const counts = {};
  (data || []).forEach((doc) => {
    if (isAvailableToday(doc)) {
      counts[doc.hospital_id] = (counts[doc.hospital_id] || 0) + 1;
    }
  });
  return counts;
}

export async function searchDoctors(city = '', searchTerm = '') {
  let hospitalQuery = supabase.from('hospitals').select('id, name, location, city, google_maps_url');
  if (city && city.trim() !== '') hospitalQuery = hospitalQuery.ilike('city', city.trim());

  const { data: hospitals, error: hospitalError } = await hospitalQuery;
  if (hospitalError || !hospitals || hospitals.length === 0) return [];

  const hospitalIds = hospitals.map((h) => h.id);
  const hospitalMap = Object.fromEntries(hospitals.map((h) => [h.id, h]));

  let refinedTerm = searchTerm.trim();
  const lowerTerm = refinedTerm.toLowerCase();

  if (lowerTerm.includes('dant') || lowerTerm.includes('teeth') || lowerTerm.includes('tooth') || lowerTerm.includes('dental') || lowerTerm.includes('daant')) {
    refinedTerm = 'Dentist';
  } else if (lowerTerm.includes('heart') || lowerTerm.includes('chest') || lowerTerm.includes('cardiologist')) {
    refinedTerm = 'Cardiologist';
  } else if (lowerTerm.includes('sugar') || lowerTerm.includes('diabetes')) {
    refinedTerm = 'Diabetologist';
  } else if (lowerTerm.includes('fever') || lowerTerm.includes('cold') || lowerTerm.includes('cough') || lowerTerm.includes('bukhar') || lowerTerm.includes('jhor') || lowerTerm.includes('headache') || lowerTerm.includes('general') || lowerTerm.includes('physician')) {
    refinedTerm = 'General Physician';
  }

  let doctorQuery = supabase
    .from('doctors')
    .select(`
      id, name, specialty, avg_minutes_per_patient, hospital_id, consultation_fee,
      degrees, ptr_score, specialties, status, delay_minutes, working_days, start_time, end_time
    `)
    .in('hospital_id', hospitalIds);

  if (refinedTerm) {
    doctorQuery = doctorQuery.or(`name.ilike.%${refinedTerm}%,specialty.ilike.%${refinedTerm}%`);
  }

  const { data: doctors, error: doctorError } = await doctorQuery;
  if (doctorError || !doctors) return [];

  return Promise.all(
    doctors.map(async (doc) => ({
      ...doc,
      liveQueue: await getWaitingCount(doc.id),
      hospital: hospitalMap[doc.hospital_id],
    }))
  );
}

export async function getAllSpecialties(city = '') {
  let hospitalQuery = supabase.from('hospitals').select('id');
  if (city && city.trim() !== '') hospitalQuery = hospitalQuery.ilike('city', city.trim());

  const { data: hospitals, error: hospitalError } = await hospitalQuery;
  if (hospitalError || !hospitals || hospitals.length === 0) return [];

  const hospitalIds = hospitals.map((h) => h.id);
  const { data: doctors, error } = await supabase
    .from('doctors')
    .select('specialty')
    .in('hospital_id', hospitalIds);

  if (error || !doctors) return [];

  return [...new Set(doctors.map((d) => d.specialty?.trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

/* =========================================================
   3. BOOKING (patient-facing)
========================================================= */

export async function getHospitalPaymentInfo(hospitalId) {
  const { data, error } = await supabase
    .from('hospitals')
    .select('upi_id')
    .eq('id', hospitalId)
    .single();
  if (error) { console.error('Error fetching payment info:', error); return null; }
  return data?.upi_id || null;
}

export async function uploadPaymentScreenshot(file) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
  const { error: uploadError } = await supabase.storage.from('payment-screenshots').upload(fileName, file);

  if (uploadError) {
    console.error('Error uploading screenshot:', uploadError);
    return { error: uploadError };
  }

  const { data } = supabase.storage.from('payment-screenshots').getPublicUrl(fileName);
  return { url: data.publicUrl };
}

export async function bookAppointment(patientUserId, doctorId, hospitalId, paymentMethod, transactionId, screenshotUrl, contactPhone) {
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', patientUserId)
    .single();

  if (patientError || !patient) {
    console.error('Error finding patient record:', patientError);
    return { error: patientError || new Error('Patient record not found') };
  }

  const { data: queueNumber, error: queueError } = await supabase.rpc('get_next_queue_number', { doc_id: doctorId });
  if (queueError) {
    console.error('Error getting queue number:', queueError);
    return { error: queueError };
  }

  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const { data: appointment, error: insertError } = await supabase
    .from('appointments')
    .insert({
      patient_id: patient.id,
      doctor_id: doctorId,
      hospital_id: hospitalId,
      queue_number: queueNumber,
      token_number: String(queueNumber),
      appointment_time: timeString,
      status: 'waiting',
      payment_method: paymentMethod || 'cash',
      transaction_id: transactionId || null,
      payment_screenshot_url: screenshotUrl || null,
      contact_phone: contactPhone || null,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error booking appointment:', insertError);
    return { error: insertError };
  }

  return { data: appointment };
}

export async function getMyCurrentBooking(patientUserId) {
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', patientUserId)
    .single();

  if (patientError || !patient) return null;

  const { data: appointment, error } = await supabase
    .from('appointments')
    .select('id, queue_number, status, doctor_id, hospital_id, booked_at')
    .eq('patient_id', patient.id)
    .eq('status', 'waiting')
    .order('booked_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !appointment) return null;

  const { data: doctor } = await supabase
    .from('doctors')
    .select('name, specialty, avg_minutes_per_patient')
    .eq('id', appointment.doctor_id)
    .single();

  const { data: hospital } = await supabase
    .from('hospitals')
    .select('name')
    .eq('id', appointment.hospital_id)
    .single();

  const { count: patientsAhead } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', appointment.doctor_id)
    .eq('status', 'waiting')
    .lt('queue_number', appointment.queue_number);

  return { ...appointment, doctor, hospital, patientsAhead: patientsAhead || 0 };
}

export async function cancelAppointment(appointmentId) {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) { console.error('Error cancelling appointment:', error); return { error }; }
  return { data };
}

// Patient-side: poll for status/check-in updates on a single appointment
export async function getAppointmentStatus(appointmentId) {
  const { data, error } = await supabase
    .from('appointments')
    .select('id, status, booked_at, checked_in_at')
    .eq('id', appointmentId)
    .single();
  if (error) { console.error('Error fetching appointment status:', error); return null; }
  return data;
}

/* =========================================================
   4. PATIENT PROFILE & HISTORY
========================================================= */

export async function getPatientProfileDetails(patientUserId) {
  const { data, error } = await supabase
    .from('patients')
    .select('patient_code, created_at')
    .eq('user_id', patientUserId)
    .single();
  if (error) { console.error('Error fetching profile details:', error); return null; }
  return data;
}

export async function getMyBookings(patientUserId) {
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', patientUserId)
    .single();

  if (patientError || !patient) return [];

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('id, queue_number, status, created_at, booked_at, doctor_id, hospital_id, booking_code, payment_method, transaction_id, payment_screenshot_url, contact_phone, checked_in_at')
    .eq('patient_id', patient.id)
    .order('booked_at', { ascending: false })
    .limit(20);

  if (error || !appointments) return [];

  return Promise.all(
    appointments.map(async (appt) => {
      const { data: doctor } = await supabase
        .from('doctors')
        .select('name, specialty, consultation_fee')
        .eq('id', appt.doctor_id)
        .single();
      const { data: hospital } = await supabase
        .from('hospitals')
        .select('name, location, city, google_maps_url')
        .eq('id', appt.hospital_id)
        .single();
      return { ...appt, doctor, hospital };
    })
  );
}

/* =========================================================
   5. PATIENT REPORTS (Health Vault)
========================================================= */

export async function getPatientReports(patientUserId) {
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', patientUserId)
    .single();

  if (patientError || !patient) return [];

  const { data, error } = await supabase
    .from('reports')
    .select('id, name, report_type, file_url, uploaded_at')
    .eq('patient_id', patient.id)
    .order('uploaded_at', { ascending: false });

  if (error) { console.error('Error fetching reports:', error); return []; }
  return data || [];
}

export async function uploadPatientReport(patientUserId, name, category, file) {
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', patientUserId)
    .single();

  if (patientError || !patient) {
    console.error('Error finding patient record:', patientError);
    return { error: patientError || new Error('Patient record not found') };
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${patient.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage.from('patient-reports').upload(fileName, file);
  if (uploadError) {
    console.error('Error uploading report file:', uploadError);
    return { error: uploadError };
  }

  const { data: publicUrlData } = supabase.storage.from('patient-reports').getPublicUrl(fileName);

  const { data, error: insertError } = await supabase
    .from('reports')
    .insert({
      patient_id: patient.id,
      name,
      report_type: category,
      file_url: publicUrlData.publicUrl,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error saving report record:', insertError);
    return { error: insertError };
  }

  return { data };
}

/* =========================================================
   6. CLINIC PORTAL (staff-facing, PIN-gated)
========================================================= */

export async function checkClinicPin(pin) {
  const { data, error } = await supabase.rpc('check_clinic_pin', { input_pin: pin });
  if (error || !data) return null;
  return data;
}

export async function getDoctorsForClinic(pin) {
  const { data, error } = await supabase.rpc('get_doctors_for_clinic', { input_pin: pin });
  if (error) { console.error('Error fetching clinic doctors:', error); return []; }
  return data;
}

export async function addDoctor(pin, name, specialty, avgMinutes, workingDays, startTime, endTime, notes, fee) {
  const { data, error } = await supabase.rpc('add_doctor', {
    input_pin: pin, input_name: name, input_specialty: specialty, input_avg_minutes: avgMinutes,
    input_working_days: workingDays, input_start_time: startTime, input_end_time: endTime, input_notes: notes,
    input_fee: fee,
  });
  if (error) { console.error('Error adding doctor:', error); return { error }; }
  return { data };
}

export async function updateDoctor(pin, doctorId, name, specialty, avgMinutes, workingDays, startTime, endTime, notes, fee) {
  const { error } = await supabase.rpc('update_doctor', {
    input_pin: pin, input_doctor_id: doctorId, input_name: name, input_specialty: specialty, input_avg_minutes: avgMinutes,
    input_working_days: workingDays, input_start_time: startTime, input_end_time: endTime, input_notes: notes,
    input_fee: fee,
  });
  if (error) { console.error('Error updating doctor:', error); return { error }; }
  return { success: true };
}

export async function deleteDoctor(pin, doctorId) {
  const { error } = await supabase.rpc('delete_doctor', { input_pin: pin, input_doctor_id: doctorId });
  if (error) { console.error('Error deleting doctor:', error); return { error }; }
  return { success: true };
}

export async function updateDoctorStatus(pin, doctorId, status, delayMinutes) {
  const { error } = await supabase.rpc('update_doctor_status', {
    input_pin: pin, input_doctor_id: doctorId, input_status: status, input_delay_minutes: delayMinutes,
  });
  if (error) { console.error('Error updating status:', error); return { error }; }
  return { success: true };
}

export async function addWalkinBooking(pin, doctorId, name, phone) {
  const { data, error } = await supabase.rpc('create_walkin_booking', {
    input_pin: pin, input_doctor_id: doctorId, input_name: name, input_phone: phone,
  });
  if (error) { console.error('Error adding walk-in:', error); return { error }; }
  return { data };
}

export async function getHospitalUpi(pin) {
  const { data, error } = await supabase.rpc('get_hospital_upi', { input_pin: pin });
  if (error) { console.error('Error fetching UPI ID:', error); return null; }
  return data;
}

export async function updateHospitalUpi(pin, upiId) {
  const { error } = await supabase.rpc('update_hospital_upi', { input_pin: pin, input_upi_id: upiId });
  if (error) { console.error('Error updating UPI ID:', error); return { error }; }
  return { success: true };
}

export async function getTodaysBookings(pin, doctorId) {
  const { data, error } = await supabase.rpc('get_todays_bookings', { input_pin: pin, input_doctor_id: doctorId });
  if (error) { console.error('Error fetching bookings:', error); return []; }
  return data;
}

export async function markAppointmentSeen(pin, appointmentId) {
  const { error } = await supabase.rpc('mark_appointment_seen', { input_pin: pin, input_appointment_id: appointmentId });
  if (error) { console.error('Error marking appointment seen:', error); return { error }; }
  return { success: true };
}

export async function checkInAppointment(pin, appointmentId) {
  const { error } = await supabase.rpc('check_in_appointment', { input_pin: pin, input_appointment_id: appointmentId });
  if (error) { console.error('Error checking in appointment:', error); return { error }; }
  return { success: true };
}

export async function getHospitalLocation(pin) {
  const { data, error } = await supabase.rpc('get_hospital_location', { input_pin: pin });
  if (error) { console.error('Error fetching location:', error); return null; }
  return data;
}

export async function updateHospitalLocation(pin, location) {
  const { error } = await supabase.rpc('update_hospital_location', { input_pin: pin, input_location: location });
  if (error) { console.error('Error updating hospital location:', error); return { error }; }
  return { success: true };
}
