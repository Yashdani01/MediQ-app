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
    <div className="login-page-v2">
      <div className="login-topbar-v2">
        <p className="login-brand-v2">MediQ</p>
        <div className="lang-toggle-v2">
          {languages.map((l) => (
            <button
              key={l.code}
              className={`lang-pill-v2 ${lang === l.code ? 'active' : ''}`}
              onClick={() => setLang(l.code)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="login-card-v2">
        <div className="login-card-v2-header">
          <div className="login-avatar-v2">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" stroke="#10b981" strokeWidth="1.6" />
              <path d="M4 20.5c1.4-3.6 4.6-5.5 8-5.5s6.6 1.9 8 5.5" stroke="#10b981" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="login-card-v2-title">{sent ? t.signInTitle : (mode === 'register' ? 'Create your account' : 'Welcome back')}</p>
            <p className="login-card-v2-sub">
              {sent ? '' : (mode === 'register' ? 'Join MediQ for live queue tracking' : 'Sign in to continue')}
            </p>
          </div>
        </div>

        {!sent && (
          <div className="segmented-toggle-v2">
            <button
              className={`segment-btn-v2 ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              Register
            </button>
            <button
              className={`segment-btn-v2 ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Log In
            </button>
          </div>
        )}

        <div className="login-card-v2-divider" />

        {!sent ? (
          <>
            <form onSubmit={sendMagicLink} className="login-form-v2">
              {mode === 'register' && (
                <>
                  <div className="input-group-v2">
                    <label htmlFor="name" className="input-label-v2">{t.nameLabel}</label>
                    <input
                      id="name" type="text" className="login-input-v2"
                      value={name} onChange={(e) => setName(e.target.value)} required
                    />
                  </div>

                  <div className="input-group-v2">
                    <label htmlFor="city" className="input-label-v2">Your City</label>
                    <select
                      id="city" className="login-input-v2 login-select-v2"
                      value={city} onChange={(e) => setCity(e.target.value)} required
                    >
                      <option value="" disabled hidden></option>
                      {cities.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="input-group-v2">
                <label htmlFor="email" className="input-label-v2">{t.emailLabel}</label>
                <input
                  id="email" type="email" className="login-input-v2"
                  value={email} onChange={(e) => setEmail(e.target.value)} required
                />
              </div>

              <button
                type="submit" className="login-btn-v2"
                disabled={loading || !email || (mode === 'register' && (!name || !city))}
              >
                {loading ? <span className="spinner-v2" /> : (mode === 'register' ? 'Continue with Email' : 'Send Login Code')}
              </button>
            </form>

            <button className="guest-btn-v2" onClick={onGuestContinue}>
              Continue as Guest →
            </button>
          </>
        ) : (
          <>
            <p className="login-card-v2-sub" style={{ marginBottom: 16 }}>{t.checkEmail(email)}</p>

            <form onSubmit={verifyCode} className="login-form-v2">
              <div className="input-group-v2">
                <label htmlFor="otp" className="input-label-v2">Enter 6-digit code</label>
                <input
                  id="otp" type="text" inputMode="numeric" maxLength={6}
                  className="login-input-v2 otp-input-v2"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>

              <button type="submit" className="login-btn-v2" disabled={verifying || otp.length !== 6}>
                {verifying ? <span className="spinner-v2" /> : 'Verify & Continue'}
              </button>
            </form>

            <button className="login-link-v2" onClick={() => { setSent(false); setOtp(''); setError(''); }}>
              {t.differentEmail}
            </button>
          </>
        )}

        {error && <p className="login-error-v2">{error}</p>}
      </div>

      <p className="login-footer-v2">By registering, you agree to our Terms and Privacy Policy.</p>
    </div>
  );
}
