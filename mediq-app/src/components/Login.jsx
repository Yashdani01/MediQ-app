import { useState } from 'react';
import { supabase } from '../supabaseClient';
import './Login.css';

export default function Login({ onGuestContinue }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    setLoading(false);
    if (error) setError(error.message);
    else setStep('otp');
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
    setLoading(false);
    if (error) setError(error.message);
  };

  return (
    <div className="login-page">
      <div className="login-bg-shape shape-1" />
      <div className="login-bg-shape shape-2" />

      <div className="login-card">
        <div className="login-logo"><span className="login-logo-icon">✛</span></div>
        <h1 className="login-title">MediQ</h1>
        <p className="login-subtitle">
          {step === 'email'
            ? 'Sign in to book queues and track live doctor timings'
            : `Enter the code sent to ${email}`}
        </p>

        {step === 'email' && (
          <>
            <form onSubmit={sendOtp} className="login-form">
              <div className="input-group">
                <input
                  id="email" type="email" className="login-input" placeholder=" "
                  value={email} onChange={(e) => setEmail(e.target.value)} required
                />
                <label htmlFor="email" className="input-label">Email address</label>
              </div>
              <button type="submit" className="login-btn" disabled={loading || !email}>
                {loading ? <span className="spinner" /> : 'Continue with Email'}
              </button>
            </form>

            <button className="guest-btn" onClick={onGuestContinue}>
              Continue as Guest →
            </button>
          </>
        )}

        {step === 'otp' && (
          <form onSubmit={verifyOtp} className="login-form">
            <div className="input-group">
              <input
                id="otp" type="text" inputMode="numeric" maxLength={6}
                className="login-input otp-input" placeholder=" "
                value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required autoFocus
              />
              <label htmlFor="otp" className="input-label">6-digit code</label>
            </div>
            <button type="submit" className="login-btn" disabled={loading || otp.length < 6}>
              {loading ? <span className="spinner" /> : 'Verify & Continue'}
            </button>
            <button type="button" className="login-link-btn" onClick={() => { setStep('email'); setOtp(''); setError(''); }}>
              ← Use a different email
            </button>
          </form>
        )}

        {error && <p className="login-error">{error}</p>}
        <p className="login-footer">By continuing, you agree to MediQ's Terms & Privacy Policy</p>
      </div>
    </div>
  );
}