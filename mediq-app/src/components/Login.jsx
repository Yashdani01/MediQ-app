import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      });
    }

    setLoading(false);
    if (onLoginSuccess) onLoginSuccess(data.user);
  };

  return (
    <div style={{ maxWidth: '380px', margin: '50px auto', padding: '24px', border: '1px solid #e2e8f0', borderRadius: '12px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2>MediQ Patient Login</h2>
      <p style={{ color: '#64748b', fontSize: '14px' }}>
        {!otpSent ? 'Enter your email to get a login OTP' : 'Check your email inbox for the 6-digit code'}
      </p>

      {!otpSent ? (
        <form onSubmit={sendOtp}>
          <input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
            required
          />
          <button
            type="submit"
            disabled={loading || !email}
            style={{ width: '100%', padding: '10px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {loading ? 'Sending Code...' : 'Send OTP Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp}>
          <input
            type="text"
            placeholder="Enter 6-digit OTP code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center', boxSizing: 'border-box' }}
            required
          />
          <button
            type="submit"
            disabled={loading || !otp}
            style={{ width: '100%', padding: '10px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </form>
      )}

      {error && <p style={{ color: '#ef4444', marginTop: '12px', fontSize: '13px' }}>{error}</p>}
    </div>
  );
}