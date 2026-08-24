import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Reports({ user }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
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

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
  }

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
        category: selectedCategory,
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

  const prescriptionsCount = reports.filter(r => r.category === 'Prescriptions').length;
  const labReportsCount = reports.filter(r => r.category === 'Lab Reports').length;
  const medicalDocsCount = reports.filter(r => r.category === 'Medical Documents').length;

  return (
    <div style={{
      width: '100%',
      maxWidth: '650px',
      margin: '0 auto',
      padding: '20px 16px 100px',
      boxSizing: 'border-box',
      backgroundColor: 'transparent'
    }}>
      
      {/* 🌟 1. MY HEALTH VAULT HERO BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #0b332c 0%, #134e44 100%)',
        borderRadius: '24px',
        padding: '24px',
        color: '#fff',
        marginBottom: '20px',
        boxShadow: '0 10px 25px rgba(11, 51, 44, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '65%' }}>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '22px', margin: '0 0 6px', color: '#fff' }}>
            My Health Vault
          </h1>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', margin: '0 0 16px', lineHeight: '1.4' }}>
            Secure repository for prescriptions & reports
          </p>

          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#d4af37', color: '#0b332c',
            padding: '10px 18px', borderRadius: '12px', fontSize: '13px',
            fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(212, 175, 55, 0.25)',
            border: 'none'
          }}>
            <span>+</span> {uploading ? 'Processing...' : 'Upload Record'}
            <input type="file" onChange={handleFileSelect} style={{ display: 'none' }} disabled={uploading} />
          </label>
        </div>

        {/* Folder Illustration Watermark Accent */}
        <div style={{
          position: 'absolute', right: '-10px', bottom: '-15px', fontSize: '75px',
          opacity: 0.25, transform: 'rotate(-10deg)', pointerEvents: 'none'
        }}>
          📁
        </div>
      </div>

      {/* 📊 2. OVERVIEW STATS CARDS */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', color: '#0b332c', margin: '0 0 12px' }}>
          Overview
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          
          {/* Prescriptions */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '16px 12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '36px', height: '36px', background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', color: '#10b981', fontSize: '16px' }}>
              📄
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>Prescriptions</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0b332c' }}>{prescriptionsCount}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>records</div>
          </div>

          {/* Lab Reports */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '16px 12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '36px', height: '36px', background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', color: '#10b981', fontSize: '16px' }}>
              🧪
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>Lab Reports</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0b332c' }}>{labReportsCount}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>records</div>
          </div>

          {/* Medical Documents */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '16px 12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '36px', height: '36px', background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', color: '#10b981', fontSize: '16px' }}>
              📋
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>Medical Documents</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#0b332c' }}>{medicalDocsCount}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>records</div>
          </div>

        </div>
      </div>

      {/* 📁 3. CONTENT AREA OR EMPTY STATE */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading records...</div>
      ) : reports.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px',
          padding: '40px 20px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '50px', marginBottom: '12px' }}>
            🗂️
          </div>
          <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', color: '#0b332c', margin: '0 0 6px' }}>
            Your health vault is empty
          </h3>
          <p style={{ fontSize: '12.5px', color: '#64748b', maxWidth: '320px', margin: '0 auto 20px', lineHeight: '1.5' }}>
            Keep your prescriptions, test reports and medical documents safely in one place.
          </p>

          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#e6f4ea', color: '#0b332c', border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '12px 20px', borderRadius: '14px', fontSize: '13.5px',
            fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)'
          }}>
            <span>⬆️</span> Upload your first record
            <input type="file" onChange={handleFileSelect} style={{ display: 'none' }} disabled={uploading} />
          </label>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {reports.map((rep) => (
            <div key={rep.id} style={{
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px',
              padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', background: '#e6f4ea', color: '#0b332c', padding: '2px 8px', borderRadius: '6px', fontWeight: '700', marginBottom: '4px', display: 'inline-block' }}>
                  {rep.category || 'Medical Document'}
                </span>
                <strong style={{ fontSize: '14px', color: '#0b332c', display: 'block', marginBottom: '2px' }}>{rep.file_name}</strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Added on {new Date(rep.created_at).toLocaleDateString()}</span>
              </div>
              <a href={rep.file_url} target="_blank" rel="noopener noreferrer" style={{ background: '#f8f6f0', color: '#0b332c', padding: '8px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', textDecoration: 'none', border: '1px solid #e2e8f0' }}>
                View File ↗
              </a>
            </div>
          ))}
        </div>
      )}

      {/* 🔒 4. SECURITY TRUST FOOTER */}
      <div style={{
        background: '#e6f4ea', border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🔒</span>
          <div>
            <h4 style={{ fontFamily: 'Fraunces, serif', fontSize: '14px', color: '#0b332c', margin: '0 0 2px' }}>
              Your data is safe & secure
            </h4>
            <p style={{ fontSize: '11.5px', color: '#475569', margin: 0 }}>
              We use industry-leading security to keep your health records protected and private.
            </p>
          </div>
        </div>
        <span style={{ fontSize: '14px', color: '#10b981', background: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', fontWeight: 'bold' }}>✓</span>
      </div>

      {/* 🏷️ CATEGORY SELECTION POPUP MODAL */}
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
