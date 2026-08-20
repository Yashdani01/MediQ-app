// src/hospitalData.js
import { supabase } from './supabaseClient';

/* =========================================================
   HOSPITALS
========================================================= */

export async function getHospitals(city = '') {
  let query = supabase
    .from('hospitals')
    .select('id, name, location, city, google_maps_url')
    .order('name', { ascending: true });

  // If a city is selected, filter hospitals by city
  if (city && city.trim() !== '') {
    query = query.ilike('city', city.trim());
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching hospitals:', error);
    return [];
  }

  console.log('Current city:', city);
  console.log('Hospitals fetched:', data);

  return data || [];
}


/* =========================================================
   GET ALL CITIES
========================================================= */

export async function getAllCities() {
  const { data, error } = await supabase
    .from('hospitals')
    .select('city')
    .not('city', 'is', null);

  if (error) {
    console.error('Error fetching cities:', error);
    return [];
  }

  // Clean empty values and remove duplicates
  const cities = [
    ...new Set(
      (data || [])
        .map((hospital) => hospital.city?.trim())
        .filter((city) => city && city.length > 0)
    ),
  ];

  // Sort cities alphabetically
  cities.sort((a, b) => a.localeCompare(b));

  console.log('Cities fetched:', cities);

  return cities;
}


/* =========================================================
   DOCTORS FOR HOSPITAL
========================================================= */

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
      custom_schedule
    `)
    .eq('hospital_id', hospitalId);

  if (error) {
    console.error('Error fetching doctors:', error);
    return [];
  }

  return data || [];
}


/* =========================================================
   WAITING COUNT
========================================================= */

export async function getWaitingCount(doctorId) {
  const { data, error } = await supabase
    .rpc('get_waiting_count', {
      doc_id: doctorId,
    });

  if (error) {
    console.error(
      'Error counting queue:',
      error
    );

    return 0;
  }

  return data || 0;
}


/* =========================================================
   AVAILABLE DOCTOR COUNTS
========================================================= */

const DAY_ABBR_COUNT = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
];

function isAvailableToday(doc) {
  const today =
    DAY_ABBR_COUNT[new Date().getDay()];

  const worksToday =
    !doc.working_days ||
    doc.working_days.length === 0 ||
    doc.working_days.includes(today);

  const notBlocked =
    doc.status !== 'completed' &&
    doc.status !== 'on_leave';

  return worksToday && notBlocked;
}

export async function getAvailableDoctorCounts(
  hospitalIds
) {
  if (
    !hospitalIds ||
    hospitalIds.length === 0
  ) {
    return {};
  }

  const { data, error } = await supabase
    .from('doctors')
    .select(
      'hospital_id, status, working_days'
    )
    .in(
      'hospital_id',
      hospitalIds
    );

  if (error) {
    console.error(
      'Error fetching doctor counts:',
      error
    );

    return {};
  }

  const counts = {};

  (data || []).forEach((doc) => {
    if (isAvailableToday(doc)) {
      counts[doc.hospital_id] =
        (counts[doc.hospital_id] || 0) + 1;
    }
  });

  return counts;
}


/* =========================================================
   SEARCH DOCTORS
========================================================= */

export async function searchDoctors(
  city = '',
  searchTerm = ''
) {
  let hospitalQuery = supabase
    .from('hospitals')
    .select(
      'id, name, location, city, google_maps_url'
    );

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
    console.error(
      'Hospital search error:',
      hospitalError
    );

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
    lowerTerm.includes('cardiologist')
  ) {
    refinedTerm = 'Cardiologist';

  } else if (
    lowerTerm.includes('sugar') ||
    lowerTerm.includes('diabetes')
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
      delay_minutes,
      working_days,
      start_time,
      end_time
    `)
    .in(
      'hospital_id',
      hospitalIds
    );

  if (refinedTerm) {
    doctorQuery =
      doctorQuery.or(
        `name.ilike.%${refinedTerm}%,specialty.ilike.%${refinedTerm}%`
      );
  }

  const {
    data: doctors,
    error: doctorError,
  } = await doctorQuery;

  if (doctorError || !doctors) {
    console.error(
      'Doctor search error:',
      doctorError
    );

    return [];
  }

  const results =
    await Promise.all(
      doctors.map(
        async (doc) => ({
          ...doc,

          liveQueue:
            await getWaitingCount(
              doc.id
            ),

          hospital:
            hospitalMap[
              doc.hospital_id
            ],
        })
      )
    );

  return results;
}


/* =========================================================
   GET ALL SPECIALTIES
========================================================= */

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
            doctor.specialty?.trim()
        )
        .filter(Boolean)
    ),
  ].sort(
    (a, b) =>
      a.localeCompare(b)
  );
}
