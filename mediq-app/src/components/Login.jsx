import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('City Care Hospital');

  // List of medical centers / chambers
  const hospitals = [
    { id: 1, name: 'City Care Hospital', location: 'Bidhannagar, Kolkata' },
    { id: 2, name: 'Apollo Clinic', location: 'Park Circus, Kolkata' },
    { id: 3, name: 'Green View Medical Centre', location: 'Bolpur, Shantiniketan' },
    { id: 4, name: 'Darjeeling Heights Healthcare', location: 'Mall Road, Darjeeling' },
  ];

  const sendOtp = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);

    if (error) setError(error.message);
    else setOtpSent(true);
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    // Check existing patient profile
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (!existingPatient) {
      await supabase.from('patients').insert({
        user_id: data.user.id,
        email: data.user.email,
        name: email.split('@')[0],
        preferred_hospital: selectedHospital,
      });
    }

    setLoading(false);
    if (onLoginSuccess) onLoginSuccess(data.user);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
        padding: '36px 28px',
        border: '1px solid #f1f5f9'
      }}>
        {/* Header Icon & Branding */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 8px 16px rgba(37, 99, 235, 0.25)',
            color: '#ffffff',
            fontSize: '28px',
            fontWeight: 'bold'
          }}>
            ✙
          </div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '26px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.5px' }}>
            MediQ
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
            Patient Care & Live Queue Booking
          </p>
        </div>

        {!otpSent ? (
          <form onSubmit={sendOtp}>
            {/* Hospital / Clinic Selector */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                Select Healthcare Centre / Hospital
              </label>
              <select
                value={selectedHospital}
                onChange={(e) => setSelectedHospital(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  backgroundColor: '#f8fafc',
                  color: '#1e293b',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.name}>
                    {h.name} ({h.location})
                  </option>
                ))}
              </select>
            </div>

            {/* Email Input */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                Patient Email Address
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !email}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                opacity: loading || !email ? 0.7 : 1
              }}
            >
              {loading ? 'Sending Code...' : 'Get Login Link / OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp}>
            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                Enter Verification Code
              </label>
              <input
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '16px',
                  letterSpacing: '3px',
                  textAlign: 'center',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !otp}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
              }}
            >
              {loading ? 'Verifying...' : 'Verify & Enter App'}
            </button>

            <button
              type="button"
              onClick={() => setOtpSent(false)}
              style={{
                width: '100%',
                marginTop: '12px',
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '13px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Back to email entry
            </button>
          </form>
        )}

        {error && (
          <div style={{
            marginTop: '18px',
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            fontSize: '13px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Footer info */}
        <div style={{ marginTop: '28px', paddingTop: '18px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
            🔒 Secured with Supabase Patient Encryption
          </p>
        </div>
      </div>
    </div>
  );
}