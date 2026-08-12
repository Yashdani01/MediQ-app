import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { translations, languages } from '../i18n';
import { getAllCities } from '../hospitalData';
import './Login.css';

export default function Login({ onGuestContinue }) {
  const [mode, setMode] = useState('register');
  const [lang, setLang] = useState('en');
  const [name, setName] = useState(() => sessionStorage.getItem('mediq_name') || '');
  const [city, setCity] = useState(() => sessionStorage.getItem('mediq_city') || '');
  const [cities, setCities] = useState([]);
  const [email, setEmail] = useState(() => sessionStorage.getItem('mediq_email') || '');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    getAllCities().then(setCities);
  }, []);

  useEffect(() => { sessionStorage.setItem('mediq_name', name); }, [name]);
  useEffect(() => { sessionStorage.setItem('mediq_city', city); }, [city]);
  useEffect(() => { sessionStorage.setItem('mediq_email', email); }, [email]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSent(false);
  };

  const sendMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const isRegister = mode === 'register';
    const redirectUrl = isRegister
      ? `${window.location.origin}?name=${encodeURIComponent(name)}&city=${encodeURIComponent(city)}`
      : `${window.location.origin}`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: isRegister,
        emailRedirectTo: redirectUrl,
      },
    });
    setLoading(false);
    if (error) {
      if (!isRegister) {
        setError('No account found with this email. Please use Register to create one.');
      } else {
        setError(error.message);
      }
    } else {
      setSent(true);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setError('');
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });
    setVerifying(false);
    if (error) {
      setError(error.message);
    } else {
      sessionStorage.removeItem('mediq_name');
      sessionStorage.removeItem('mediq_city');
      sessionStorage.removeItem('mediq_email');
      if (mode === 'register') {
        const url = new URL(window.location.href);
        url.searchParams.set('name', name);
        url.searchParams.set('city', city);
        window.location.href = url.toString();
      } else {
        window.location.href = window.location.origin;
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-shape shape-1" />
      <div className="login-bg-shape shape-2" />

      <div className="login-card">
        <div className="lang-toggle">
          {languages.map((l) => (
            <button
              key={l.code}
              className={`lang-pill ${lang === l.code ? 'active' : ''}`}
              onClick={() => setLang(l.code)}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="login-logo"><span className="login-logo-icon">+</span></div>

        {!sent && (
          <div style={{
            display: 'flex', background: '#f0f2f5', borderRadius: 12, padding: 4, marginBottom: 20,
          }}>
            <button
              onClick={() => switchMode('register')}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 9, border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                background: mode === 'register' ? '#ffffff' : 'transparent',
                color: mode === 'register' ? '#111827' : '#6b7280',
                boxShadow: mode === 'register' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Register
            </button>
            <button
              onClick={() => switchMode('login')}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 9, border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                background: mode === 'login' ? '#ffffff' : 'transparent',
                color: mode === 'login' ? '#111827' : '#6b7280',
                boxShadow: mode === 'login' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Login
            </button>
          </div>
        )}

        <h1 className="login-title">
          {sent ? t.signInTitle : (mode === 'register' ? 'Create your account' : 'Welcome back')}
        </h1>

        {!sent ? (
          <>
            <p className="login-subtitle">
              {mode === 'register' ? t.signInSubtitle : 'Enter your registered email to continue'}
            </p>

            <form onSubmit={sendMagicLink} className="login-form">
              {mode === 'register' && (
                <>
                  <div className="input-group">
                    <input
                      id="name" type="text" className="login-input" placeholder=" "
                      value={name} onChange={(e) => setName(e.target.value)} required
                    />
                    <label htmlFor="name" className="input-label">{t.nameLabel}</label>
                  </div>

                  <div className="input-group">
                    <select
                      id="city" className="login-input login-select"
                      value={city} onChange={(e) => setCity(e.target.value)} required
                    >
                      <option value="" disabled hidden></option>
                      {cities.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <label htmlFor="city" className="input-label input-label-select">Your City</label>
                  </div>
                </>
              )}

              <div className="input-group">
                <input
                  id="email" type="email" className="login-input" placeholder=" "
                  value={email} onChange={(e) => setEmail(e.target.value)} required
                />
                <label htmlFor="email" className="input-label">{t.emailLabel}</label>
              </div>

              <button
                type="submit" className="login-btn"
                disabled={loading || !email || (mode === 'register' && (!name || !city))}
              >
                {loading ? <span className="spinner" /> : (mode === 'register' ? t.continueBtn : 'Send Login Code')}
              </button>
            </form>

            <button className="guest-btn" onClick={onGuestContinue}>
              {t.guestBtn}
            </button>
          </>
        ) : (
          <>
            <p className="login-subtitle">{t.checkEmail(email)}</p>

            <form onSubmit={verifyCode} className="login-form">
              <div className="input-group">
                <input
                  id="otp" type="text" inputMode="numeric" maxLength={6}
                  className="login-input" placeholder=" "
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                />
                <label htmlFor="otp" className="input-label">Enter 6-digit code</label>
              </div>

              <button type="submit" className="login-btn" disabled={verifying || otp.length !== 6}>
                {verifying ? <span className="spinner" /> : 'Verify & Continue'}
              </button>
            </form>

            <button className="login-link-btn" onClick={() => { setSent(false); setOtp(''); setError(''); }}>
              {t.differentEmail}
            </button>
          </>
        )}

        {error && <p className="login-error">{error}</p>}
        <p className="login-footer">{t.terms}</p>
      </div>
    </div>
  );
}

