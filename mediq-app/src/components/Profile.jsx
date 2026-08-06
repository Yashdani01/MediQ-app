import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

// No patient login yet, so we look up the one seeded demo patient by code.
// Once Supabase Auth is added, replace this with the signed-in user's id.
const DEMO_PATIENT_CODE = 'MDQ-2291'

export default function Profile({ t }) {
  const [patient, setPatient] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadProfile() {
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('patient_code', DEMO_PATIENT_CODE)
        .single()

      if (patientError) {
        setError(patientError.message)
        setLoading(false)
        return
      }
      setPatient(patientData)

      const { data: appointments, error: apptError } = await supabase
        .from('appointments')
        .select('appointment_time, created_at, doctors (name)')
        .eq('patient_id', patientData.id)
        .order('created_at', { ascending: false })

      if (apptError) {
        setError(apptError.message)
      } else {
        setHistory(appointments)
      }
      setLoading(false)
    }

    loadProfile()
  }, [])

  return (
    <section>
      <div className="profile-head">
        <div className="avatar">{patient?.name?.[0] ?? '?'}</div>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            {loading ? 'Loading…' : patient?.name}
          </h1>
          <p className="page-sub" style={{ margin: 0 }}>
            Patient ID · {patient?.patient_code}
          </p>
        </div>
      </div>

      <div className="section-label">{t.lbl_history}</div>

      {error && <p className="page-sub">Couldn't load history: {error}</p>}
      {!loading && !error && history.length === 0 && (
        <p className="page-sub">No appointments yet.</p>
      )}

      {history.length > 0 && (
        <div className="card">
          {history.map((h, i) => (
            <div className="history-row" key={i}>
              <span>{h.doctors?.name ?? 'Doctor'}</span>
              <span>
                {new Date(h.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </span>
            </div>
          ))}
        </div>
      )}

      <button className="ghost-btn">{t.btn_signout}</button>
    </section>
  )
}
