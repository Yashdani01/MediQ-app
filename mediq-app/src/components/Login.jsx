import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { translations, languages } from '../i18n';
import { getAllCities } from '../hospitalData';
import './Login.css';

export default function Login({ onGuestContinue }) {
  const [lang, setLang] = useState('en');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [cities, setCities] = useState([]);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = translations[lang];

  useEffect(() => {
    getAllCities().then(setCities);
  }, []);

  const sendMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: { full_name: name, city: city },
      },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div className="login-page">
      <div className="login-bg-shape shape-1" />
      <div className="login-bg-shape shape-2" />

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

      <div className="login-card">
        <div className="login-logo"><span className="login-logo-icon">✛</span></div>
        <h1 className="login-title">{t.signInTitle}</h1>

        {!sent ? (
          <>
            <p className="login-subtitle">{t.signInSubtitle}</p>

            <form onSubmit={sendMagicLink} className="login-form">
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

              <div className="input-group">
                <input
                  id="email" type="email" className="login-input" placeholder=" "
                  value={email} onChange={(e) => setEmail(e.target.value)} required
                />
                <label htmlFor="email" className="input-label">{t.emailLabel}</label>
              </div>

              <button type="submit" className="login-btn" disabled={loading || !email || !name || !city}>
                {loading ? <span className="spinner" /> : t.continueBtn}
              </button>
            </form>

            <button className="guest-btn" onClick={onGuestContinue}>
              {t.guestBtn}
            </button>
          </>
        ) : (
          <>
            <p className="login-subtitle">{t.checkEmail(email)}</p>
            <button className="login-link-btn" onClick={() => setSent(false)}>
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