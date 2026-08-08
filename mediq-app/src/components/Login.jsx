import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [lang, setLang] = useState('en'); // 'en', 'bn', 'hi'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Translations dictionary
  const t = {
    en: {
      title: 'MediQ Patient Login',
      sub: 'Sign in to book live queues & track doctor timings',
      nameLabel: 'Patient Name',
      namePlaceholder: 'Enter your name (e.g. Yash / Siddika)',
      emailLabel: 'Gmail / Email Address',
      emailPlaceholder: 'name@example.com',
      button: 'Continue to MediQ',
      loading: 'Sending Login Link...',
      success: 'Check your email inbox for the login link!'
    },
    bn: {
      title: 'মেডি-কিউ পেশেন্ট লগইন',
      sub: 'লাইভ টিকিট বুকিং এবং ডাক্তারের সময় দেখতে সাইন ইন করুন',
      nameLabel: 'রোগীর নাম',
      namePlaceholder: 'আপনার নাম লিখুন (যেমন: ইয়াশ / সিদ্দিকা)',
      emailLabel: 'জিমেইল / ইমেল ঠিকানা',
      emailPlaceholder: 'name@example.com',
      button: 'এগিয়ে যান',
      loading: 'লগইন লিংক পাঠানো হচ্ছে...',
      success: 'আপনার ইমেল ইনবক্সে লগইন লিংক চেক করুন!'
    },
    hi: {
      title: 'मेडी-क्यू पेशेंट लॉगिन',
      sub: 'लाइव कतार बुक करने और डॉक्टर का समय देखने के लिए साइन इन करें',
      nameLabel: 'मरीज़ का नाम',
      namePlaceholder: 'अपना नाम दर्ज करें (जैसे: यश / सिद्दीका)',
      emailLabel: 'जीमेल / ईमेल पता',
      emailPlaceholder: 'name@example.com',
      button: 'आगे बढ़ें',
      loading: 'लॉगिन लिंक भेजा जा रहा है...',
      success: 'अपने ईमेल इनबॉक्स में लॉगिन लिंक चेक करें!'
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Send magic link with name stored in user metadata
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        data: {
          full_name: name || email.split('@')[0],
          language: lang
        }
      }
    });

    setLoading(false);

    if (error) setMessage(`Error: ${error.message}`);
    else setMessage(t[lang].success);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '420px', padding: '36px 28px', backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)', position: 'relative' }}>
        
        {/* Language Selector Dropdown */}
        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#f8fafc', cursor: 'pointer', outline: 'none' }}
          >
            <option value="en">🌐 English</option>
            <option value="bn">🌐 বাংলা</option>
            <option value="hi">🌐 हिंदी</option>
          </select>
        </div>

        {/* Branding Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', fontSize: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 16px rgba(37, 99, 235, 0.25)', fontWeight: 'bold' }}>✙</div>
          <h2 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '24px', fontWeight: '800' }}>{t[lang].title}</h2>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>{t[lang].sub}</p>
        </div>

        <form onSubmit={handleLogin}>
          {/* Patient Name Field */}
          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>{t[lang].nameLabel}</label>
            <input
              type="text"
              placeholder={t[lang].namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          {/* Email Field */}
          <div style={{ marginBottom: '22px', textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>{t[lang].emailLabel}</label>
            <input
              type="email"
              placeholder={t[lang].emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}>
            {loading ? t[lang].loading : t[lang].button}
          </button>
        </form>

        {message && <p style={{ marginTop: '16px', fontSize: '13px', textAlign: 'center', color: message.startsWith('Error') ? '#dc2626' : '#16a34a', fontWeight: '600' }}>{message}</p>}
      </div>
    </div>
  );
}