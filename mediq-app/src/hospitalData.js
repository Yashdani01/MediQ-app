import { supabase } from './supabaseClient';

// Fetch all hospitals
export async function getHospitals() {
  const { data, error } = await supabase
    .from('hospitals')
    .select('id, name, location');

  if (error) {
    console.error('Error fetching hospitals:', error);
    return [];
  }
  return data;
}

// Fetch doctors for a specific hospital
export async function getDoctorsForHospital(hospitalId) {
  const { data, error } = await supabase
    .from('doctors')
    .select('id, name, specialty, avg_minutes_per_patient')
    .eq('hospital_id', hospitalId);

  if (error) {
    console.error('Error fetching doctors:', error);
    return [];
  }
  return data;
}

// Count how many patients are currently waiting for a doctor
export async function getWaitingCount(doctorId) {
  const { count, error } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', doctorId)
    .eq('status', 'waiting');

  if (error) {
    console.error('Error counting queue:', error);
    return 0;
  }
  return count || 0;
}

// Book a new appointment and return the created row
export async function bookAppointment(patientUserId, doctorId, hospitalId) {
  // Get the patient's row id
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', patientUserId)
    .single();

  if (patientError || !patient) {
    console.error('Error finding patient record:', patientError);
    return { error: patientError || new Error('Patient record not found') };
  }

  // Get the next queue number for this doctor today
  const { data: queueNumber, error: queueError } = await supabase
    .rpc('get_next_queue_number', { doc_id: doctorId });

  if (queueError) {
    console.error('Error getting queue number:', queueError);
    return { error: queueError };
  }

  // Insert the appointment
  const { data: appointment, error: insertError } = await supabase
    .from('appointments')
    .insert({
      patient_id: patient.id,
      doctor_id: doctorId,
      hospital_id: hospitalId,
      queue_number: queueNumber,
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