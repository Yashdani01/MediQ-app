import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

import Login from './components/Login';
import HospitalFlow from './components/HospitalFlow';
import MyBookings from './components/MyBookings';
import Reports from './components/Reports';
import SymptomTriage from './components/SymptomTriage';
import ClinicPortal from './components/ClinicPortal';
import PhysioGuideModal from './components/PhysioGuideModal';

import './index.css';


const translations = {
  en: {
    loading: 'Loading MediQ...',
    home: 'Home',
    reports: 'Reports',
    myBookings: 'My Bookings',
    triage: 'Triage',
    greeting: 'Good Morning,',
    guest: 'Guest',
    browsingAs: 'Browsing as',
    logout: 'Logout',
    findCare: 'Find Care',
    healthAssistant: 'Health Assistant',
    language: 'Language',
    symptomsTitle: 'Know Your Symptoms',
    symptomsSubtitle: 'Detailed guide on common health signs and required medical specialists.',
  },
  bn: {
    loading: 'মেডিকিউ লোড হচ্ছে...',
    home: 'হোম',
    reports: 'রিপোর্টস',
    myBookings: 'আমার বুকিং',
    triage: 'পরামর্শ',
    greeting: 'সুপ্রভাত,',
    guest: 'অতিথি',
    browsingAs: 'অতিথি হিসেবে দেখছেন',
    logout: 'লগআউট',
    findCare: 'ডাক্তার খুঁজুন',
    healthAssistant: 'স্বাস্থ্য সহায়ক',
    language: 'ভাষা',
    symptomsTitle: 'আপনার লক্ষণ জানুন',
    symptomsSubtitle: 'সাধারণ স্বাস্থ্য লক্ষণ এবং প্রয়োজনীয় চিকিৎসকের বিশদ নির্দেশিকা।',
  },
  hi: {
    loading: 'मेडीक्यू लोड हो रहा है...',
    home: 'होम',
    reports: 'रिपोर्ट्स',
    myBookings: 'मेरी बुकिंग',
    triage: 'सलाह',
    greeting: 'सुप्रभात,',
    guest: 'अतिथि',
    browsingAs: 'अतिथि के रूप में देख रहे हैं',
    logout: 'लॉग आउट',
    findCare: 'डॉक्टर खोजें',
    healthAssistant: 'स्वास्थ्य सहायक',
    language: 'भाषा',
    symptomsTitle: 'अपने लक्षण जानें',
    symptomsSubtitle: 'सामान्य स्वास्थ्य संकेतों और आवश्यक चिकित्सा विशेषज्ञों पर विस्तृत मार्गदर्शिका।',
  },
};


/* =========================
   ICON COMPONENT
========================= */

function AppIcon({ type, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.9',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  const icons = {
    home: (
      <>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5.5 9.5V21h13V9.5" />
        <path d="M9.5 21v-6h5v6" />
      </>
    ),
    triage: (
      <>
        <path d="M3 12h4l2.5-7 5 14 2.5-7H21" />
      </>
    ),
    reports: (
      <>
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <path d="M14 3v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </>
    ),
    bookings: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <path d="M3 10h18" />
        <path d="M8 15h.01" />
        <path d="M12 15h.01" />
        <path d="M16 15h.01" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3c2.2 2.5 3.3 5.5 3.3 9S14.2 18.5 12 21" />
        <path d="M12 3C9.8 5.5 8.7 8.5 8.7 12s1.1 6.5 3.3 9" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M21 19V5a2 2 0 0 0-2-2h-5" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),
    close: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    ),
    family: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    sos: (
      <>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </>
    ),
    history: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </>
    ),
    queue: (
      <>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </>
    ),
  };

  return <svg {...common}>{icons[type]}</svg>;
}


/* =========================
   APP
========================= */

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.get('portal') === 'clinic') {
    return <ClinicPortal />;
  }

  const [session, setSession] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('home');

  const [patientProfile, setPatientProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [lang, setLang] = useState(
    localStorage.getItem('mediq_lang') || 'en'
  );

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Interactive Popup Modal States ('family' | 'symptoms' | 'queue' | 'sos' | 'physio' | null)
  const [activeModal, setActiveModal] = useState(null);

  // Feature Data States
  const [familyMembers, setFamilyMembers] = useState([
    { id: 1, name: 'Self (Primary)', relation: 'Self' }
  ]);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyRelation, setNewFamilyRelation] = useState('Parent');

  const [activeQueueToken, setActiveQueueToken] = useState(null);

  // 20 Common Symptoms Multi-Lingual Directory Data
  const commonSymptoms = {
    en: [
      { symptom: 'Severe Chest Pain & Tightness', meaning: 'Indicates potential cardiac stress, angina, or acute myocardial issues requiring immediate attention.', specialist: 'Cardiologist' },
      { symptom: 'Joint Pain & Knee Swelling', meaning: 'Points to arthritis, ligament injury, meniscus tear, or chronic joint inflammation.', specialist: 'Orthopedic' },
      { symptom: 'Persistent Skin Rash & Itching', meaning: 'Suggests allergic contact dermatitis, eczema, fungal infection, or hives.', specialist: 'Dermatologist' },
      { symptom: 'Earache & Severe Throat Pain', meaning: 'Indicates tonsillitis, middle ear infection (otitis media), or acute pharyngitis.', specialist: 'ENT Specialist' },
      { symptom: 'Irregular Periods & Pelvic Cramps', meaning: 'Points toward hormonal imbalance, ovarian cysts, PCOS, or uterine fibroids.', specialist: 'Gynecologist' },
      { symptom: 'High Fever & Body Fatigue', meaning: 'Signifies viral infections, seasonal flu, malaria, or systemic inflammation.', specialist: 'General Physician' },
      { symptom: 'Chronic Migraine & Throbbing Headache', meaning: 'Indicates vascular headache, severe tension, or neurological fatigue triggers.', specialist: 'Neurologist' },
      { symptom: 'Blurry Vision & Eye Strain', meaning: 'Points to refractive errors, astigmatism, dry eyes, or prolonged screen fatigue.', specialist: 'Ophthalmologist' },
      { symptom: 'Acid Reflux & Severe Stomach Bloating', meaning: 'Indicates chronic gastritis, acid indigestion, GERD, or dietary sensitivity.', specialist: 'Gastroenterologist' },
      { symptom: 'Shortness of Breath & Wheezing', meaning: 'Suggests bronchial asthma, COPD, bronchitis, or allergic airway obstruction.', specialist: 'Pulmonologist' },
      { symptom: 'Frequent Urination & Excessive Thirst', meaning: 'Potential indicator of blood sugar irregularities or urinary tract infection.', specialist: 'General Physician' },
      { symptom: 'Persistent Low Back Pain', meaning: 'Points to lumbar muscle strain, slipped disc, sciatica, or poor posture.', specialist: 'Orthopedic' },
      { symptom: 'Severe Toothache & Gum Bleeding', meaning: 'Indicates dental cavities, gingivitis, periodontal disease, or root abscess.', specialist: 'Dentist' },
      { symptom: 'Chronic Anxiety & Sleep Insomnia', meaning: 'Signifies high stress overload, sleep cycle disruption, or anxiety disorder.', specialist: 'General Physician' },
      { symptom: 'Sudden Hair Loss & Scalp Flaking', meaning: 'Points to alopecia areata, severe dandruff, scalp psoriasis, or nutritional deficiency.', specialist: 'Dermatologist' },
      { symptom: 'Nasal Congestion & Sinus Pressure', meaning: 'Indicates chronic sinusitis, nasal polyps, or allergic rhinitis flare-up.', specialist: 'ENT Specialist' },
      { symptom: 'Dizziness & Vertigo Spells', meaning: 'Suggests inner ear vestibular dysfunction, labyrinthitis, or orthostatic hypotension.', specialist: 'General Physician' },
      { symptom: 'Swollen Lymph Nodes in Neck', meaning: 'Indicates an active immune response fighting throat, dental, or ear infections.', specialist: 'ENT Specialist' },
      { symptom: 'Chronic Fatigue & Paleness', meaning: 'Points toward iron deficiency anemia, vitamin B12 deficiency, or general weakness.', specialist: 'General Physician' },
      { symptom: 'Persistent Ankle Sprain & Stiffness', meaning: 'Indicates ligament micro-tears, tendonitis, or insufficient joint rehabilitation.', specialist: 'Orthopedic' }
    ],
    bn: [
      { symptom: 'তীব্র বুক ব্যথা ও চাপ', meaning: 'হৃদযন্ত্রের সমস্যা বা এনজাইনার লক্ষণ হতে পারে, যা দ্রুত পরীক্ষা করা দরকার।', specialist: 'Cardiologist' },
      { symptom: 'গেঁটেবাত ও হাঁটু ফুলে যাওয়া', meaning: 'আর্থ্রাইটিস বা লিগামেন্টের আঘাতের কারণে হতে পারে।', specialist: 'Orthopedic' },
      { symptom: 'দীর্ঘস্থায়ী ত্বকে ফুসকুড়ি ও চুলকানি', meaning: 'অ্যালার্জি, একজিমা বা ফাঙ্গাল ইনফেকশনের লক্ষণ।', specialist: 'Dermatologist' },
      { symptom: 'কানে ব্যথা ও তীব্র গলা ব্যথা', meaning: 'টনসিল ইনফেকশন বা কানের সমস্যার লক্ষণ।', specialist: 'ENT Specialist' },
      { symptom: 'অনিয়মিত মাসিক ও তলপেটে ব্যথা', meaning: 'পলিসিস্টিক ওভারি (PCOS) বা হরমোনের ভারসাম্যহীনতা।', specialist: 'Gynecologist' },
      { symptom: 'উচ্চ জ্বর ও শারীরিক ক্লান্তি', meaning: 'ভাইরাল ইনফেকশন, ফ্লু বা ম্যালেরিয়ার লক্ষণ হতে পারে।', specialist: 'General Physician' },
      { symptom: 'মাইগ্রেন ও তীব্র মাথা ব্যথা', meaning: 'স্নায়বিক ক্লান্তি বা অতিরিক্ত মানসিক চাপের কারণে হয়।', specialist: 'Neurologist' },
      { symptom: 'চোখে ঝাপসা দেখা ও ক্লান্তি', meaning: 'দৃষ্টিশক্তির ত্রুটি বা চোখের শুষ্কতার সমস্যা।', specialist: 'Ophthalmologist' },
      { symptom: 'গ্যাস, অম্বল ও পেট ফাঁপা', meaning: 'গ্যাস্ট্রিক, বদহজম বা এসিডিটির সমস্যা।', specialist: 'Gastroenterologist' },
      { symptom: 'শ্বাসকষ্ট ও হাঁপানি', meaning: 'ব্রংকিয়াল অ্যাজমা বা ফুসফুসের জটিলতা।', specialist: 'Pulmonologist' },
      { symptom: 'ঘন ঘন প্রস্রাব ও অতিরিক্ত তৃষ্ণা', meaning: 'রক্তে শর্করার তারতম্য বা ইউরিন ইনফেকশনের লক্ষণ।', specialist: 'General Physician' },
      { symptom: 'কোমর ও পিঠে দীর্ঘস্থায়ী ব্যথা', meaning: 'পেশীর টান, সায়টিকা বা মেরুদণ্ডের সমস্যা।', specialist: 'Orthopedic' },
      { symptom: 'দাঁতে ব্যথা ও মাড়ি থেকে রক্তপাত', meaning: 'দাঁতের ক্ষয় বা মাড়ির ইনফেকশন (Gingivitis)।', specialist: 'Dentist' },
      { symptom: 'অতিরিক্ত দুশ্চিন্তা ও অনিদ্রা', meaning: 'মানসিক চাপ বা ঘুমের ব্যাঘাতের লক্ষণ।', specialist: 'General Physician' },
      { symptom: 'অতিরিক্ত চুল পড়া ও খুশকি', meaning: 'অ্যালোপেসিয়া বা পুষ্টির অভাবের কারণে হতে পারে।', specialist: 'Dermatologist' },
      { symptom: 'নাক বন্ধ থাকা ও সাইনাসের সমস্যা', meaning: 'সাইনুসাইটিস বা অ্যালার্জিক রাইনাইটিস।', specialist: 'ENT Specialist' },
      { symptom: 'মাথা ঘোরা ও ভারসাম্যহীনতা', meaning: 'কানের ভেতরের সমস্যা বা রক্তচাপ হ্রাসের লক্ষণ।', specialist: 'General Physician' },
      { symptom: 'গলায় লিম্ফ নোড ফুলে যাওয়া', meaning: 'গলা বা কানের ইনফেকশনের বিরুদ্ধে শরীরের প্রতিরোধ প্রতিক্রিয়া।', specialist: 'ENT Specialist' },
      { symptom: 'রক্তশূন্যতা ও চরম ক্লান্তি', meaning: 'আয়রন বা ভিটামিন বি১২ এর অভাব।', specialist: 'General Physician' },
      { symptom: 'গোড়ালি মচকে যাওয়া ও শক্ত হয়ে যাওয়া', meaning: 'লিগামেন্টের আঘাত বা টেন্ডোনাইটিস।', specialist: 'Orthopedic' }
    ],
    hi: [
      { symptom: 'तेज़ सीने में दर्द और जकड़न', meaning: 'हार्ट से जुड़ी समस्या या एनजाइना का संकेत हो सकता है, तुरंत जांच कराएं।', specialist: 'Cardiologist' },
      { symptom: 'जोड़ों का दर्द और घुटने में सूजन', meaning: 'अर्थराइटिस, लिगामेंट इंजरी या कार्टिलेज घिसने के कारण हो सकता है।', specialist: 'Orthopedic' },
      { symptom: 'त्वचा पर चकत्ते और लगातार खुजली', meaning: 'एलर्जी, एक्जिमा, फंगल इन्फेक्शन या पित्ती का संकेत।', specialist: 'Dermatologist' },
      { symptom: 'कान दर्द और गंभीर गले में खराश', meaning: 'टनसिलिटिस, कान का इन्फेक्शन या सर्दी-जुकाम का असर।', specialist: 'ENT Specialist' },
      { symptom: 'अनियमित माहवारी और पेट के निचले हिस्से में ऐंठन', meaning: 'हार्मोनल असंतुलन, पीसीओएस (PCOS) या गाइनेकोलॉजिकल समस्या।', specialist: 'Gynecologist' },
      { symptom: 'तेज़ बुखार और कमजोरी', meaning: 'वायरल इन्फेक्शन, फ्लू या मौसमी बुखार का लक्षण।', specialist: 'General Physician' },
      { symptom: 'माइग्रेन और तेज सिरदर्द', meaning: 'तनाव, नसों की थकान या सिरदर्द की समस्या।', specialist: 'Neurologist' },
      { symptom: 'धुंधला दिखना और आंखों में खिंचाव', meaning: 'नजर की कमजोरी, ड्राई आइज या स्क्रीन थकान।', specialist: 'Ophthalmologist' },
      { symptom: 'एसिडिटी और पेट फूलना', meaning: 'गैस्ट्राइटिस, अपच या जीईआरडी (GERD) की समस्या।', specialist: 'Gastroenterologist' },
      { symptom: 'सांस फूलना और घबराहट', meaning: 'अस्थमा, ब्रोंकाइटिस या श्वसन नली में रुकावट।', specialist: 'Pulmonologist' },
      { symptom: 'बार-बार पेशाब आना और अत्यधिक प्यास', meaning: 'शुगर (डाइबिटीज) या यूरिन इन्फेक्शन का शुरुआती संकेत।', specialist: 'General Physician' },
      { symptom: 'पीठ और कमर में लगातार दर्द', meaning: 'कमर की मांसपेशियों में खिंचाव, स्लिप डिस्क या साइटिका।', specialist: 'Orthopedic' },
      { symptom: 'दांतों में तेज दर्द और मसूड़ों से खून आना', meaning: 'दांतों में कीड़ा (कैविटी), पायरिया या मसूड़ों का इन्फेक्शन।', specialist: 'Dentist' },
      { symptom: 'अत्यधिक तनाव और अनिद्रा (नींद न आना)', meaning: 'मानसिक तनाव, एंग्जायटी या नींद चक्र में गड़बड़ी।', specialist: 'General Physician' },
      { symptom: 'बाल झड़ना और स्कैल्प में रूसी', meaning: 'एलोपेसिया, गंभीर डैंड्रफ या पोषण की कमी।', specialist: 'Dermatologist' },
      { symptom: 'नाक बंद होना और साइनस का दबाव', meaning: 'साइनसाइटिस, नेज़ल पॉलीप्स या एलर्जी।', specialist: 'ENT Specialist' },
      { symptom: 'चक्कर आना और सिर घूमना', meaning: 'कान के अंदरूनी संतुलन की समस्या या लो ब्लड प्रेशर।', specialist: 'General Physician' },
      { symptom: 'गले की ग्रंथियों (लिंफ नोड्स) में सूजन', meaning: 'गले या कान के इन्फेक्शन से लड़ने की प्रतिरक्षा प्रतिक्रिया।', specialist: 'ENT Specialist' },
      { symptom: 'शरीर में खून की कमी और कमजोरी', meaning: 'एनीमिया, आयरन या विटामिन बी12 की कमी।', specialist: 'General Physician' },
      { symptom: 'टखने में मोच और जकड़न', meaning: 'लिगामेंट में खिंचाव या टेंडोनाइटिस।', specialist: 'Orthopedic' }
    ]
  };


  /* =========================
     LANGUAGE
  ========================= */

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('mediq_lang', newLang);
  };

  const t = translations[lang] || translations.en;
  const currentSymptoms = commonSymptoms[lang] || commonSymptoms.en;


  /* =========================
     AUTH SESSION
  ========================= */

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);

      if (session?.user) {
        loadPatientProfile(session.user);
      } else {
        setProfileLoaded(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);

      if (session?.user) {
        loadPatientProfile(session.user);
      } else {
        setProfileLoaded(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);


  /* =========================
     PATIENT PROFILE
  ========================= */

  const loadPatientProfile = async (user) => {
    const params = new URLSearchParams(window.location.search);

    const pendingName = params.get('name');
    const pendingCity = params.get('city');

    const { data: existing } = await supabase
      .from('patients')
      .select('id, name, city')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      if (pendingName) {
        const { data: updated } = await supabase
          .from('patients')
          .update({
            name: pendingName,
            city: pendingCity || existing.city,
          })
          .eq('id', existing.id)
          .select('name, city')
          .single();

        setPatientProfile(updated);

        window.history.replaceState(
          {},
          '',
          window.location.pathname
        );
      } else {
        setPatientProfile(existing);
      }
    } else {
      const patientCode =
        'MDQ-' + Math.floor(1000 + Math.random() * 9000);

      const fullName =
        pendingName ||
        user.email?.split('@')[0] ||
        'Patient';

      const userCity = pendingCity || '';

      const { data: created } = await supabase
        .from('patients')
        .insert({
          user_id: user.id,
          name: fullName,
          patient_code: patientCode,
          city: userCity,
        })
        .select('name, city')
        .single();

      setPatientProfile(created);

      localStorage.removeItem('mediq_pending_name');
      localStorage.removeItem('mediq_pending_city');
    }

    setProfileLoaded(true);
  };


  /* =========================
     LIVE QUEUE TRACKER
  ========================= */
  useEffect(() => {
    if (!session?.user) {
      setActiveQueueToken(null);
      return;
    }

    let bookingChannel;

    const loadActiveBooking = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            hospitals (
              name
            ),
            doctors (
              name
            )
          `)
          .eq('user_id', session.user.id)
          .in('status', ['confirmed', 'upcoming', 'waiting', 'checked_in'])
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error loading active booking:', error);
          setActiveQueueToken(null);
          return;
        }

        if (data) {
          setActiveQueueToken({
            id: data.id,
            number:
              data.queue_number ||
              data.token_number ||
              data.token ||
              'Pending',

            doctorName:
              data.doctors?.name ||
              data.doctor_name ||
              'Doctor',

            hospitalName:
              data.hospitals?.name ||
              data.hospital_name ||
              'Hospital',

            status: data.status,
            appointmentDate: data.appointment_date,
            appointmentTime: data.appointment_time,
          });
        } else {
          setActiveQueueToken(null);
        }
      } catch (error) {
        console.error('Live queue error:', error);
        setActiveQueueToken(null);
      }
    };

    loadActiveBooking();


    /* REALTIME SUPABASE LISTENER */

    bookingChannel = supabase
      .channel(`patient-bookings-${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${session.user.id}`,
        },
        () => {
          loadActiveBooking();
        }
      )
      .subscribe();


    return () => {
      if (bookingChannel) {
        supabase.removeChannel(bookingChannel);
      }
    };
  }, [session?.user?.id]);


  /* =========================
     LOADING
  ========================= */

  if (loading || (session?.user && !profileLoaded)) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-logo">
          Medi<span>Q</span>.
        </div>

        <div className="app-loading-spinner" />

        <p>{t.loading}</p>
      </div>
    );
  }


  /* =========================
     LOGIN
  ========================= */

  if (!session && !isGuest) {
    return (
      <Login
        onGuestContinue={() => setIsGuest(true)}
      />
    );
  }


  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = async () => {
    setSidebarOpen(false);

    await supabase.auth.signOut();

    setIsGuest(false);
    setActiveTab('home');
    setPatientProfile(null);
    setProfileLoaded(false);
  };


  /* =========================
     USER INFO
  ========================= */

  const displayName =
    patientProfile?.name ||
    session?.user?.email?.split('@')[0] ||
    t.guest;

  const initialCity =
    patientProfile?.city || '';

  const userInitial =
    displayName?.charAt(0)?.toUpperCase() || 'G';


  /* =========================
     NAVIGATION ITEMS
  ========================= */

  const navigationItems = [
    {
      id: 'home',
      label: t.home,
      icon: 'home',
    },
    {
      id: 'triage',
      label: t.triage,
      icon: 'triage',
    },
    {
      id: 'reports',
      label: t.reports,
      icon: 'reports',
    },
    {
      id: 'bookings',
      label: t.myBookings,
      icon: 'bookings',
    },
  ];


  const handleNavigation = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };


  /* =========================
     PAGE TITLES
  ========================= */

  const pageTitles = {
    home: t.home,
    triage: t.triage,
    reports: t.reports,
    bookings: t.myBookings,
  };


  return (
    <div className="mediq-app">

      {/* MOBILE HEADER */}

      <header className="mobile-app-header">
        <button
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <AppIcon type="menu" />
        </button>

        <div className="mobile-brand">
          Medi<span>Q</span>.
        </div>

        <div className="mobile-user-avatar">
          {userInitial}
        </div>
      </header>


      {/* MOBILE SIDEBAR OVERLAY */}

      <div
        className={`sidebar-overlay ${
          sidebarOpen ? 'show' : ''
        }`}
        onClick={() => setSidebarOpen(false)}
      />


      {/* SIDEBAR (DESKTOP NAV AT TOP + UTILITIES HUB) */}

      <aside
        className={`app-sidebar ${
          sidebarOpen ? 'open' : ''
        }`}
      >
        <div className="sidebar-top">

          <div className="sidebar-brand-row">
            <div className="sidebar-brand">
              Medi<span>Q</span>.
            </div>

            <button
              className="sidebar-close-btn"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <AppIcon type="close" />
            </button>
          </div>


          {/* USER CARD */}

          <div className="sidebar-user-card">
            <div className="sidebar-avatar">
              {userInitial}
            </div>

            <div className="sidebar-user-info">
              <span className="sidebar-user-label">
                {isGuest ? t.browsingAs : 'Welcome back'}
              </span>

              <strong>
                {displayName}
              </strong>
            </div>
          </div>


          {/* DESKTOP NAVIGATION TABS IN SIDEBAR (Desktop Only via CSS class) */}

          <nav className="sidebar-nav desktop-only-nav" style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="sidebar-nav-label">
              Navigation
            </span>

            {navigationItems.map((item) => (
              <button
                key={item.id}
                className={`sidebar-nav-item ${
                  activeTab === item.id
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  handleNavigation(item.id)
                }
              >
                <span className="sidebar-nav-icon">
                  <AppIcon type={item.icon} />
                </span>

                <span>
                  {item.label}
                </span>

                {activeTab === item.id && (
                  <span className="sidebar-active-dot" />
                )}
              </button>
            ))}
          </nav>


          {/* UTILITY CARDS HUB (CARE CIRCLE, SYMPTOMS, LIVE QUEUE, SOS, PHYSIO) */}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

            {/* 1. CARE CIRCLE MODAL TRIGGER */}
            <div 
              onClick={() => setActiveModal('family')}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: '10px 12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.2s' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <span style={{ color: 'var(--gold)' }}><AppIcon type="family" size={17} /></span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>Care Circle</div>
                  <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.5)' }}>{familyMembers.length} member(s) added</div>
                </div>
              </div>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>→</span>
            </div>

            {/* 2. 20 SYMPTOMS DIRECTORY MODAL TRIGGER */}
            <div 
              onClick={() => setActiveModal('symptoms')}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: '10px 12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.2s' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <span style={{ color: 'var(--gold)' }}><AppIcon type="history" size={17} /></span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>Know Your Symptoms</div>
                  <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.5)' }}>20 multi-lingual guides</div>
                </div>
              </div>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>→</span>
            </div>

            {/* 3. PHYSIO & THERAPEUTIC YOGA MODAL TRIGGER */}
            <div 
              onClick={() => setActiveModal('physio')}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: '10px 12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.2s' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <span style={{ color: 'var(--gold)' }}><AppIcon type="history" size={17} /></span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>Physio & Yoga Guide</div>
                  <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.5)' }}>10 critical condition protocols</div>
                </div>
              </div>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>→</span>
            </div>

            {/* 4. LIVE QUEUE & BOOKING TRACKER */}
            <div 
              onClick={() => setActiveModal('queue')}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: '10px 12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.2s' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <span style={{ color: 'var(--gold)' }}><AppIcon type="queue" size={17} /></span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>Live Queue Tracker</div>
                  <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.5)' }}>{activeQueueToken ? `Token #${activeQueueToken.number}` : 'No active booking'}</div>
                </div>
              </div>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeQueueToken ? '#4ade80' : 'rgba(255,255,255,0.3)' }}></span>
            </div>

            {/* 5. EMERGENCY SOS HUB MODAL TRIGGER */}
            <div 
              onClick={() => setActiveModal('sos')}
              style={{ background: 'rgba(195, 79, 61, 0.12)', border: '1px solid rgba(195, 79, 61, 0.25)', padding: '10px 12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <span style={{ color: '#ffd8d2' }}><AppIcon type="sos" size={17} /></span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#ffd8d2' }}>Emergency & SOS</div>
                  <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.6)' }}>Ambulance & Services</div>
                </div>
              </div>
              <span style={{ fontSize: '12px', color: '#ffd8d2' }}>→</span>
            </div>

          </div>

        </div>


        {/* SIDEBAR FOOTER */}

        <div className="sidebar-footer">

          <div className="language-selector">
            <div className="language-selector-icon">
              <AppIcon type="globe" size={17} />
            </div>

            <select
              value={lang}
              onChange={(e) =>
                changeLanguage(e.target.value)
              }
            >
              <option value="en">
                English
              </option>

              <option value="bn">
                বাংলা
              </option>

              <option value="hi">
                हिन्दी
              </option>
            </select>
          </div>


          <button
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <AppIcon type="logout" size={18} />

            <span>
              {t.logout}
            </span>
          </button>
        </div>
      </aside>


      {/* INTERACTIVE POPUP MODALS */}

      {activeModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(6, 43, 37, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--white)', width: '100%', maxWidth: activeModal === 'symptoms' || activeModal === 'physio' ? '650px' : '400px', borderRadius: '24px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative', maxHeight: '85vh', overflowY: 'auto' }}>
            
            {/* CLOSE BUTTON */}
            <button 
              onClick={() => setActiveModal(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--sand-100)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink)' }}
            >
              ✕
            </button>

            {/* MODAL 1: CARE CIRCLE */}
            {activeModal === 'family' && (
              <div>
                <h3 style={{ margin: '0 0 4px', fontFamily: 'Fraunces, serif', fontSize: '20px', color: 'var(--teal-900)' }}>Care Circle</h3>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--ink-soft)' }}>Add household members so you can assign appointments to them during checkout.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {familyMembers.map((m) => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--sand-50)', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--line)' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink)' }}>{m.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--teal-700)', fontWeight: '700', background: 'var(--sand-200)', padding: '2px 8px', borderRadius: '6px' }}>{m.relation || 'Self'}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Enter family member name" 
                    value={newFamilyName}
                    onChange={(e) => setNewFamilyName(e.target.value)}
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--line)', fontSize: '13px', outline: 'none' }}
                  />
                  <select 
                    value={newFamilyRelation}
                    onChange={(e) => setNewFamilyRelation(e.target.value)}
                    style={{ padding: '10px', borderRadius: '12px', border: '1px solid var(--line)', fontSize: '12px', background: 'var(--white)' }}
                  >
                    <option value="Parent">Parent</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <button 
                  onClick={() => {
                    if (newFamilyName.trim()) {
                      setFamilyMembers([...familyMembers, { id: Date.now(), name: newFamilyName, relation: newFamilyRelation }]);
                      setNewFamilyName('');
                    }
                  }}
                  style={{ width: '100%', marginTop: '10px', background: 'var(--teal-900)', color: '#fff', border: 'none', padding: '11px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Add Family Member
                </button>
              </div>
            )}

            {/* MODAL 2: 20 SYMPTOMS MEDICAL DIRECTORY (MULTI-LINGUAL) */}
            {activeModal === 'symptoms' && (
              <div>
                <h3 style={{ margin: '0 0 4px', fontFamily: 'Fraunces, serif', fontSize: '20px', color: 'var(--teal-900)' }}>{t.symptomsTitle}</h3>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--ink-soft)' }}>{t.symptomsSubtitle}</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {currentSymptoms.map((item, idx) => (
                    <div key={idx} style={{ background: 'var(--sand-50)', padding: '12px 14px', borderRadius: '14px', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--teal-900)' }}>{item.symptom}</span>
                        <span style={{ background: 'var(--teal-900)', color: 'var(--gold)', fontSize: '10.5px', fontWeight: '700', padding: '3px 10px', borderRadius: '100px', whiteSpace: 'nowrap' }}>
                          {item.specialist}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--ink-soft)', lineHeight: '1.4' }}>{item.meaning}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MODAL 3: PHYSIO & THERAPEUTIC YOGA GUIDE */}
            {activeModal === 'physio' && (
              <PhysioGuideModal onClose={() => setActiveModal(null)} />
            )}

            {/* MODAL 4: LIVE QUEUE TRACKER */}
            {activeModal === 'queue' && (
              <div>
                <h3 style={{ margin: '0 0 4px', fontFamily: 'Fraunces, serif', fontSize: '20px', color: 'var(--teal-900)' }}>Live Queue Tracker</h3>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--ink-soft)' }}>Monitor your active hospital or clinic consultation tokens in real-time.</p>
                
                {activeQueueToken ? (
                  <div style={{ background: 'var(--sand-50)', padding: '16px', borderRadius: '16px', border: '1px solid var(--line)', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--teal-700)', textTransform: 'uppercase' }}>Active Token #{activeQueueToken.number}</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--teal-900)', margin: '6px 0' }}>Dr. {activeQueueToken.doctorName}</div>
                    <div style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>{activeQueueToken.hospitalName}</div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--ink-soft)', fontSize: '13px' }}>
                    You do not have any active queue bookings right now. Book a token from the home screen to track it live here.
                  </div>
                )}
              </div>
            )}

            {/* MODAL 5: EMERGENCY SOS & AMBULANCE */}
            {activeModal === 'sos' && (
              <div>
                <h3 style={{ margin: '0 0 4px', fontFamily: 'Fraunces, serif', fontSize: '20px', color: '#c34f3d' }}>Emergency & SOS Hub</h3>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--ink-soft)' }}>Tap any emergency service below to instantly invoke your phone dialer:</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <a href="tel:102" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fbe8e4', border: '1px solid #fca5a5', padding: '14px', borderRadius: '14px', textDecoration: 'none', color: '#c34f3d', fontWeight: '700', fontSize: '14px' }}>
                    <span>🚑 National Ambulance</span>
                    <span>102 →</span>
                  </a>
                  <a href="tel:112" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fbe8e4', border: '1px solid #fca5a5', padding: '14px', borderRadius: '14px', textDecoration: 'none', color: '#c34f3d', fontWeight: '700', fontSize: '14px' }}>
                    <span>🚨 Emergency Response (ERSS)</span>
                    <span>112 →</span>
                  </a>
                  <a href="tel:101" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fbe8e4', border: '1px solid #fca5a5', padding: '14px', borderRadius: '14px', textDecoration: 'none', color: '#c34f3d', fontWeight: '700', fontSize: '14px' }}>
                    <span>🚒 Fire Department</span>
                    <span>101 →</span>
                  </a>
                </div>
              </div>
            )}

          </div>
        </div>
      )}


      {/* MAIN APPLICATION */}

      <div className="app-main">

        {/* DESKTOP HEADER */}

        <header className="desktop-app-header">

          <div className="desktop-page-info">
            <span className="desktop-page-eyebrow">
              MediQ Patient Portal
            </span>

            <h1>
              {pageTitles[activeTab]}
            </h1>
          </div>


          <div className="desktop-header-actions">

            <div className="desktop-language">
              <AppIcon type="globe" size={17} />

              <select
                value={lang}
                onChange={(e) =>
                  changeLanguage(e.target.value)
                }
              >
                <option value="en">
                  English
                </option>

                <option value="bn">
                  বাংলা
                </option>

                <option value="hi">
                  हिन्दी
                </option>
              </select>
            </div>


            <div className="desktop-profile">
              <div className="desktop-profile-avatar">
                {userInitial}
              </div>

              <div className="desktop-profile-info">
                <strong>
                  {displayName}
                </strong>

                <span>
                  {isGuest
                    ? 'Guest access'
                    : 'Patient'}
                </span>
              </div>
            </div>

          </div>
        </header>


        {/* PAGE CONTENT */}

        <main className="app-content">

          {/* HOME */}

          {activeTab === 'home' && (
            <HospitalFlow
              user={session?.user || null}
              isGuest={isGuest}
              onLogout={handleLogout}
              displayName={displayName}
              initialCity={initialCity}
              lang={lang}
              t={t}
            />
          )}


          {/* TRIAGE */}

          {activeTab === 'triage' && (
            <SymptomTriage
              onClose={() =>
                handleNavigation('home')
              }
              onSelectSpecialty={() => {
                handleNavigation('home');
              }}
            />
          )}


          {/* REPORTS */}

          {activeTab === 'reports' && (
            <Reports
              user={session?.user || null}
              lang={lang}
            />
          )}


          {/* BOOKINGS */}

          {activeTab === 'bookings' && (
            <MyBookings />
          )}

        </main>
    </div>


    {/* MOBILE BOTTOM NAV */}

    <nav className="mobile-bottom-nav">

      {navigationItems.map((item) => (
        <button
          key={item.id}
          className={
            activeTab === item.id
              ? 'active'
              : ''
          }
          onClick={() =>
            handleNavigation(item.id)
          }
        >
          <span className="mobile-nav-icon">
            <AppIcon
              type={item.icon}
              size={21}
            />
          </span>

          <span>
            {item.label}
          </span>
        </button>
      ))}

    </nav>

  </div>
  );
}
