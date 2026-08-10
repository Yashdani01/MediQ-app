import { supabase } from './supabaseClient';

export async function getHospitals(city) {
  let query = supabase.from('hospitals').select('id, name, location, city');
  if (city) {
    query = query.ilike('city', city);
  }
  const { data, error } = await query;
  if (error) { console.error('Error fetching hospitals:', error); return []; }
  return data;
}

export async function getAllCities() {
  const { data, error } = await supabase
    .from('hospitals')
    .select('city')
    .not('city', 'is', null);
  if (error) { console.error('Error fetching cities:', error); return []; }
  const unique = [...new Set(data.map((h) => h.city).filter(Boolean))];
  return unique;
}

export async function getDoctorsForHospital(hospitalId) {
  const { data, error } = await supabase
    .from('doctors')
    .select('id, name, specialty, avg_minutes_per_patient, status, delay_minutes, status_updated_at, working_days, start_time, end_time, notes')
    .eq('hospital_id', hospitalId);
  if (error) { console.error('Error fetching doctors:', error); return []; }
  return data;
}

export async function getWaitingCount(doctorId) {
  const { data, error } = await supabase
    .rpc('get_waiting_count', { doc_id: doctorId });
  if (error) { console.error('Error counting queue:', error); return 0; }
  return data || 0;
}

export async function bookAppointment(patientUserId, doctorId, hospitalId, paymentMethod) {
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', patientUserId)
    .single();

  if (patientError || !patient) {
    console.error('Error finding patient record:', patientError);
    return { error: patientError || new Error('Patient record not found') };
  }

  const { data: queueNumber, error: queueError } = await supabase
    .rpc('get_next_queue_number', { doc_id: doctorId });

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

  return {
    ...appointment,
    doctor,
    hospital,
    patientsAhead: patientsAhead || 0,
  };
}

export async function getPatientProfileDetails(patientUserId) {
  const { data, error } = await supabase
    .from('patients')
    .select('patient_code, created_at')
    .eq('user_id', patientUserId)
    .single();
  if (error) { console.error('Error fetching profile details:', error); return null; }
  return data;
}

export async function getBookingHistory(patientUserId) {
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', patientUserId)
    .single();

  if (patientError || !patient) return [];

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('id, queue_number, status, booked_at, doctor_id, hospital_id')
    .eq('patient_id', patient.id)
    .order('booked_at', { ascending: false })
    .limit(20);

  if (error || !appointments) return [];

  const enriched = await Promise.all(
    appointments.map(async (appt) => {
      const { data: doctor } = await supabase
        .from('doctors')
        .select('name, specialty')
        .eq('id', appt.doctor_id)
        .single();
      const { data: hospital } = await supabase
        .from('hospitals')
        .select('name')
        .eq('id', appt.hospital_id)
        .single();
      return { ...appt, doctor, hospital };
    })
  );

  return enriched;
}

// Search doctors by name/specialty across all hospitals in a city
export async function searchDoctors(city, searchTerm) {
  let hospitalQuery = supabase.from('hospitals').select('id, name, location, city');
  if (city) {
    hospitalQuery = hospitalQuery.ilike('city', city);
  }
  const { data: hospitals, error: hospitalError } = await hospitalQuery;
  if (hospitalError || !hospitals || hospitals.length === 0) return [];

  const hospitalIds = hospitals.map((h) => h.id);
  const hospitalMap = Object.fromEntries(hospitals.map((h) => [h.id, h]));

  let doctorQuery = supabase
    .from('doctors')
    .select('id, name, specialty, avg_minutes_per_patient, hospital_id')
    .in('hospital_id', hospitalIds);

  if (searchTerm) {
    doctorQuery = doctorQuery.or(`name.ilike.%${searchTerm}%,specialty.ilike.%${searchTerm}%`);
  }

  const { data: doctors, error: doctorError } = await doctorQuery;
  if (doctorError || !doctors) return [];

  const withQueueAndHospital = await Promise.all(
    doctors.map(async (doc) => ({
      ...doc,
      liveQueue: await getWaitingCount(doc.id),
      hospital: hospitalMap[doc.hospital_id],
    }))
  );

  return withQueueAndHospital;
}

export async function getAllSpecialties(city) {
  let hospitalQuery = supabase.from('hospitals').select('id');
  if (city) {
    hospitalQuery = hospitalQuery.ilike('city', city);
  }
  const { data: hospitals } = await hospitalQuery;
  if (!hospitals || hospitals.length === 0) return [];

  const hospitalIds = hospitals.map((h) => h.id);
  const { data: doctors, error } = await supabase
    .from('doctors')
    .select('specialty')
    .in('hospital_id', hospitalIds);

  if (error || !doctors) return [];
  return [...new Set(doctors.map((d) => d.specialty).filter(Boolean))];
}export async function getPatientReports(patientUserId) {
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
  return data;
}
// ---- Clinic Portal functions ----

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

export async function addDoctor(pin, name, specialty, avgMinutes, workingDays, startTime, endTime, notes) {
  const { data, error } = await supabase.rpc('add_doctor', {
    input_pin: pin, input_name: name, input_specialty: specialty, input_avg_minutes: avgMinutes,
    input_working_days: workingDays, input_start_time: startTime, input_end_time: endTime, input_notes: notes,
  });
  if (error) { console.error('Error adding doctor:', error); return { error }; }
  return { data };
}

export async function updateDoctor(pin, doctorId, name, specialty, avgMinutes, workingDays, startTime, endTime, notes) {
  const { error } = await supabase.rpc('update_doctor', {
    input_pin: pin, input_doctor_id: doctorId, input_name: name, input_specialty: specialty, input_avg_minutes: avgMinutes,
    input_working_days: workingDays, input_start_time: startTime, input_end_time: endTime, input_notes: notes,
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
export async function updateHospitalUpi(pin, upiId) {
  const { error } = await supabase.rpc('update_hospital_upi', {
    input_pin: pin, input_upi_id: upiId,
  });
  if (error) { console.error('Error updating UPI ID:', error); return { error }; }
  return { success: true };
}

export async function getHospitalUpi(pin) {
  const { data, error } = await supabase.rpc('get_hospital_upi', { input_pin: pin });
  if (error) { console.error('Error fetching UPI ID:', error); return null; }
  return data;
}
export async function getHospitalPaymentInfo(hospitalId) {
  const { data, error } = await supabase
    .from('hospitals')
    .select('upi_id')
    .eq('id', hospitalId)
    .single();
  if (error) { console.error('Error fetching payment info:', error); return null; }
  return data?.upi_id || null;
}




