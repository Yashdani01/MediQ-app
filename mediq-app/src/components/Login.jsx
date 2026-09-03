import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { translations, languages } from '../i18n';
import { getAllCities } from '../hospitalData';
import './Login.css';

export default function Login({ onGuestContinue, onClinicSignIn }) {
  const [mode, setMode] = useState('entry');
  const [lang, setLang] = useState('en');

  const [name, setName] = useState(
    () => sessionStorage.getItem('mediq_name') || ''
  );

  const [city, setCity] = useState(
    () => sessionStorage.getItem('mediq_city') || ''
  );

  const [cities, setCities] = useState([]);

  const [email, setEmail] = useState(
    () => sessionStorage.getItem('mediq_email') || ''
  );

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

  useEffect(() => {
    sessionStorage.setItem('mediq_name', name);
  }, [name]);

  useEffect(() => {
    sessionStorage.setItem('mediq_city', city);
  }, [city]);

  useEffect(() => {
    sessionStorage.setItem('mediq_email', email);
  }, [email]);

  const chooseMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSent(false);
    setOtp('');
  };

  const goBack = () => {
    setMode('entry');
    setSent(false);
    setOtp('');
    setError('');
  };

  const sendMagicLink = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    const isRegister = mode === 'register';

    const redirectUrl = isRegister
      ? `${window.location.origin}?name=${encodeURIComponent(
          name
        )}&city=${encodeURIComponent(city)}`
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
        setError(
          'No account found with this email. Please use Create an account.'
        );
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
      return;
    }

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
  };

  const renderLanguageToggle = () => (
    <div className="language-switch">
      {languages.map((l) => (
        <button
          key={l.code}
          type="button"
          className={`language-button ${
            lang === l.code ? 'active' : ''
          }`}
          onClick={() => setLang(l.code)}
          aria-label={`Switch language to ${l.label}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="auth-page">
      {/* HEADER */}
      <header className="auth-header">
        <div className="auth-brand">
          <div className="brand-mark" aria-hidden="true">
            <span>+</span>
          </div>

          <div>
            <p className="brand-name">MediQ</p>
            <p className="brand-tagline">
              Healthcare, without the waiting.
            </p>
          </div>
        </div>

        <div className="auth-header-actions">
          <span className="secure-label">
            <span className="secure-dot" aria-hidden="true" />
            Secure access
          </span>

          {renderLanguageToggle()}
        </div>
      </header>

      {/* MAIN */}
      <main className="auth-main">

        {/* LEFT SIDE */}
        <section
          className="auth-intro"
          aria-label="MediQ overview"
        >
          <div className="intro-eyebrow">
            <span className="eyebrow-line" />
            SMARTER HEALTHCARE
          </div>

          <h1>
            Spend less time
            <br />
            <em>waiting.</em>
          </h1>

          <p className="intro-copy">
            Find hospitals, discover services, and keep track of
            your place in the queue — all from one simple healthcare
            platform.
          </p>

          <div className="intro-features">

            <div className="feature-item">
              <span className="feature-icon" aria-hidden="true">
                +
              </span>

              <div>
                <strong>Live queue visibility</strong>
                <span>
                  Know your position before you arrive.
                </span>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-icon" aria-hidden="true">
                +
              </span>

              <div>
                <strong>Find the right care</strong>
                <span>
                  Explore hospitals and available services.
                </span>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-icon" aria-hidden="true">
                ✓
              </span>

              <div>
                <strong>Private by design</strong>
                <span>
                  Your account stays tied to your verified email.
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* RIGHT AUTH PANEL */}
        <section
          className="auth-panel"
          aria-label="MediQ authentication"
        >
          <div className="auth-panel-inner">

            {/* INITIAL CHOICE SCREEN */}
            {!sent && mode === 'entry' && (
              <>
                <div className="panel-heading">
                  <span className="panel-kicker">
                    WELCOME TO MEDIQ
                  </span>

                  <h2>
                    How would you like to continue?
                  </h2>

                  <p>
                    Choose an option below to get started.
                  </p>
                </div>

                <div className="auth-choice-list">

                  <button
                    type="button"
                    className="auth-choice primary"
                    onClick={() => chooseMode('register')}
                  >
                    <span
                      className="choice-icon"
                      aria-hidden="true"
                    >
                      +
                    </span>

                    <span className="choice-copy">
                      <strong>Create an account</strong>
                      <small>
                        New to MediQ? Register with your email.
                      </small>
                    </span>

                    <span
                      className="choice-arrow"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </button>

                  <button
                    type="button"
                    className="auth-choice"
                    onClick={() => chooseMode('login')}
                  >
                    <span
                      className="choice-icon"
                      aria-hidden="true"
                    >
                      ↗
                    </span>

                    <span className="choice-copy">
                      <strong>Sign in</strong>
                      <small>
                        Already registered? Continue securely.
                      </small>
                    </span>

                    <span
                      className="choice-arrow"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </button>

                </div>

                <div className="guest-divider">
                  <span>or</span>
                </div>

                <button
                  type="button"
                  className="guest-action"
                  onClick={onGuestContinue}
                >
                  Continue as guest
                  <span aria-hidden="true">→</span>
                </button>
              </>
            )}

            {/* REGISTER / LOGIN FORM */}
            {!sent &&
              (mode === 'register' || mode === 'login') && (
                <>
                  <button
                    type="button"
                    className="back-action"
                    onClick={goBack}
                  >
                    <span aria-hidden="true">←</span>
                    {' '}Back
                  </button>

                  <div className="panel-heading compact">
                    <span className="panel-kicker">
                      {mode === 'register'
                        ? 'NEW ACCOUNT'
                        : 'WELCOME BACK'}
                    </span>

                    <h2>
                      {mode === 'register'
                        ? 'Create your account'
                        : 'Sign in to MediQ'}
                    </h2>

                    <p>
                      {mode === 'register'
                        ? 'A few details, then we will verify your email.'
                        : 'Enter your email and we will send you a secure code.'}
                    </p>
                  </div>

                  <form
                    onSubmit={sendMagicLink}
                    className="auth-form"
                  >

                    {mode === 'register' && (
                      <>
                        <div className="field-group">
                          <label htmlFor="name">
                            Full name
                          </label>

                          <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) =>
                              setName(e.target.value)
                            }
                            autoComplete="name"
                            required
                          />
                        </div>

                        <div className="field-group">
                          <label htmlFor="city">
                            Your city
                          </label>

                          <select
                            id="city"
                            value={city}
                            onChange={(e) =>
                              setCity(e.target.value)
                            }
                            required
                          >
                            <option
                              value=""
                              disabled
                            >
                              Select your city
                            </option>

                            {cities.map((c) => (
                              <option
                                key={c}
                                value={c}
                              >
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    <div className="field-group">
                      <label htmlFor="email">
                        Email address
                      </label>

                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) =>
                          setEmail(e.target.value)
                        }
                        autoComplete="email"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="submit-action"
                      disabled={
                        loading ||
                        !email ||
                        (mode === 'register' &&
                          (!name || !city))
                      }
                    >
                      {loading ? (
                        <span className="spinner" />
                      ) : (
                        <>
                          {mode === 'register'
                            ? 'Continue with email'
                            : 'Send login code'}

                          <span aria-hidden="true">
                            →
                          </span>
                        </>
                      )}
                    </button>

                  </form>

                  <p className="form-switch">
                    {mode === 'register'
                      ? 'Already have an account?'
                      : 'New to MediQ?'}

                    <button
                      type="button"
                      onClick={() =>
                        chooseMode(
                          mode === 'register'
                            ? 'login'
                            : 'register'
                        )
                      }
                    >
                      {mode === 'register'
                        ? 'Sign in'
                        : 'Create an account'}
                    </button>
                  </p>
                </>
              )}

            {/* OTP SCREEN */}
            {sent && (
              <>
                <button
                  type="button"
                  className="back-action"
                  onClick={() => {
                    setSent(false);
                    setOtp('');
                    setError('');
                  }}
                >
                  <span aria-hidden="true">←</span>
                  {' '}Change email
                </button>

                <div className="panel-heading compact">
                  <span className="panel-kicker">
                    VERIFY EMAIL
                  </span>

                  <h2>
                    Check your inbox
                  </h2>

                  <p>
                    {t.checkEmail
                      ? t.checkEmail(email)
                      : `We sent a 6-digit code to ${email}.`}
                  </p>
                </div>

                <form
                  onSubmit={verifyCode}
                  className="auth-form"
                >
                  <div className="field-group">
                    <label htmlFor="otp">
                      6-digit verification code
                    </label>

                    <input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      className="otp-field"
                      value={otp}
                      onChange={(e) =>
                        setOtp(
                          e.target.value.replace(/\D/g, '')
                        )
                      }
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="submit-action"
                    disabled={
                      verifying || otp.length !== 6
                    }
                  >
                    {verifying ? (
                      <span className="spinner" />
                    ) : (
                      <>
                        Verify & continue
                        <span aria-hidden="true">
                          →
                        </span>
                      </>
                    )}
                  </button>
                </form>

                <button
                  type="button"
                  className="form-switch secondary"
                  onClick={() => {
                    setSent(false);
                    setOtp('');
                    setError('');
                  }}
                >
                  Use a different email
                </button>
              </>
            )}

            {error && (
              <p
                className="auth-error"
                role="alert"
              >
                {error}
              </p>
            )}

          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="auth-footer">
        <span>
          © {new Date().getFullYear()} MediQ
        </span>

        <span>
          Secure healthcare access
        </span>

        <span>
          <button
            type="button"
            onClick={onClinicSignIn}
            style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', font: 'inherit', padding: 0 }}
          >
            Clinic / Hospital sign in
          </button>
        </span>

        <span>
          Terms · Privacy
        </span>
      </footer>
    </div>
  );
}