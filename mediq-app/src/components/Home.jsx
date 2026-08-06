import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

export default function Home({ t, onSelectDoctor }) {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadDoctors() {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('wait_minutes', { ascending: true })

      if (error) {
        setError(error.message)
      } else {
        setDoctors(data)
      }
      setLoading(false)
    }

    loadDoctors()
  }, [])

  return (
    <section>
      <h1 className="page-title">{t.home_title}</h1>
      <p className="page-sub">{t.home_sub}</p>

      <div className="section-label">{t.lbl_nearby}</div>

      {loading && <p className="page-sub">Loading doctors…</p>}
      {error && <p className="page-sub">Couldn't load doctors: {error}</p>}

      {doctors.map(doc => (
        <div
          key={doc.id}
          className="card doctor-row"
          onClick={() => onSelectDoctor(doc)}
        >
          <div>
            <p className="doctor-name">{doc.name}</p>
            <p className="doctor-meta">{doc.specialty} · {doc.clinic}</p>
          </div>
          <span className={`wait-pill ${doc.wait_minutes > 20 ? 'busy' : ''}`}>
            {doc.wait_minutes} min wait
          </span>
        </div>
      ))}
    </section>
  )
}
