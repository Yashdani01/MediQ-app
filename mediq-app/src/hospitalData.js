// src/hospitalData.js

import { supabase } from './supabaseClient';

// ==========================================
// HOSPITAL FUNCTIONS
// ==========================================

export async function getHospitals(city = '') {
  let query = supabase
    .from('hospitals')
    .select(`
      id,
      name,
      location,
      city,
      google_maps_url
    `)
    .order('name', { ascending: true });

  // Only filter if a city is actually selected
  if (city && city.trim() !== '') {
    query = query.ilike('city', city.trim());
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching hospitals:', error);
    return [];
  }

  console.log('Hospitals fetched:', data);

  return data || [];
}


export async function getAllCities() {
  const { data, error } = await supabase
    .from('hospitals')
    .select('city')
    .not('city', 'is', null);

  if (error) {
    console.error('Error fetching cities:', error);
    return [];
  }

  const uniqueCities = [
    ...new Set(
      (data || [])
        .map((hospital) => hospital.city)
        .filter(Boolean)
    ),
  ];

  return uniqueCities.sort();
}


export async function getDoctorsForHospital(hospitalId) {
  const { data, error } = await supabase
    .from('doctors')
    .select(`
      id,
      name,
      specialty,
      avg_minutes_per_patient,
      status,
      delay_minutes,
      status_updated_at,
      working_days,
      start_time,
      end_time,
      notes,
      consultation_fee,
      degrees,
      ptr_score,
      specialties,
      custom_schedule,
      hospital_id
    `)
    .eq('hospital_id', hospitalId);

  if (error) {
    console.error('Error fetching doctors:', error);
    return [];
  }

  return data || [];
}


// ==========================================
// QUEUE FUNCTIONS
// ==========================================

export async function getWaitingCount(doctorId) {
  const { data, error } = await supabase.rpc(
    'get_waiting_count',
    {
      doc_id: doctorId,
    }
  );

  if (error) {
    console.error('Error counting queue:', error);
    return 0;
  }

  return data || 0;
}


export async function getAvailableDoctorCounts(hospitalIds) {
  if (!hospitalIds || hospitalIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from('doctors')
    .select(`
      hospital_id,
      status,
      working_days
    `)
    .in('hospital_id', hospitalIds);

  if (error) {
    console.error(
      'Error fetching doctor counts:',
      error
    );

    return {};
  }

  const DAY_ABBR = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
  ];

  const today =
    DAY_ABBR[new Date().getDay()];

  const counts = {};

  (data || []).forEach((doctor) => {
    const worksToday =
      !doctor.working_days ||
      doctor.working_days.length === 0 ||
      doctor.working_days.includes(today);

    const isAvailable =
      doctor.status !== 'completed' &&
      doctor.status !== 'on_leave';

    if (worksToday && isAvailable) {
      counts[doctor.hospital_id] =
        (counts[doctor.hospital_id] || 0) + 1;
    }
  });

  return counts;
}


// ==========================================
// BOOK APPOINTMENT
// ==========================================

export async function bookAppointment(
  patientUserId,
  doctorId,
  hospitalId,
  paymentMethod = 'cash',
  transactionId = null,
  screenshotUrl = null,
  contactPhone = null
) {
  const {
    data: patient,
    error: patientError,
  } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', patientUserId)
    .single();

  if (patientError || !patient) {
    console.error(
      'Error finding patient:',
      patientError
    );

    return {
      error:
        patientError ||
        new Error(
          'Patient record not found'
        ),
    };
  }

  const {
    data: queueNumber,
    error: queueError,
  } = await supabase.rpc(
    'get_next_queue_number',
    {
      doc_id: doctorId,
    }
  );

  if (queueError) {
    console.error(
      'Error getting queue number:',
      queueError
    );

    return {
      error: queueError,
    };
  }

  const now = new Date();

  const timeString =
    now.toLocaleTimeString(
      'en-US',
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    );

  const {
    data: appointment,
    error: insertError,
  } = await supabase
    .from('appointments')
    .insert({
      patient_id: patient.id,
      doctor_id: doctorId,
      hospital_id: hospitalId,
      queue_number: queueNumber,
      token_number: String(queueNumber),
      appointment_time: timeString,
      status: 'waiting',
      payment_method:
        paymentMethod || 'cash',
      transaction_id:
        transactionId || null,
      payment_screenshot_url:
        screenshotUrl || null,
      contact_phone:
        contactPhone || null,
    })
    .select()
    .single();

  if (insertError) {
    console.error(
      'Error booking appointment:',
      insertError
    );

    return {
      error: insertError,
    };
  }

  return {
    data: appointment,
  };
}


// ==========================================
// CURRENT BOOKING
// ==========================================

export async function getMyCurrentBooking(
  patientUserId
) {
  const {
    data: patient,
    error: patientError,
  } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', patientUserId)
    .single();

  if (patientError || !patient) {
    return null;
  }

  const {
    data: appointment,
    error,
  } = await supabase
    .from('appointments')
    .select(`
      id,
      queue_number,
      status,
      doctor_id,
      hospital_id,
      booked_at
    `)
    .eq('patient_id', patient.id)
    .eq('status', 'waiting')
    .order('booked_at', {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error || !appointment) {
    return null;
  }

  const {
    data: doctor,
  } = await supabase
    .from('doctors')
    .select(`
      name,
      specialty,
      avg_minutes_per_patient,
      degrees,
      ptr_score
    `)
    .eq(
      'id',
      appointment.doctor_id
    )
    .single();

  const {
    data: hospital,
  } = await supabase
    .from('hospitals')
    .select(`
      name,
      location,
      city,
      google_maps_url
    `)
    .eq(
      'id',
      appointment.hospital_id
    )
    .single();

  const {
    count: patientsAhead,
  } = await supabase
    .from('appointments')
    .select('*', {
      count: 'exact',
      head: true,
    })
    .eq(
      'doctor_id',
      appointment.doctor_id
    )
    .eq(
      'status',
      'waiting'
    )
    .lt(
      'queue_number',
      appointment.queue_number
    );

  return {
    ...appointment,
    doctor,
    hospital,
    patientsAhead:
      patientsAhead || 0,
  };
}


// ==========================================
// PATIENT PROFILE
// ==========================================

export async function getPatientProfileDetails(
  patientUserId
) {
  const { data, error } = await supabase
    .from('patients')
    .select(`
      patient_code,
      created_at
    `)
    .eq('user_id', patientUserId)
    .single();

  if (error) {
    console.error(
      'Error fetching profile details:',
      error
    );

    return null;
  }

  return data;
}


// ==========================================
// BOOKING HISTORY
// ==========================================

export async function getBookingHistory(
  patientUserId
) {
  const {
    data: patient,
    error: patientError,
  } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', patientUserId)
    .single();

  if (patientError || !patient) {
    return [];
  }

  const {
    data: appointments,
    error,
  } = await supabase
    .from('appointments')
    .select(`
      id,
      queue_number,
      status,
      booked_at,
      doctor_id,
      hospital_id
    `)
    .eq(
      'patient_id',
      patient.id
    )
    .order('booked_at', {
      ascending: false,
    })
    .limit(20);

  if (error || !appointments) {
    return [];
  }

  const enriched =
    await Promise.all(
      appointments.map(
        async (appointment) => {
          const {
            data: doctor,
          } = await supabase
            .from('doctors')
            .select(`
              name,
              specialty,
              degrees,
              ptr_score
            `)
            .eq(
              'id',
              appointment.doctor_id
            )
            .single();

          const {
            data: hospital,
          } = await supabase
            .from('hospitals')
            .select(`
              name,
              location,
              city,
              google_maps_url
            `)
            .eq(
              'id',
              appointment.hospital_id
            )
            .single();

          return {
            ...appointment,
            doctor,
            hospital,
          };
        }
      )
    );

  return enriched;
}


// ==========================================
// SEARCH DOCTORS
// ==========================================

export async function searchDoctors(
  city,
  searchTerm
) {
  let hospitalQuery = supabase
    .from('hospitals')
    .select(`
      id,
      name,
      location,
      city,
      google_maps_url
    `);

  if (city && city.trim() !== '') {
    hospitalQuery =
      hospitalQuery.ilike(
        'city',
        city.trim()
      );
  }

  const {
    data: hospitals,
    error: hospitalError,
  } = await hospitalQuery;

  if (
    hospitalError ||
    !hospitals ||
    hospitals.length === 0
  ) {
    return [];
  }

  const hospitalIds =
    hospitals.map(
      (hospital) => hospital.id
    );

  const hospitalMap =
    Object.fromEntries(
      hospitals.map(
        (hospital) => [
          hospital.id,
          hospital,
        ]
      )
    );

  let refinedTerm =
    searchTerm.trim();

  const lowerTerm =
    refinedTerm.toLowerCase();

  if (
    lowerTerm.includes('dant') ||
    lowerTerm.includes('teeth') ||
    lowerTerm.includes('tooth') ||
    lowerTerm.includes('dental') ||
    lowerTerm.includes('daant')
  ) {
    refinedTerm = 'Dentist';
  } else if (
    lowerTerm.includes('heart') ||
    lowerTerm.includes('chest') ||
    lowerTerm.includes('cardiologist') ||
    lowerTerm.includes('bp')
  ) {
    refinedTerm = 'Cardiologist';
  } else if (
    lowerTerm.includes('sugar') ||
    lowerTerm.includes('diabetes') ||
    lowerTerm.includes('diabetic')
  ) {
    refinedTerm = 'Diabetologist';
  } else if (
    lowerTerm.includes('fever') ||
    lowerTerm.includes('cold') ||
    lowerTerm.includes('cough') ||
    lowerTerm.includes('bukhar') ||
    lowerTerm.includes('jhor') ||
    lowerTerm.includes('headache') ||
    lowerTerm.includes('general') ||
    lowerTerm.includes('physician')
  ) {
    refinedTerm =
      'General Physician';
  }

  let doctorQuery = supabase
    .from('doctors')
    .select(`
      id,
      name,
      specialty,
      avg_minutes_per_patient,
      hospital_id,
      consultation_fee,
      degrees,
      ptr_score,
      specialties,
      status,
      working_days
    `)
    .in(
      'hospital_id',
      hospitalIds
    );

  if (refinedTerm) {
    doctorQuery = doctorQuery.or(
      `name.ilike.%${refinedTerm}%,specialty.ilike.%${refinedTerm}%`
    );
  }

  const {
    data: doctors,
    error: doctorError,
  } = await doctorQuery;

  if (doctorError || !doctors) {
    return [];
  }

  const results =
    await Promise.all(
      doctors.map(
        async (doctor) => ({
          ...doctor,

          liveQueue:
            await getWaitingCount(
              doctor.id
            ),

          hospital:
            hospitalMap[
              doctor.hospital_id
            ],
        })
      )
    );

  return results;
}


// ==========================================
// SPECIALTIES
// ==========================================

export async function getAllSpecialties(
  city = ''
) {
  let hospitalQuery = supabase
    .from('hospitals')
    .select('id');

  if (city && city.trim() !== '') {
    hospitalQuery =
      hospitalQuery.ilike(
        'city',
        city.trim()
      );
  }

  const {
    data: hospitals,
    error: hospitalError,
  } = await hospitalQuery;

  if (
    hospitalError ||
    !hospitals ||
    hospitals.length === 0
  ) {
    return [];
  }

  const hospitalIds =
    hospitals.map(
      (hospital) => hospital.id
    );

  const {
    data: doctors,
    error,
  } = await supabase
    .from('doctors')
    .select('specialty')
    .in(
      'hospital_id',
      hospitalIds
    );

  if (error || !doctors) {
    return [];
  }

  return [
    ...new Set(
      doctors
        .map(
          (doctor) =>
            doctor.specialty
        )
        .filter(Boolean)
    ),
  ];
}


// ==========================================
// PATIENT REPORTS
// ==========================================

export async function getPatientReports(
  patientUserId
) {
  const {
    data: patient,
    error: patientError,
  } = await supabase
    .from('patients')
    .select('id')
    .eq(
      'user_id',
      patientUserId
    )
    .single();

  if (patientError || !patient) {
    return [];
  }

  const {
    data,
    error,
  } = await supabase
    .from('reports')
    .select(`
      id,
      name,
      report_type,
      file_url,
      uploaded_at
    `)
    .eq(
      'patient_id',
      patient.id
    )
    .order(
      'uploaded_at',
      {
        ascending: false,
      }
    );

  if (error) {
    console.error(
      'Error fetching reports:',
      error
    );

    return [];
  }

  return data || [];
}


export async function uploadPatientReport(
  patientUserId,
  reportName,
  reportType,
  file
) {
  const {
    data: patient,
    error: patientError,
  } = await supabase
    .from('patients')
    .select('id')
    .eq(
      'user_id',
      patientUserId
    )
    .single();

  if (patientError || !patient) {
    return {
      error:
        patientError ||
        new Error(
          'Patient record not found'
        ),
    };
  }

  const fileExt =
    file.name
      .split('.')
      .pop();

  const fileName =
    `${patient.id}-${Date.now()}.${fileExt}`;

  const {
    error: uploadError,
  } = await supabase.storage
    .from('patient-reports')
    .upload(
      fileName,
      file
    );

  if (uploadError) {
    console.error(
      'Error uploading report:',
      uploadError
    );

    return {
      error: uploadError,
    };
  }

  const {
    data: urlData,
  } = supabase.storage
    .from('patient-reports')
    .getPublicUrl(fileName);

  const {
    data,
    error: insertError,
  } = await supabase
    .from('reports')
    .insert({
      patient_id: patient.id,
      name: reportName,
      report_type: reportType,
      file_url:
        urlData.publicUrl,
    })
    .select()
    .single();

  if (insertError) {
    return {
      error: insertError,
    };
  }

  return {
    data,
  };
}


// ==========================================
// CLINIC PORTAL
// ==========================================

export async function checkClinicPin(pin) {
  const {
    data,
    error,
  } = await supabase.rpc(
    'check_clinic_pin',
    {
      input_pin: pin,
    }
  );

  if (error || !data) {
    return null;
  }

  return data;
}


export async function getDoctorsForClinic(
  pin
) {
  const {
    data,
    error,
  } = await supabase.rpc(
    'get_doctors_for_clinic',
    {
      input_pin: pin,
    }
  );

  if (error) {
    console.error(
      'Error fetching clinic doctors:',
      error
    );

    return [];
  }

  return data || [];
}


export async function addDoctor(
  pin,
  name,
  specialty,
  avgMinutes,
  workingDays,
  startTime,
  endTime,
  notes,
  fee
) {
  const {
    data,
    error,
  } = await supabase.rpc(
    'add_doctor',
    {
      input_pin: pin,
      input_name: name,
      input_specialty: specialty,
      input_avg_minutes: avgMinutes,
      input_working_days: workingDays,
      input_start_time: startTime,
      input_end_time: endTime,
      input_notes: notes,
      input_fee: fee,
    }
  );

  if (error) {
    console.error(
      'Error adding doctor:',
      error
    );

    return {
      error,
    };
  }

  return {
    data,
  };
}


export async function updateDoctor(
  pin,
  doctorId,
  name,
  specialty,
  avgMinutes,
  workingDays,
  startTime,
  endTime,
  notes,
  fee
) {
  const { error } =
    await supabase.rpc(
      'update_doctor',
      {
        input_pin: pin,
        input_doctor_id: doctorId,
        input_name: name,
        input_specialty:
          specialty,
        input_avg_minutes:
          avgMinutes,
        input_working_days:
          workingDays,
        input_start_time:
          startTime,
        input_end_time:
          endTime,
        input_notes: notes,
        input_fee: fee,
      }
    );

  if (error) {
    return {
      error,
    };
  }

  return {
    success: true,
  };
}


export async function deleteDoctor(
  pin,
  doctorId
) {
  const { error } =
    await supabase.rpc(
      'delete_doctor',
      {
        input_pin: pin,
        input_doctor_id:
          doctorId,
      }
    );

  if (error) {
    return {
      error,
    };
  }

  return {
    success: true,
  };
}


export async function updateDoctorStatus(
  pin,
  doctorId,
  status,
  delayMinutes
) {
  const { error } =
    await supabase.rpc(
      'update_doctor_status',
      {
        input_pin: pin,
        input_doctor_id:
          doctorId,
        input_status: status,
        input_delay_minutes:
          delayMinutes,
      }
    );

  if (error) {
    return {
      error,
    };
  }

  return {
    success: true,
  };
}


export async function addWalkinBooking(
  pin,
  doctorId,
  name,
  phone
) {
  const {
    data,
    error,
  } = await supabase.rpc(
    'create_walkin_booking',
    {
      input_pin: pin,
      input_doctor_id:
        doctorId,
      input_name: name,
      input_phone: phone,
    }
  );

  if (error) {
    return {
      error,
    };
  }

  return {
    data,
  };
}


// ==========================================
// PAYMENT FUNCTIONS
// ==========================================

export async function getHospitalPaymentInfo(
  hospitalId
) {
  const {
    data,
    error,
  } = await supabase
    .from('hospitals')
    .select('upi_id')
    .eq('id', hospitalId)
    .single();

  if (error) {
    console.error(
      'Error fetching payment info:',
      error
    );

    return null;
  }

  return data?.upi_id || null;
}


export async function updateHospitalUpi(
  pin,
  upiId
) {
  const { error } =
    await supabase.rpc(
      'update_hospital_upi',
      {
        input_pin: pin,
        input_upi_id: upiId,
      }
    );

  if (error) {
    return {
      error,
    };
  }

  return {
    success: true,
  };
}


export async function getHospitalUpi(pin) {
  const {
    data,
    error,
  } = await supabase.rpc(
    'get_hospital_upi',
    {
      input_pin: pin,
    }
  );

  if (error) {
    return null;
  }

  return data;
}


export async function uploadPaymentScreenshot(
  file
) {
  const fileExt =
    file.name
      .split('.')
      .pop();

  const fileName =
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt}`;

  const {
    error: uploadError,
  } = await supabase.storage
    .from('payment-screenshots')
    .upload(
      fileName,
      file
    );

  if (uploadError) {
    console.error(
      'Error uploading screenshot:',
      uploadError
    );

    return {
      error: uploadError,
    };
  }

  const { data } =
    supabase.storage
      .from('payment-screenshots')
      .getPublicUrl(fileName);

  return {
    url:
      data.publicUrl,
  };
}


// ==========================================
// CLINIC APPOINTMENTS
// ==========================================

export async function getTodaysBookings(
  pin,
  doctorId
) {
  const {
    data,
    error,
  } = await supabase.rpc(
    'get_todays_bookings',
    {
      input_pin: pin,
      input_doctor_id:
        doctorId,
    }
  );

  if (error) {
    return [];
  }

  return data || [];
}


export async function markAppointmentSeen(
  pin,
  appointmentId
) {
  const { error } =
    await supabase.rpc(
      'mark_appointment_seen',
      {
        input_pin: pin,
        input_appointment_id:
          appointmentId,
      }
    );

  if (error) {
    return {
      error,
    };
  }

  return {
    success: true,
  };
}


export async function checkInAppointment(
  pin,
  appointmentId
) {
  const { error } =
    await supabase.rpc(
      'check_in_appointment',
      {
        input_pin: pin,
        input_appointment_id:
          appointmentId,
      }
    );

  if (error) {
    return {
      error,
    };
  }

  return {
    success: true,
  };
}


export async function getAppointmentStatus(
  appointmentId
) {
  const {
    data,
    error,
  } = await supabase
    .from('appointments')
    .select(`
      id,
      status,
      booked_at,
      checked_in_at
    `)
    .eq('id', appointmentId)
    .single();

  if (error) {
    return null;
  }

  return data;
}


export async function setDoctorPause(
  pin,
  doctorId,
  paused
) {
  const { error } =
    await supabase.rpc(
      'set_doctor_pause',
      {
        input_pin: pin,
        input_doctor_id:
          doctorId,
        input_paused: paused,
      }
    );

  if (error) {
    return {
      error,
    };
  }

  return {
    success: true,
  };
}


// ==========================================
// HOSPITAL LOCATION
// ==========================================

export async function getHospitalLocation(
  pin
) {
  const {
    data,
    error,
  } = await supabase.rpc(
    'get_hospital_location',
    {
      input_pin: pin,
    }
  );

  if (error) {
    return null;
  }

  return data;
}


export async function updateHospitalLocation(
  pin,
  location
) {
  const { error } =
    await supabase.rpc(
      'update_hospital_location',
      {
        input_pin: pin,
        input_location:
          location,
      }
    );

  if (error) {
    return {
      error,
    };
  }

  return {
    success: true,
  };
}


// ==========================================
// CANCEL APPOINTMENT
// ==========================================

export async function cancelAppointment(
  appointmentId
) {
  const { error } =
    await supabase.rpc(
      'cancel_any_appointment',
      {
        appointment_id:
          appointmentId,
      }
    );

  if (error) {
    console.error(
      'Error cancelling appointment:',
      error
    );

    return {
      error,
    };
  }

  return {
    success: true,
  };
}


// ==========================================
// MY BOOKINGS
// ==========================================

export async function getMyBookings(
  patientUserId
) {
  const {
    data: patient,
    error: patientError,
  } = await supabase
    .from('patients')
    .select('id')
    .eq(
      'user_id',
      patientUserId
    )
    .single();

  if (patientError || !patient) {
    return [];
  }

  const {
    data: appointments,
    error,
  } = await supabase
    .from('appointments')
    .select(`
      id,
      queue_number,
      status,
      created_at,
      booked_at,
      doctor_id,
      hospital_id,
      booking_code,
      payment_method,
      transaction_id,
      payment_screenshot_url,
      contact_phone
    `)
    .eq(
      'patient_id',
      patient.id
    )
    .order(
      'booked_at',
      {
        ascending: false,
      }
    )
    .limit(20);

  if (error || !appointments) {
    console.error(
      'Error fetching bookings:',
      error
    );

    return [];
  }

  const enriched =
    await Promise.all(
      appointments.map(
        async (appointment) => {
          const {
            data: doctor,
          } = await supabase
            .from('doctors')
            .select(`
              name,
              specialty,
              consultation_fee
            `)
            .eq(
              'id',
              appointment.doctor_id
            )
            .single();

          const {
            data: hospital,
          } = await supabase
            .from('hospitals')
            .select(`
              name,
              location,
              city,
              google_maps_url
            `)
            .eq(
              'id',
              appointment.hospital_id
            )
            .single();

          return {
            ...appointment,
            doctor,
            hospital,
          };
        }
      )
    );

  return enriched;
}
