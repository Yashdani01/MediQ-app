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
    getAllCities().then((list) => {
      setCities(list);
      setCity((current) => {
        if (current) return current;
        if (list.includes('Balgona')) return 'Balgona';
        return list[0] || '';
      });
    });
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
      <div className="login-content">
        {/* Top bar: brand mark + language pills */}
        <div className="login-topbar">
          <p className="login-brand-mini">MediQ</p>
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
        </div>

        {/* Hero: logo mark + tagline */}
        <div className="login-hero">
          <div className="login-logo-ring">
            {/* NOTE: placeholder icon — swap with the exported Figma badge-alert asset if desired */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8v5M12 16h.01" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10.29 3.86l-8.18 14.18A1.5 1.5 0 0 0 3.5 20.5h17a1.5 1.5 0 0 0 1.39-2.46L13.71 3.86a1.5 1.5 0 0 0-2.6 0Z" stroke="#10b981" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="login-brand-title">MediQ</p>
          <p className="login-tagline">Smart healthcare queue at your fingertips</p>
        </div>

        {!sent && (
          <div className="segmented-toggle">
            <button
              className={`segment-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              Register
            </button>
            <button
              className={`segment-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Log In
            </button>
          </div>
        )}

        {sent && <h1 className="login-title">{t.signInTitle}</h1>}

        {!sent ? (
          <>
            <form onSubmit={sendMagicLink} className="login-form">
              {mode === 'register' && (
                <>
                  <div className="input-group">
                    <label htmlFor="name" className="input-label-static">{t.nameLabel}</label>
                    <input
                      id="name" type="text" className="login-input"
                      value={name} onChange={(e) => setName(e.target.value)} required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="city" className="input-label-static">Your City</label>
                    <div className="select-wrapper">
                      <select
                        id="city" className="login-input login-select"
                        value={city} onChange={(e) => setCity(e.target.value)} required
                      >
                        <option value="" disabled hidden></option>
                        {cities.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="input-group">
                <label htmlFor="email" className="input-label-static">{t.emailLabel}</label>
                <input
                  id="email" type="email" className="login-input"
                  value={email} onChange={(e) => setEmail(e.target.value)} required
                />
              </div>

              <button
                type="submit" className="login-btn"
                disabled={loading || !email || (mode === 'register' && (!name || !city))}
              >
                {loading ? <span className="spinner" /> : (mode === 'register' ? 'Continue with Email' : 'Send Login Code')}
              </button>
            </form>

            {mode === 'register' && (
              <p className="login-value-prop">
                Unlock real-time queue tracking, live doctor status, and instant booking updates.
              </p>
            )}

            <button className="guest-btn" onClick={onGuestContinue}>
              Continue as Guest →
            </button>
          </>
        ) : (
          <>
            <p className="login-subtitle">{t.checkEmail(email)}</p>

            <form onSubmit={verifyCode} className="login-form">
              <div className="input-group">
                <label htmlFor="otp" className="input-label-static">Enter 6-digit code</label>
                <input
                  id="otp" type="text" inputMode="numeric" maxLength={6}
                  className="login-input otp-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                />
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
        <p className="login-footer">By registering, you agree to our Terms and Privacy Policy.</p>
      </div>
    </div>
  );
}
