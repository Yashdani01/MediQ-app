import { useState } from 'react';
import { supabase } from '../supabaseClient';
import './Login.css';

export default function Login({ onLoginSuccess, onContinueAsGuest }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setLoading(false);
      setError(authError.message || 'Invalid email or password.');
      return;
    }

    setLoading(false);
    if (data?.user) {
      onLoginSuccess(data.user, data.user.email);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Brand Header */}
        <div className="login-brand">
          <div className="login-logo-icon">🏥</div>
          <h2>MediQ</h2>
          <p>Instant Healthcare & Queue Management</p>
        </div>

        {/* Gmail / Email Login Form */}
        <form onSubmit={handleEmailLogin} className="login-form">
          <div className="input-group">
            <label>Email Address</label>
            <div className="phone-input-wrap" style={{ paddingLeft: '14px' }}>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: 0 }}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="phone-input-wrap" style={{ paddingLeft: '14px' }}>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: 0 }}
              />
            </div>
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: 12, fontWeight: 700, margin: '2px 0 0', textAlign: 'left' }}>{error}</p>}

          <button type="submit" className="login-primary-btn" disabled={loading} style={{ marginTop: '6px' }}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        {/* Divider */}
        <div className="login-divider">
          <span>or</span>
        </div>

        {/* Guest Action with Working Redirect */}
        <button className="login-guest-btn" onClick={onContinueAsGuest}>
          Browse as Guest
        </button>

        {/* Security Footer Note */}
        <div className="login-footer-badge">
          <span>🔒 Verified Hospitals & Secure Booking</span>
        </div>
      </div>
    </div>
  );
}
