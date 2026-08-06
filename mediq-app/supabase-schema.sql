-- MediQ database schema
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)

create table doctors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  specialty text not null,
  clinic text not null,
  wait_minutes int not null default 0,
  patients_ahead int not null default 0,
  created_at timestamptz default now()
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid references doctors(id) on delete cascade,
  patient_id uuid,
  token_number text not null,
  appointment_time text not null,
  status text not null default 'booked',
  created_at timestamptz default now()
);

create table patients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  patient_code text unique not null,
  created_at timestamptz default now()
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  name text not null,
  report_type text not null,
  file_url text,
  uploaded_at timestamptz default now()
);

-- Row Level Security: start permissive for development.
-- Tighten these before real patient data goes in.
alter table doctors enable row level security;
alter table appointments enable row level security;
alter table patients enable row level security;
alter table reports enable row level security;

create policy "Public read access" on doctors for select using (true);
create policy "Public read access" on appointments for select using (true);
create policy "Public insert access" on appointments for insert with check (true);
create policy "Public read access" on patients for select using (true);
create policy "Public read access" on reports for select using (true);

-- Seed data matching the app's current dummy data
insert into doctors (name, specialty, clinic, wait_minutes, patients_ahead) values
  ('Dr. A. Sen', 'General Physician', 'Bardhaman Clinic', 12, 3),
  ('Dr. R. Khatun', 'Pediatrician', 'Care Point Hospital', 35, 8),
  ('Dr. S. Mondal', 'Dermatologist', 'Bardhaman Clinic', 5, 1);

insert into patients (name, patient_code) values
  ('Priya Das', 'MDQ-2291');

-- Seed report data for the demo patient (run separately if patients already exist)
insert into reports (patient_id, name, report_type)
select id, 'Blood test — CBC', 'Lab' from patients where patient_code = 'MDQ-2291'
union all
select id, 'Chest X-ray', 'Imaging' from patients where patient_code = 'MDQ-2291'
union all
select id, 'Prescription — Dr. Sen', 'Rx' from patients where patient_code = 'MDQ-2291';
