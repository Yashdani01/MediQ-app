import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './Reports.css';

export default function Reports({ user, lang }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // State for category selection modal when a file is chosen
  const [pendingFile, setPendingFile] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Prescriptions');

  useEffect(() => {
    fetchReports();
  }, [user]);

  async function fetchReports() {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patient_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setReports(data);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  }

  // Triggered when user selects a file from their device
  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file); // Open category selection modal
  }

  // Finalize upload with the chosen category
  async function confirmUpload() {
    if (!pendingFile || !user) return;

    try {
      setUploading(true);
      const fileName = `${user.id}/${Date.now()}_${pendingFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('medical-reports')
        .upload(fileName, pendingFile);

      if (uploadError) {
        alert('Error uploading file. Please try again.');
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('medical-reports')
        .getPublicUrl(fileName);

      await supabase.from('patient_reports').insert({
        user_id: user.id,
        file_name: pendingFile.name,
        file_url: publicUrlData.publicUrl,
        category: selectedCategory, // Saved with user's explicit choice
      });

      alert('Record uploaded successfully!');
      setPendingFile(null);
      fetchReports();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Something went wrong during upload.');
    } finally {
      setUploading(false);
    }
  }

  // Accurate Category Counters
  const prescriptionsCount = reports.filter(r => r.category === 'Prescriptions').length;
  const labReportsCount = reports.filter(r => r.category === 'Lab Reports').length;
  const medicalDocsCount = reports.filter(r => r.category === 'Medical Documents').length;

  return (
    <div className="reports-page-container">
      
      {/* 🌟 1. MY HEALTH VAULT HERO BANNER (SINGLE, CLEAN UPLOAD BUTTON) */}
      <div className="vault-banner">
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '65%' }}>
          <h1>My Health Vault</h1>
          <p>Secure repository for prescriptions & reports</p>

          <label className="vault-upload-btn">
            <span>+</span> {uploading ? 'Processing...' : 'Upload Record'}
            <input type="file" onChange={handleFileSelect} style={{ display: 'none' }} disabled={uploading} />
          </label>
        </div>

        <div className="vault-banner-accent">📁</div>
      </div>

      {/* 📊 2. OVERVIEW STATS CARDS */}
      <div style={{ marginBottom: '24px' }}>
        <h3 className="vault-overview-title">Overview</h3>
        
        <div className="vault-stats-grid">
          <div className="vault-stat-card">
            <div className="vault-stat-icon">📄</div>
            <div className="vault-stat-label">Prescriptions</div>
            <div className="vault-stat-value">{prescriptionsCount}</div>
            <div className="vault-stat-unit">records</div>
          </div>

          <div className="vault-stat-card">
            <div className="vault-stat-icon">🧪</div>
            <div className="vault-stat-label">Lab Reports</div>
            <div className="vault-stat-value">{labReportsCount}</div>
            <div className="vault-stat-unit">records</div>
          </div>

          <div className="vault-stat-card">
            <div className="vault-stat-icon">📋</div>
            <div className="vault-stat-label">Medical Documents</div>
            <div className="vault-stat-value">{medicalDocsCount}</div>
            <div className="vault-stat-unit">records</div>
          </div>
        </div>
      </div>

      {/* 📁 3. CONTENT AREA OR EMPTY STATE */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading records...</div>
      ) : reports.length === 0 ? (
        <div className="vault-empty-card">
          <div className="vault-empty-icon">🗂️</div>
          <h3>Your health vault is empty</h3>
          <p>Keep your prescriptions, test reports and medical documents safely in one place.</p>

          <label className="vault-empty-upload-btn">
            <span>⬆️</span> Upload your first record
            <input type="file" onChange={handleFileSelect} style={{ display: 'none' }} disabled={uploading} />
          </label>
        </div>
      ) : (
        <div className="vault-reports-list">
          {reports.map((rep) => (
            <div key={rep.id} className="vault-report-item">
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', background: '#e6f4ea', color: '#0b332c', padding: '2px 8px', borderRadius: '6px', fontWeight: '700', marginBottom: '4px', display: 'inline-block' }}>
                  {rep.category || 'Medical Document'}
                </span>
                <strong className="vault-report-name">{rep.file_name}</strong>
                <span className="vault-report-date">Added on {new Date(rep.created_at).toLocaleDateString()}</span>
              </div>
              <a href={rep.file_url} target="_blank" rel="noopener noreferrer" className="vault-report-link">
                View File ↗
              </a>
            </div>
          ))}
        </div>
      )}

      {/* 🛡️ 4. SECURITY TRUST FOOTER */}
      <div className="vault-security-footer">
        <div className="vault-security-content">
          <span className="vault-security-icon">🔒</span>
          <div>
            <h4>Your data is safe & secure</h4>
            <p>We use industry-leading security to keep your health records protected and private.</p>
          </div>
        </div>
        <span className="vault-security-badge">✓</span>
      </div>

      {/* 🏷️ CATEGORY SELECTION POPUP MODAL (Ensures accurate classification) */}
      {pendingFile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            background: '#fff', borderRadius: '24px', padding: '24px',
            width: '100%', maxWidth: '380px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', color: '#0b332c', margin: '0 0 6px' }}>
              Categorize Document
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 16px', wordBreak: 'break-all' }}>
              File: <strong>{pendingFile.name}</strong>
            </p>

            <label style={{ fontSize: '12px', fontWeight: '700', color: '#0b332c', display: 'block', marginBottom: '8px' }}>
              Select Record Type:
            </label>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {['Prescriptions', 'Lab Reports', 'Medical Documents'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '12px 14px', borderRadius: '12px', textAlign: 'left',
                    border: selectedCategory === cat ? '2px solid #0b332c' : '1px solid #e2e8f0',
                    background: selectedCategory === cat ? '#f0fdf4' : '#fff',
                    color: '#0b332c', fontWeight: '600', fontSize: '13.5px', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <span>{cat === 'Prescriptions' ? '📄 Prescriptions' : cat === 'Lab Reports' ? '🧪 Lab Reports' : '📋 Medical Documents'}</span>
                  {selectedCategory === cat && <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setPendingFile(null)}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: '700', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmUpload}
                disabled={uploading}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#0b332c', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
              >
                {uploading ? 'Saving...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
