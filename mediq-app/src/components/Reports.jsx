import { useState, useEffect } from 'react';
import { getPatientReports } from '../hospitalData';
import './Reports.css';

export default function Reports({ user }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getPatientReports(user.id).then((data) => {
      setReports(data);
      setLoading(false);
    });
  }, [user]);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  const openReport = (report) => {
    if (report.file_url) window.open(report.file_url, '_blank');
  };

  return (
    <div className="reports-page">
      <div className="reports-topbar">
        <div className="reports-topbar-inner">
          <h3 className="reports-title">📄 My Reports</h3>
          <p className="reports-subtitle">Your test results and medical reports</p>
        </div>
      </div>

      <div className="reports-content">
        {loading ? (
          <p className="reports-empty">Loading reports...</p>
        ) : !user ? (
          <div className="reports-empty">
            <div className="reports-empty-icon">🔒</div>
            <h3 style={{ color: '#0f172a', margin: '0 0 6px' }}>Sign in to view reports</h3>
            <p style={{ margin: 0 }}>Your medical reports will appear here once you're signed in.</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="reports-empty">
            <div className="reports-empty-icon">📄</div>
            <h3 style={{ color: '#0f172a', margin: '0 0 6px' }}>No reports yet</h3>
            <p style={{ margin: 0 }}>Your test results and reports will show up here once available.</p>
          </div>
        ) : (
          <div className="reports-list">
            {reports.map((r) => (
              <div key={r.id} className="report-card" onClick={() => openReport(r)}>
                <div className="report-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div className="report-info">
                  <h4>{r.name}</h4>
                  <p>{formatDate(r.uploaded_at)}</p>
                  {r.report_type && <span className="report-type-badge">{r.report_type}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}