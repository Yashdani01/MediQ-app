import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

// No patient login yet, so we look up the one seeded demo patient by code.
// Once Supabase Auth is added, replace this with the signed-in user's id.
const DEMO_PATIENT_CODE = 'MDQ-2291'

export default function Reports({ t }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadReports() {
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('patient_code', DEMO_PATIENT_CODE)
        .single()

      if (patientError) {
        setError(patientError.message)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('patient_id', patient.id)
        .order('uploaded_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setReports(data)
      }
      setLoading(false)
    }

    loadReports()
  }, [])

  return (
    <section>
      <h1 className="page-title">{t.reports_title}</h1>
      <p className="page-sub">{t.reports_sub}</p>

      <div className="upload-zone">
        <b>{t.upload_b}</b>
        <span>{t.upload_sub}</span>
      </div>

      <div className="section-label">{t.lbl_uploaded}</div>

      {loading && <p className="page-sub">Loading reports…</p>}
      {error && <p className="page-sub">Couldn't load reports: {error}</p>}
      {!loading && !error && reports.length === 0 && (
        <p className="page-sub">No reports uploaded yet.</p>
      )}

      {reports.length > 0 && (
        <div className="card">
          {reports.map(r => (
            <div className="report-row" key={r.id}>
              <div>
                <div className="report-name">{r.name}</div>
                <div className="report-date">
                  {new Date(r.uploaded_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </div>
              </div>
              <span className="tag">{r.report_type}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
