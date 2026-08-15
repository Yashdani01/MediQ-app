import { useState, useEffect } from 'react';
import { getPatientReports, uploadPatientReport } from '../hospitalData';
import './Reports.css';

export default function Reports({ user }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form states for uploading
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState('Prescription');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadReports();
  }, [user]);

  const loadReports = async () => {
    setLoading(true);
    const data = await getPatientReports(user.id);
    setReports(data || []);
    setLoading(false);
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  const openReport = (report) => {
    if (report.file_url) window.open(report.file_url, '_blank');
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!docName.trim() || !fileToUpload) {
      setUploadError('Please provide a record name and select a file.');
      return;
    }
    setUploading(true);
    setUploadError('');

    const { error } = await uploadPatientReport(user.id, docName.trim(), docCategory, fileToUpload);
    setUploading(false);

    if (error) {
      setUploadError('Failed to upload record. Please try again.');
      return;
    }

    // Reset and reload
    setDocName('');
    setDocCategory('Prescription');
    setFileToUpload(null);
    setShowUploadModal(false);
    loadReports();
  };

  const filteredReports = reports.filter((r) => {
    if (activeCategory === 'All') return true;
    return r.report_type === activeCategory;
  });

  return (
    <div className="reports-page">
      <div className="reports-topbar">
        <div className="reports-topbar-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="reports-title">My Health Vault</h3>
              <p className="reports-subtitle">Secure repository for prescriptions & reports</p>
            </div>
            {user && (
              <button className="upload-trigger-btn" onClick={() => setShowUploadModal(true)}>
                + Upload Record
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="reports-content">
        {user && reports.length > 0 && (
          <div className="category-chips">
            {['All', 'Prescription', 'Lab Report', 'Scan / X-Ray Report'].map((cat) => (
              <button
                key={cat}
                className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="reports-empty">Loading records...</p>
        ) : !user ? (
          <div className="reports-empty">
            <div className="reports-empty-icon">🔒</div>
            <h3 style={{ color: 'var(--teal-900)', margin: '0 0 6px', fontFamily: 'Fraunces, serif' }}>Sign in to view Health Vault</h3>
            <p style={{ margin: 0, color: 'var(--ink-soft)' }}>Your medical records will appear here once you're signed in.</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="reports-empty">
            <div className="reports-empty-icon">📁</div>
            <h3 style={{ color: 'var(--teal-900)', margin: '0 0 6px', fontFamily: 'Fraunces, serif' }}>No records found</h3>
            <p style={{ margin: 0, color: 'var(--ink-soft)' }}>
              {activeCategory === 'All' ? "Upload your first prescription or test report using the button above." : `No records found under "${activeCategory}".`}
            </p>
          </div>
        ) : (
          <div className="reports-list">
            {filteredReports.map((r) => (
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
                <div className="report-action-hint">View →</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="ticket-overlay">
          <div className="ticket-card" style={{ background: 'var(--white)', color: 'var(--ink)' }}>
            <div className="ticket-header" style={{ borderBottom: '1px solid var(--line)', paddingBottom: '12px', marginBottom: '14px' }}>
              <h2 style={{ fontFamily: 'Fraunces, serif', color: 'var(--teal-900)', fontSize: '18px', margin: 0 }}>Upload Medical Record</h2>
            </div>

            <form onSubmit={handleUploadSubmit}>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: '4px' }}>Record Title / Description</label>
              <input
                type="text"
                placeholder="e.g. Blood Sugar Test - Dr. Jha"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--line)', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box', background: 'var(--sand-100)', color: 'var(--ink)' }}
              />

              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: '4px' }}>Category</label>
              <select
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--line)', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box', background: 'var(--sand-100)', color: 'var(--ink)' }}
              >
                <option value="Prescription">Prescription</option>
                <option value="Lab Report">Lab Report</option>
                <option value="Scan / X-Ray Report">Scan / X-Ray Report</option>
              </select>

              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: '4px' }}>Select File (PDF or Image)</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFileToUpload(e.target.files[0])}
                style={{ width: '100%', marginBottom: '16px', fontSize: '13px', color: 'var(--ink-soft)' }}
              />

              {uploadError && <p style={{ color: 'var(--coral)', fontSize: '13px', marginBottom: '12px', fontWeight: 600 }}>{uploadError}</p>}

              <button
                type="submit"
                className="primary-btn"
                disabled={uploading}
                style={{ marginBottom: '8px' }}
              >
                {uploading ? 'Uploading securely...' : 'Upload to Vault'}
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setShowUploadModal(false)}
                style={{ marginTop: 0 }}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
