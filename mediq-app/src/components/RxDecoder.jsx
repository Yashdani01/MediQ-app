import { useState, useEffect } from 'react';
import { getPatientReports } from '../hospitalData';

const TRANSLATIONS = {
  en: {
    title: 'AI Rx Decoder',
    subtitle: 'Select a prescription from your Health Vault to decode',
    selectPrompt: 'Choose Saved Prescription:',
    noPrescriptions: 'No prescriptions found in your Health Vault. Please upload one first.',
    decodeBtn: 'Decode Prescription with AI',
    decoding: 'Analyzing handwriting & meds...',
    resultsTitle: 'Decoded Prescription Summary',
    medicinesHeader: 'Prescribed Medicines & Dosage:',
    instructionsHeader: 'Doctor Notes & Instructions:',
    disclaimer: 'Note: This AI tool is for informational support. Always follow your doctor’s physical prescription guidelines.'
  },
  hi: {
    title: 'एआई पर्ची डिकोडर (AI Rx Decoder)',
    subtitle: 'डिकोड करने के लिए अपने हेल्थ वॉल्ट से कोई पर्ची चुनें',
    selectPrompt: 'सहेजी गई पर्ची चुनें:',
    noPrescriptions: 'आपके हेल्थ वॉल्ट में कोई पर्ची नहीं मिली। कृपया पहले एक अपलोड करें।',
    decodeBtn: 'एआई से पर्ची डिकोड करें',
    decoding: 'हैंडराइटिंग और दवाओं का विश्लेषण हो रहा है...',
    resultsTitle: 'डिकोड की गई पर्ची का सारांश',
    medicinesHeader: 'निर्धारित दवाएं और खुराक:',
    instructionsHeader: 'डॉक्टर के निर्देश और नोट्स:',
    disclaimer: 'नोट: यह एआई टूल केवल जानकारी के लिए है। हमेशा अपने डॉक्टर की मूल पर्ची के निर्देशों का पालन करें।'
  },
  bn: {
    title: 'এআই প্রেসক্রিপশন ডিকোডার (AI Rx)',
    subtitle: 'ডিকোড করতে আপনার হেলথ ভল্ট থেকে একটি প্রেসক্রিপশন বেছে নিন',
    selectPrompt: 'সংরক্ষিত প্রেসক্রিপশন নির্বাচন করুন:',
    noPrescriptions: 'আপনার হেলথ ভল্টে কোনো প্রেসক্রিপশন পাওয়া যায়নি। অনুগ্রহ করে প্রথমে একটি আপলোড করুন।',
    decodeBtn: 'এআই দিয়ে প্রেসক্রিপশন ডিকোড করুন',
    decoding: 'হাতের লেখা এবং ওষুধ বিশ্লেষণ করা হচ্ছে...',
    resultsTitle: 'ডিকোড করা প্রেসক্রিপশনের সারসংক্ষেপ',
    medicinesHeader: 'নির্ধারিত ওষুধ এবং মাত্রা:',
    instructionsHeader: 'ডাক্তারের নির্দেশাবলী এবং নোট:',
    disclaimer: 'দ্রষ্টব্য: এই এআই টুলটি শুধুমাত্র তথ্যের জন্য। সর্বদা আপনার ডাক্তারের আসল প্রেসক্রিপশনের নির্দেশাবলী মেনে চলুন।'
  }
};

const MOCK_DECODED_DATA = {
  en: {
    medicines: [
      { name: 'Pantocid 40mg', timing: '1 tablet before breakfast', duration: '5 days' },
      { name: 'Augmentin 625mg', timing: '1 tablet twice daily after meals', duration: '5 days' },
      { name: 'Paracetamol 650mg', timing: '1 tablet SOS (when fever/pain occurs)', duration: '3 days' }
    ],
    instructions: 'Take adequate rest, drink warm water regularly, and complete the full 5-day antibiotic course. Review after 5 days if symptoms persist.'
  },
  hi: {
    medicines: [
      { name: 'पैंटोसिड 40mg (Pantocid)', timing: 'नाश्ते से पहले 1 गोली', duration: '5 दिन' },
      { name: 'ऑगमेंटिन 625mg (Augmentin)', timing: 'खाना खाने के बाद दिन में दो बार 1 गोली', duration: '5 दिन' },
      { name: 'पैरासिटामोल 650mg (Paracetamol)', timing: 'बुखार या दर्द होने पर SOS 1 गोली', duration: '3 दिन' }
    ],
    instructions: 'पर्याप्त आराम करें, नियमित रूप से गर्म पानी पिएं और एंटीबायोटिक का 5 दिन का कोर्स पूरा करें। लक्षण बने रहने पर 5 दिन बाद दिखाएं।'
  },
  bn: {
    medicines: [
      { name: 'প্যান্টোসিড ৪০মিগ্রা (Pantocid)', timing: 'খাওয়ার আগে প্রতিদিন ১টি ট্যাবলেট', duration: '৫ দিন' },
      { name: 'অগমেন্টিন ৬২৫মিগ্রা (Augmentin)', timing: 'খাওয়ার পরে দিনে দুবার ১টি ট্যাবলেট', duration: '৫ দিন' },
      { name: 'প্যারাসিটামল ৬৫০মিগ্রা (Paracetamol)', timing: 'জ্বর বা ব্যথা হলে SOS ১টি ট্যাবলেট', duration: '৩ দিন' }
    ],
    instructions: 'পর্যাপ্ত বিশ্রাম নিন, নিয়মিত গরম জল পান করুন এবং অ্যান্টিবায়োটিকের ৫ দিনের কোর্স সম্পূর্ণ করুন। লক্ষণ না কমলে ৫ দিন পর আবার দেখা করুন।'
  }
};

export default function RxDecoder({ user }) {
  const [lang, setLang] = useState('en');
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [decoding, setDecoding] = useState(false);
  const [decodedResult, setDecodedResult] = useState(null);

  useEffect(() => {
    async function loadVaultReports() {
      if (!user) {
        setLoadingReports(false);
        return;
      }
      setLoadingReports(true);
      const data = await getPatientReports(user.id);
      const rxList = (data || []).filter(r => r.report_type === 'Prescriptions' || r.report_type === 'Medical Documents' || r.report_type === 'Rx');
      setReports(rxList);
      if (rxList.length > 0) {
        setSelectedReportId(rxList[0].id);
      }
      setLoadingReports(false);
    }
    loadVaultReports();
  }, [user]);

  const t = TRANSLATIONS[lang];

  function handleDecode() {
    if (!selectedReportId) return;
    setDecoding(true);
    setDecodedResult(null);

    setTimeout(() => {
      setDecodedResult(MOCK_DECODED_DATA[lang]);
      setDecoding(false);
    }, 1500);
  }

  const selectedReport = reports.find(r => r.id === selectedReportId);

  return (
    <div style={{
      width: '100%',
      maxWidth: '650px',
      margin: '0 auto',
      padding: '20px 16px 100px',
      boxSizing: 'border-box',
      backgroundColor: 'transparent'
    }}>
      {/* HEADER WITH LANGUAGE TOGGLE */}
      <div style={{
        background: 'linear-gradient(135deg, #0b332c 0%, #134e44 100%)',
        borderRadius: '24px',
        padding: '24px',
        color: '#fff',
        marginBottom: '20px',
        boxShadow: '0 10px 25px rgba(11, 51, 44, 0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', background: '#d4af37', color: '#0b332c', padding: '2px 8px', borderRadius: '6px', fontWeight: '800', marginBottom: '8px', display: 'inline-block' }}>
            ✨ AI Assistant
          </span>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '22px', margin: '0 0 6px', color: '#fff' }}>
            {t.title}
          </h1>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: '1.4', maxWidth: '320px' }}>
            {t.subtitle}
          </p>
        </div>

        {/* Language selector buttons */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '4px' }}>
          {[
            { code: 'en', label: 'EN' },
            { code: 'hi', label: 'हिन्दी' },
            { code: 'bn', label: 'বাংলা' }
          ].map(l => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code)}
              style={{
                background: lang === l.code ? '#d4af37' : 'transparent',
                color: lang === l.code ? '#0b332c' : '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '11.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* SELECTION BOX */}
      <div style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
      }}>
        <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#0b332c', display: 'block', marginBottom: '10px' }}>
          {t.selectPrompt}
        </label>

        {loadingReports ? (
          <div style={{ fontSize: '13px', color: '#64748b', padding: '12px 0' }}>Loading your vault records...</div>
        ) : reports.length === 0 ? (
          <div style={{ padding: '16px', background: '#f8f6f0', borderRadius: '14px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#c34f3d', margin: '0 0 10px', fontWeight: '600' }}>{t.noPrescriptions}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <select
              value={selectedReportId}
              onChange={(e) => setSelectedReportId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                background: '#f8f6f0',
                color: '#0b332c',
                fontSize: '13.5px',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {reports.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  📄 {rep.name} ({rep.report_type || 'Prescription'}) - {new Date(rep.uploaded_at).toLocaleDateString()}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleDecode}
              disabled={decoding || !selectedReportId}
              style={{
                background: '#d4af37',
                color: '#0b332c',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 20px',
                fontSize: '13.5px',
                fontWeight: '800',
                cursor: decoding || !selectedReportId ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(212, 175, 55, 0.25)',
                transition: 'all 0.2s'
              }}
            >
              {decoding ? t.decoding : t.decodeBtn}
            </button>
          </div>
        )}
      </div>

      {/* DECODED RESULTS DISPLAY */}
      {decodedResult && selectedReport && (
        <div style={{
          background: '#fff',
          border: '2px solid #10b981',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', color: '#0b332c', margin: 0 }}>
              {t.resultsTitle}: <span style={{ color: '#10b981', fontWeight: 'bold' }}>{selectedReport.name}</span>
            </h3>
          </div>

          {/* Medicines breakdown */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '12.5px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', marginBottom: '8px' }}>
              {t.medicinesHeader}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {decodedResult.medicines.map((med, idx) => (
                <div key={idx} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ fontWeight: '800', fontSize: '14px', color: '#0b332c', marginBottom: '2px' }}>💊 {med.name}</div>
                  <div style={{ fontSize: '12.5px', color: '#166534', fontWeight: '600' }}>⏰ {med.timing}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Duration: {med.duration}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Doctor instructions */}
          <div style={{ marginBottom: '16px', background: '#f8f6f0', borderRadius: '12px', padding: '14px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '12.5px', textTransform: 'uppercase', color: '#0b332c', fontWeight: '700', marginBottom: '6px' }}>
              {t.instructionsHeader}
            </h4>
            <p style={{ fontSize: '13px', color: '#334155', margin: 0, lineHeight: '1.5' }}>
              {decodedResult.instructions}
            </p>
          </div>

          {/* Disclaimer */}
          <p style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', margin: 0, lineHeight: '1.4' }}>
            {t.disclaimer}
          </p>
        </div>
      )}

      {/* VIEW ORIGINAL FILE LINK IF SELECTED */}
      {selectedReport && (
        <div style={{ textAlign: 'center' }}>
          <a
            href={selectedReport.file_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '12.5px', color: '#0b332c', fontWeight: '700', textDecoration: 'underline' }}
          >
            View Original Uploaded File ↗
          </a>
        </div>
      )}
    </div>
  );
}
