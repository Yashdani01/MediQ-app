import { useState } from 'react'
import { i18n } from './i18n.js'
import { supabase } from './supabaseClient.js'
import TopBar from './components/TopBar.jsx'
import TabBar from './components/TabBar.jsx'
import Home from './components/Home.jsx'
import Book from './components/Book.jsx'
import Ticket from './components/Ticket.jsx'
import Reports from './components/Reports.jsx'
import Profile from './components/Profile.jsx'

export default function App() {
  const [lang, setLang] = useState('en')
  const [screen, setScreen] = useState('home')
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [booking, setBooking] = useState(null)

  const t = i18n[lang]

  function handleSelectDoctor(doctor) {
    setSelectedDoctor(doctor)
    setScreen('book')
  }

  async function handleConfirmBooking(doctor, time) {
    const tokenNumber = 'B-' + (10 + Math.floor(Math.random() * 20))

    const { data: patient } = await supabase
      .from('patients')
      .select('id')
      .eq('patient_code', 'MDQ-2291')
      .single()

    const { error } = await supabase.from('appointments').insert({
      doctor_id: doctor.id,
      patient_id: patient?.id ?? null,
      token_number: tokenNumber,
      appointment_time: time,
      status: 'booked'
    })

    if (error) {
      console.error('Booking failed to save:', error.message)
      // Still show the ticket locally so the demo flow isn't blocked —
      // once Supabase is fully wired up you may want to show an error instead.
    }

    setBooking({
      doctor,
      time,
      tokenNumber,
      waitMinutes: doctor.wait_minutes ?? 15,
      ahead: doctor.patients_ahead ?? 0
    })
    setScreen('ticket')
  }

  return (
    <div className="device">
      <TopBar lang={lang} setLang={setLang} />

      <main>
        {screen === 'home' && <Home t={t} onSelectDoctor={handleSelectDoctor} />}
        {screen === 'book' && (
          <Book t={t} selectedDoctor={selectedDoctor} onConfirm={handleConfirmBooking} />
        )}
        {screen === 'ticket' && (
          <Ticket t={t} booking={booking} onDone={() => setScreen('home')} />
        )}
        {screen === 'reports' && <Reports t={t} />}
        {screen === 'profile' && <Profile t={t} />}
      </main>

      <TabBar screen={screen} setScreen={setScreen} t={t} />
    </div>
  )
}
