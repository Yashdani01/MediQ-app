import { supabase } from './supabaseClient';

export async function getHospitals() {
  const { data, error } = await supabase
    .from('hospitals')
    .select('id, name, location');
  if (error) { console.error('Error fetching hospitals:', error); return []; }
  return data;
}

export async function getDoctorsForHospital(hospitalId) {
  const { data, error } = await supabase
    .from('doctors')
    .select('id, name, specialty, avg_minutes_per_patient')
    .eq('hospital_id', hospitalId);
  if (error) { console.error('Error fetching doctors:', error); return []; }
  return data;
}

export async function getWaitingCount(doctorId) {
  const { count, error } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', doctorId)
    .eq('status', 'waiting');
  if (error) { console.error('Error counting queue:', error); return 0; }
  return count || 0;
}

export async function bookAppointment(patientUserId, doctorId, hospitalId) {
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