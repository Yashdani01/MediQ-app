import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login() {
  const [selectedPortal, setSelectedPortal] = useState('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (selectedPortal === 'patient') {
      navigate('/patient-dashboard');
    } else {
      navigate('/clinic-portal');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 lg:p-12">
      <div className="max-w-6xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-100">
        
        {/* Left Column: Branding & Portal Selection */}
        <div className="lg:col-span-5 p-8 lg:p-12 bg-gradient-to-b from-slate-50/50 to-emerald-50/30 flex flex-col justify-between border-r border-slate-100">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-600/20">
                N+
              </div>
              <div>
                <span className="text-2xl font-extrabold tracking-tight text-slate-900">MediQ</span>
                <p className="text-xs text-slate-500 font-medium">Smarter Healthcare, Together</p>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">
              Welcome to <span className="text-emerald-600">MediQ</span>
            </h1>
            <p className="text-slate-600 text-sm mb-8 leading-relaxed">
              Smarter healthcare for everyone, everywhere. Choose your portal to proceed.
            </p>

            {/* Portal Switcher Cards */}
            <div className="space-y-4">
              {/* Highlighted Patient Portal */}
              <div 
                onClick={() => setSelectedPortal('patient')}
                className={`cursor-pointer p-5 rounded-2xl transition-all border-2 ${
                  selectedPortal === 'patient' 
                    ? 'border-emerald-600 bg-emerald-50/40 shadow-md shadow-emerald-600/5' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg ${
                      selectedPortal === 'patient' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      👤
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">Patient Portal</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Access records, appointments & more.</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedPortal === 'patient' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                  }`}>
                    {selectedPortal === 'patient' && <span className="text-xs">✓</span>}
                  </div>
                </div>
              </div>

              {/* Subdued Clinic Portal */}
              <div 
                onClick={() => setSelectedPortal('clinic')}
                className={`cursor-pointer p-4 rounded-xl transition-all border ${
                  selectedPortal === 'clinic' 
                    ? 'border-slate-800 bg-slate-50 shadow-sm' 
                    : 'border-slate-200 bg-white/60 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-sm">
                      🏥
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">Clinic Portal</h4>
                      <p className="text-[11px] text-slate-400">Manage practice & patients.</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPortal === 'clinic' ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-300'
                  }`}>
                    {selectedPortal === 'clinic' && <span className="text-[10px]">✓</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
            <span>🔒 Secure & Private</span>
            <span>🛡️ HIPAA Compliant</span>
          </div>
        </div>

        {/* Right Column: Form Inputs */}
        <div className="lg:col-span-7 p-8 lg:p-14 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">
                {selectedPortal === 'patient' ? 'Patient Sign In' : 'Clinic Secure Login'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Please enter your credentials to access your workspace
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">Password</label>
                  <a href="#forgot" className="text-xs font-medium text-emerald-600 hover:underline">Forgot?</a>
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition-all"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 transition-all transform active:scale-[0.99]"
              >
                Sign In to {selectedPortal === 'patient' ? 'Patient Portal' : 'Clinic Portal'} →
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-slate-500">
              Don't have an account? <a href="#signup" className="font-semibold text-emerald-600 hover:underline">Sign up</a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}