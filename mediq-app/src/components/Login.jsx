import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);

    if (error) setMessage(`Error: ${error.message}`);
    else setMessage('Check your email inbox for the login link!');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '32px', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#2563eb', color: '#fff', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>✙</div>
        <h2 style={{ margin: '0 0 8px', color: '#0f172a' }}>MediQ Patient Login</h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Sign in with your email to book queues & view live doctor timings</p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Enter your Gmail / Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '16px', boxSizing: 'border-box' }}
          />
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? 'Sending Link...' : 'Continue with Email'}
          </button>
        </form>

        {message && <p style={{ marginTop: '16px', fontSize: '13px', color: message.startsWith('Error') ? '#dc2626' : '#16a34a' }}>{message}</p>}
      </div>
    </div>
  );
}