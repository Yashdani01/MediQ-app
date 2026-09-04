import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { translations, languages } from '../i18n';
import { getAllCities } from '../hospitalData';
import './Login.css';

export default function Login({ onGuestContinue, onClinicSignIn }) {
  const [mode, setMode] = useState('entry'); // 'entry', 'register', 'login'
  const [selectedPortal, setSelectedPortal] = useState('patient');
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

  const t = translations[lang] || translations['en'];

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
        setError('No account found with this email. Please use Create an account.');
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
          className={`language-button ${lang === l.code ? 'active' : ''}`}
          onClick={() => setLang(l.code)}
          aria-label={`Switch language to ${l.label}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 lg:p-8">
      <div className="max-w-6xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-100">
        
        {/* LEFT COLUMN: BRANDING & PORTAL CHOICE (Patient Portal Highlighted) */}
        <div className="lg:col-span-5 p-8 lg:p-10 bg-gradient-to-b from-slate-50/50 to-emerald-50/30 flex flex-col justify-between border-r border-slate-100">
          <div>
            {/* Header Brand */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-600/20">
                  +
                </div>
                <div>
                  <span className="text-2xl font-extrabold tracking-tight text-slate-900">MediQ</span>
                  <p className="text-[11px] text-slate-500 font-medium">Healthcare, without the waiting.</p>
                </div>
              </div>
              {renderLanguageToggle()}
            </div>

            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
              Spend less time <span className="text-emerald-600">waiting.</span>
            </h1>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Find hospitals, track queue status, and manage care seamlessly.
            </p>

            {/* Portal Switcher Focus */}
            <div className="space-y-3 mb-6">
              <div 
                onClick={() => setSelectedPortal('patient')}
                className={`cursor-pointer p-4 rounded-2xl transition-all border-2 ${
                  selectedPortal === 'patient' 
                    ? 'border-emerald-600 bg-emerald-50/40 shadow-md shadow-emerald-600/5' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-base font-bold">
                      👤
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Patient Portal</h3>
                      <p className="text-[11px] text-slate-500">Access queue tracking & health records.</p>
                    </div>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-emerald-600 bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                    ✓
                  </div>
                </div>
              </div>

              {/* Subdued Clinic Portal Trigger */}
              <div 
                onClick={() => {
                  setSelectedPortal('clinic');
                  if (onClinicSignIn) onClinicSignIn();
                }}
                className="cursor-pointer p-3 rounded-xl border border-slate-200 bg-white/60 hover:border-slate-300 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-xs">
                    🏥
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700 text-xs">Clinic Portal</h4>
                    <p className="text-[10px] text-slate-400">Secure staff & provider sign in.</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400">→</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
            <span>🔒 Secure access</span>
            <button 
              type="button" 
              onClick={onClinicSignIn}
              className="text-emerald-600 font-medium hover:underline bg-transparent border-none cursor-pointer p-0"
            >
              Hospital / Clinic sign in
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE AUTH FORM */}
        <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto">

            {/* ENTRY MODE SELECTION */}
            {!sent && mode === 'entry' && (
              <>
                <div className="text-center mb-8">
                  <span className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase">Welcome to MediQ</span>
                  <h2 className="text-2xl font-bold text-slate-900 mt-1">How would you like to continue?</h2>
                  <p className="text-sm text-slate-500 mt-1">Choose an option below to get started instantly.</p>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/70 text-left transition-all group"
                    onClick={() => chooseMode('register')}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">+</span>
                      <div>
                        <strong className="block text-slate-900 text-sm">Create an account</strong>
                        <small className="text-slate-500 text-xs">New to MediQ? Register with your email.</small>
                      </div>
                    </div>
                    <span className="text-emerald-600 group-hover:translate-x-1 transition-transform">→</span>
                  </button>

                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-left transition-all group"
                    onClick={() => chooseMode('login')}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold">↗</span>
                      <div>
                        <strong className="block text-slate-900 text-sm">Sign in</strong>
                        <small className="text-slate-500 text-xs">Already registered? Continue securely.</small>
                      </div>
                    </div>
                    <span className="text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>

                <div className="relative flex py-5 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-4 text-xs text-slate-400 uppercase">or</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                  type="button"
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all flex items-center justify-center gap-2"
                  onClick={onGuestContinue}
                >
                  Continue as guest <span>→</span>
                </button>
              </>
            )}

            {/* REGISTER OR LOGIN FORM */}
            {!sent && (mode === 'register' || mode === 'login') && (
              <>
                <button
                  type="button"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-6 bg-transparent border-none cursor-pointer p-0"
                  onClick={goBack}
                >
                  ← Back
                </button>

                <div className="mb-6">
                  <span className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase">
                    {mode === 'register' ? 'New Account' : 'Welcome Back'}
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900 mt-1">
                    {mode === 'register' ? 'Create your account' : 'Sign in to MediQ'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {mode === 'register' ? 'Provide your details to set up tracking.' : 'Enter your email for a secure verification code.'}
                  </p>
                </div>

                <form onSubmit={sendMagicLink} className="space-y-4">
                  {mode === 'register' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Full Name</label>
                        <input 
                          type="text" 
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your full name" 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Your City</label>
                        <select
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition-all bg-white"
                        >
                          <option value="" disabled>Select your city</option>
                          {cities.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition-all"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || !email || (mode === 'register' && (!name || !city))}
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? 'Sending code...' : (mode === 'register' ? 'Continue with email →' : 'Send login code →')}
                  </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                  {mode === 'register' ? 'Already have an account? ' : 'New to MediQ? '}
                  <button 
                    type="button"
                    onClick={() => chooseMode(mode === 'register' ? 'login' : 'register')}
                    className="font-semibold text-emerald-600 hover:underline bg-transparent border-none cursor-pointer p-0"
                  >
                    {mode === 'register' ? 'Sign in' : 'Create an account'}
                  </button>
                </div>
              </>
            )}

            {/* OTP VERIFICATION SCREEN */}
            {sent && (
              <>
                <button
                  type="button"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-6 bg-transparent border-none cursor-pointer p-0"
                  onClick={() => { setSent(false); setOtp(''); setError(''); }}
                >
                  ← Change email
                </button>

                <div className="mb-6">
                  <span className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase">Verify Email</span>
                  <h2 className="text-2xl font-bold text-slate-900 mt-1">Check your inbox</h2>
                  <p className="text-sm text-slate-500 mt-1">We sent a 6-digit code to <strong>{email}</strong>.</p>
                </div>

                <form onSubmit={verifyCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">6-Digit Verification Code</label>
                    <input 
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-center tracking-widest text-lg font-bold transition-all"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={verifying || otp.length !== 6}
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                  >
                    {verifying ? 'Verifying...' : 'Verify & continue →'}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <button 
                    type="button"
                    onClick={() => { setSent(false); setOtp(''); setError(''); }}
                    className="text-xs text-slate-500 hover:text-slate-800 bg-transparent border-none cursor-pointer underline"
                  >
                    Use a different email
                  </button>
                </div>
              </>
            )}

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs text-center" role="alert">
                {error}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}