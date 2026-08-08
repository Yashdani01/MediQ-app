import { useState } from 'react';
import { supabase } from '../supabaseClient';
import './Login.css';

export default function Login({ onGuestContinue }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div className="login-page">
      <div className="login-bg-shape shape-1" />
      <div className="login-bg-shape shape-2" />

      <div className="login-card">
        <div className="login-logo"><span className="login-logo-icon">✛</span></div>
        <h1 className="login-title">MediQ</h1>

        {!sent ? (
          <>
            <p className="login-subtitle">
              Sign in to book queues and track live doctor timings
            </p>

            <form onSubmit={sendMagicLink} className="login-form">
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
        ) : (
          <>
            <p className="login-subtitle">
              We sent a sign-in link to <strong>{email}</strong>. Open your inbox and tap the link to continue.
            </p>
            <button className="login-link-btn" onClick={() => setSent(false)}>
              ← Use a different email
            </button>
          </>
        )}

        {error && <p className="login-error">{error}</p>}
        <p className="login-footer">By continuing, you agree to MediQ's Terms & Privacy Policy</p>
      </div>
    </div>
  );
}