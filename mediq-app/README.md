# MediQ — patient app (React + Vite + Supabase)

A React port of the patient app prototype: home/doctor list, booking flow,
booking confirmation ("ticket"), report uploads, and profile — with
English/Bengali/Hindi switching.

The **Home** screen and **booking confirmation** are now wired to Supabase.
`Reports.jsx` and `Profile.jsx` still use dummy data in `src/i18n.js` —
connect those the same way once Home is working.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create your Supabase project

Go to [supabase.com](https://supabase.com), create a project, then open
**SQL Editor** and run everything in `supabase-schema.sql` (included in this
folder). That creates the `doctors`, `appointments`, `patients`, and
`reports` tables, with a few seed rows so the app has something to show.

### 3. Add your keys

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then fill in the two values from **Project Settings > API** in your
Supabase dashboard:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

`.env` is already in `.gitignore` — never commit it.

### 4. Run it

```bash
npm run dev
```

Open the local URL it prints. The home screen should now show the three
seeded doctors pulled live from your Supabase database, and booking one
writes a real row into your `appointments` table.

## Project structure

```
supabase-schema.sql    run this in Supabase's SQL editor
src/
  supabaseClient.js     Supabase connection, reads from .env
  App.jsx                screen state + navigation + booking insert
  i18n.js                translations + remaining dummy data (reports, history)
  index.css              design tokens and all styling
  components/
    TopBar.jsx            brand + language switcher
    TabBar.jsx             bottom navigation
    Home.jsx                 doctor list — now fetches from Supabase
    Book.jsx                  doctor + slot selection
    Ticket.jsx                  booking confirmation
    Reports.jsx                  report upload + list (still dummy data)
    Profile.jsx                   patient info + history (still dummy data)
```

## Next steps

- **Connect Reports.jsx and Profile.jsx** the same way `Home.jsx` was done:
  a `useEffect` + `supabase.from('reports').select()` / `.from('patients')`.
- **Tighten Row Level Security.** The schema currently allows public read
  access to everything so you can get moving — before real patient data
  goes in, add policies scoped to the logged-in patient (Supabase Auth).
- **Add patient login** via Supabase Auth so `Profile.jsx` shows the actual
  signed-in patient instead of a hardcoded one.

## Deploying for free

Push this to a GitHub repo, then connect it to Vercel, Netlify, or
Cloudflare Pages. Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
as environment variables in that platform's dashboard (not in the repo).
