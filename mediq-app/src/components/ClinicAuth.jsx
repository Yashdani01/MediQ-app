import { useState } from 'react';
import { supabase } from '../supabaseClient';

const PLANS = [
  {
    id: 'silver', label: 'Silver', tagline: 'Starter', price: 149, maxDoctors: 5,
    accent: '#0f6e56', badgeBg: '#e1f5ee', badgeFg: '#0f6e56',
    features: ['Clinic profile & branding', 'Manage appointments', 'Live queue tracker', 'WhatsApp & email support'],
  },
  {
    id: 'gold', label: 'Gold', tagline: 'Growth', price: 299, maxDoctors: 10, popular: true,
    accent: '#b7791f', badgeBg: '#fdf3dd', badgeFg: '#8a5a10',
    features: ['Everything in Silver', 'Priority listing for patients', 'Broadcast announcements', 'Priority support'],
  },
  {
    id: 'platinum', label: 'Platinum', tagline: 'Professional', price: 499, maxDoctors: 15,
    accent: '#0b332c', badgeBg: '#0b332c', badgeFg: '#ffffff',
    features: ['Everything in Gold', 'Multiple doctor schedules', 'Booking insights', 'Dedicated support line'],
  },
  {
    id: 'diamond', label: 'Diamond', tagline: 'Enterprise', price: 999, maxDoctors: 20,
    accent: '#06231d', badgeBg: '#06231d', badgeFg: '#ffffff',
    features: ['Everything in Platinum', 'Unlimited doctor slots', '24×7 priority support', 'Early access to new features'],
  },
];

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// onLoggedIn receives:
// { hospitalId, hospitalName, accessPin, plan, maxDoctors, expiresAt }
export default function ClinicAuth({ onLoggedIn }) {
  const [mode, setMode] = useState('login'); // login | register | plans | paying
  const [mobile, setMobile] = useState('');
  const [mpin, setMpin] = useState('');
  const [mpinConfirm, setMpinConfirm] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingHospitalId, setPendingHospitalId] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc('clinic_login', {
      input_mobile: mobile.trim(),
      input_mpin: mpin.trim(),
    });
    setLoading(false);

    if (rpcError || !data || data.length === 0) {
      setError('Mobile number or MPIN is incorrect.');
      return;
    }

    const row = data[0];

    if (row.status !== 'active') {
      setPendingHospitalId(row.hospital_id);
      setMode('plans');
      return;
    }

    onLoggedIn({
      hospitalId: row.hospital_id,
      hospitalName: row.hospital_name,
      accessPin: row.access_pin,
      plan: row.plan,
      maxDoctors: row.doctor_limit,
      expiresAt: row.expires_at,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (mobile.trim().length !== 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (mpin.length !== 6) {
      setError('MPIN must be exactly 6 digits.');
      return;
    }
    if (mpin !== mpinConfirm) {
      setError('MPIN and Confirm MPIN do not match.');
      return;
    }

    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc('register_clinic', {
      input_name: clinicName.trim(),
      input_mobile: mobile.trim(),
      input_mpin: mpin.trim(),
    });
    setLoading(false);

    if (rpcError) {
      setError(rpcError.message || 'Could not register. Try a different mobile number.');
      return;
    }

    setPendingHospitalId(data);
    setMode('plans');
  };

  const handlePay = async (plan) => {
    setError('');
    setLoading(true);

    const scriptOk = await loadRazorpayScript();
    if (!scriptOk) {
      setLoading(false);
      setError('Could not load the payment window. Check your internet and try again.');
      return;
    }

    try {
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: plan.price }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error || 'Could not start payment.');

      const rzp = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: 'INR',
        name: 'MediQ Clinic Subscription',
        description: `${plan.label} Plan — up to ${plan.maxDoctors === 20 ? '20+' : plan.maxDoctors} doctors`,
        order_id: order.id,
        handler: async (response) => {
          setMode('paying');
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                hospital_id: pendingHospitalId,
                plan: plan.id,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error('Payment succeeded but activation failed. Save this payment ID and contact support: ' + response.razorpay_payment_id);
            }

            const { data } = await supabase.rpc('clinic_login', {
              input_mobile: mobile.trim(),
              input_mpin: mpin.trim(),
            });
            const row = data?.[0];
            onLoggedIn({
              hospitalId: pendingHospitalId,
              hospitalName: clinicName || row?.hospital_name,
              accessPin: row?.access_pin,
              plan: plan.id,
              maxDoctors: plan.maxDoctors,
              expiresAt: row?.expires_at,
            });
          } catch (err) {
            setError(err.message);
            setMode('plans');
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
        theme: { color: '#0b332c' },
      });

      rzp.open();
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  const shellStyle = { minHeight: '100vh', background: 'radial-gradient(circle at 20% 20%, #12463d 0%, #0b332c 45%, #062b25 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" };
  const cardStyle = { background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '36px 28px', boxShadow: '0 25px 60px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center' };
  const inputStyle = { width: '100%', padding: '13px', borderRadius: '12px', border: '1.5px solid #e7e1d3', fontSize: '15px', boxSizing: 'border-box', color: '#0b332c' };
  const pinStyle = { ...inputStyle, textAlign: 'center', letterSpacing: '8px', fontSize: '20px', fontWeight: 'bold' };
  const buttonStyle = (disabled) => ({ width: '100%', background: '#10b981', color: '#fff', border: 'none', padding: '14px', borderRadius: '14px', fontSize: '14px', fontWeight: '700', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1 });

  if (mode === 'plans') {
    return (
      <div style={shellStyle}>
        <div style={{ ...cardStyle, maxWidth: '460px', textAlign: 'left' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#e6f4ea', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: '28px', fontWeight: 'bold' }}>✚</div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '22px', color: '#0b332c', margin: '0 0 6px' }}>Choose Your Plan</h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px' }}>You're approved! Pick a plan to activate your clinic portal and grow your practice.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                style={{
                  position: 'relative',
                  display: 'flex',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: plan.popular ? `2px solid ${plan.accent}` : '1px solid #e7e1d3',
                }}
              >
                {plan.popular && (
                  <div style={{ position: 'absolute', top: 0, left: 0, background: plan.accent, color: '#fff', fontSize: '9px', fontWeight: '800', letterSpacing: '0.4px', padding: '4px 10px', borderBottomRightRadius: '10px' }}>
                    MOST POPULAR
                  </div>
                )}

                <div style={{ width: '78px', flexShrink: 0, background: plan.badgeBg, color: plan.badgeFg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.3px' }}>{plan.label}</div>
                  <div style={{ fontSize: '8px', opacity: 0.8, marginTop: '3px' }}>{plan.tagline.toUpperCase()}</div>
                </div>

                <div style={{ flex: 1, background: '#fff', padding: plan.popular ? '18px 12px 12px' : '12px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0b332c' }}>
                    Up to {plan.maxDoctors === 20 ? '20+' : plan.maxDoctors} doctors
                  </div>

                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {plan.features.map((f) => (
                      <li key={f} style={{ fontSize: '10px', color: '#64748b', display: 'flex', gap: '5px', alignItems: 'flex-start' }}>
                        <span style={{ color: plan.accent, fontWeight: '700' }}>✓</span>{f}
                      </li>
                    ))}
                  </ul>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <div style={{ fontSize: '19px', fontWeight: '800', color: plan.accent }}>
                      ₹{plan.price}<span style={{ fontSize: '10px', fontWeight: '500', color: '#94a3b8' }}>/mo</span>
                    </div>
                    <button
                      onClick={() => handlePay(plan)}
                      disabled={loading}
                      style={{ background: plan.accent, color: '#fff', border: 'none', borderRadius: '999px', padding: '8px 14px', fontSize: '10.5px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
                    >
                      Choose Plan →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '14px', background: '#fef2f2', padding: '10px', borderRadius: '10px', fontWeight: '600' }}>{error}</p>}
          {loading && <p style={{ fontSize: '12px', color: '#64748b', marginTop: '14px', textAlign: 'center' }}>Opening payment window...</p>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
            {[
              ['🛡️', 'No hidden charges', 'Cancel anytime'],
              ['🔒', '100% secure payments', 'Encrypted & safe'],
              ['🎧', 'Need help?', 'Contact support'],
              ['🧾', 'GST invoice', 'On all plans'],
            ].map(([icon, title, sub]) => (
              <div key={title} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '13px' }}>{icon}</span>
                <div>
                  <div style={{ fontSize: '9.5px', fontWeight: '700', color: '#0b332c' }}>{title}</div>
                  <div style={{ fontSize: '9px', color: '#94a3b8' }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => { setMode('login'); setError(''); }} style={{ marginTop: '16px', background: 'none', border: 'none', color: '#0b332c', fontSize: '12px', fontWeight: '700', textDecoration: 'underline', cursor: 'pointer', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'paying') {
    return (
      <div style={shellStyle}>
        <div style={cardStyle}>
          <p style={{ color: '#0b332c', fontWeight: '700' }}>Activating your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      <div style={cardStyle}>
        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#e6f4ea', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: '28px', fontWeight: 'bold' }}>✚</div>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '22px', color: '#0b332c', margin: '0 0 6px' }}>Clinic Portal</h1>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 22px' }}>
          {mode === 'login' ? 'Log in with your registered mobile number and MPIN.' : 'Register your clinic to get started.'}
        </p>

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mode === 'register' && (
            <input type="text" placeholder="Clinic Name" value={clinicName} onChange={(e) => setClinicName(e.target.value)} required style={inputStyle} />
          )}
          <input type="tel" inputMode="numeric" placeholder="Mobile Number" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} required style={inputStyle} />
          <input type="password" inputMode="numeric" placeholder="6-digit MPIN" maxLength={6} value={mpin} onChange={(e) => setMpin(e.target.value.replace(/\D/g, ''))} required style={pinStyle} />
          {mode === 'register' && (
            <input type="password" inputMode="numeric" placeholder="Confirm MPIN" maxLength={6} value={mpinConfirm} onChange={(e) => setMpinConfirm(e.target.value.replace(/\D/g, ''))} required style={pinStyle} />
          )}
          <button type="submit" disabled={loading} style={buttonStyle(loading)}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Log In →' : 'Register & Choose Plan →'}
          </button>
        </form>

        {error && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '14px', background: '#fef2f2', padding: '10px', borderRadius: '10px', fontWeight: '600' }}>{error}</p>}

        <button
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          style={{ marginTop: '18px', background: 'none', border: 'none', color: '#0b332c', fontSize: '12px', fontWeight: '700', textDecoration: 'underline', cursor: 'pointer' }}
        >
          {mode === 'login' ? 'New clinic? Register here' : 'Already registered? Log in'}
        </button>
      </div>
    </div>
  );
}