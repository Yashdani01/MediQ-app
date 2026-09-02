import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import LiveQueueTracker from './components/LiveQueueTracker';
import RxDecoder from './components/RxDecoder';
import MediQOne from './components/MediQOne';
import BloodHub from './components/BloodHub';
import Login from './components/Login';
import HospitalFlow from './components/HospitalFlow';
import MyBookings from './components/MyBookings';
import Reports from './components/Reports';
import SymptomTriage from './components/SymptomTriage';
import ClinicPortal from './components/ClinicPortal';
import PhysioGuideModal from './components/PhysioGuideModal';
import { getMyCurrentBooking } from './hospitalData';

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
    symptoms: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </>
    ),
    physio: (
      <>
        <path d="M12 2v4" />
        <path d="M12 18v4" />
        <path d="M4.93 4.93l2.83 2.83" />
        <path d="M16.24 16.24l2.83 2.83" />
        <path d="M2 12h4" />
        <path d="M18 12h4" />
        <path d="M4.93 19.07l2.83-2.83" />
        <path d="M16.24 7.76l2.83-2.83" />
      </>
    ),
    sparkles: (
      <>
        <path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7Z" />
        <path d="M19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7Z" />
      </>
    ),
    blood: (
      <>
        <path d="M12 2s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12Z" />
        <path d="M12 8v4" />
        <path d="M10 10h4" />
      </>
    ),
    support: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9a3 3 0 0 1 6 0c0 3-3 3-3 5" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </>
    ),
  };

  return <svg {...common}>{icons[type]}</svg>;
}

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.get('portal') === 'clinic') {
    return <ClinicPortal />;
  }

  const [session, setSession] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('home');

  const [patientProfile, setPatientProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [lang, setLang] = useState(
    localStorage.getItem('mediq_lang') || 'en'
  );

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const [selectedBookingId, setSelectedBookingId] = useState(null);

  const [familyMembers, setFamilyMembers] = useState(() => {
    const saved = localStorage.getItem('mediq_family_members');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Self (Primary)', relation: 'Self' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('mediq_family_members', JSON.stringify(familyMembers));
  }, [familyMembers]);

  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyRelation, setNewFamilyRelation] = useState('Spouse');

  const [activeQueueToken, setActiveQueueToken] = useState(null);

  useEffect(() => {
    async function fetchSidebarQueue() {
      const userId = session?.user?.id; 
      if (!userId) return;

      try {
        const activeBooking = await getMyCurrentBooking(userId);
        setActiveQueueToken(activeBooking);
        
        if (activeBooking) {
          setSelectedBookingId(activeBooking.id);
        } else {
          setSelectedBookingId(null);
        }
      } catch (err) {
        console.error('Failed to load sidebar active queue:', err);
      }
    }

    fetchSidebarQueue();
  }, [session]);

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

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('mediq_lang', newLang);
  };

  const t = translations[lang] || translations.en;
  const currentSymptoms = commonSymptoms[lang] || commonSymptoms.en;

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
        window.history.replaceState({}, '', window.location.pathname);
      } else {
        setPatientProfile(existing);
      }
    } else {
      const patientCode = 'MDQ-' + Math.floor(1000 + Math.random() * 9000);
      const fullName = pendingName || user.email?.split('@')[0] || 'Patient';
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
    }
    setProfileLoaded(true);
  };

  if (loading || (session?.user && !profileLoaded)) {
    return (
      <div className="app-loading-screen">
        <div className="app-loading-logo">Medi<span>Q</span>.</div>
        <div className="app-loading-spinner" />
        <p>{t.loading}</p>
      </div>
    );
  }

  if (!session && !isGuest) {
    return <Login onGuestContinue={() => setIsGuest(true)} />;
  }

  const handleLogout = async () => {
    setSidebarOpen(false);
    await supabase.auth.signOut();
    setIsGuest(false);
    setActiveTab('home');
    setPatientProfile(null);
    setProfileLoaded(false);
  };

  const displayName = patientProfile?.name || session?.user?.email?.split('@')[0] || t.guest;
  const initialCity = patientProfile?.city || '';
  const userInitial = displayName?.charAt(0)?.toUpperCase() || 'G';

  const navigationItems = [
    { id: 'home', label: t.home, icon: 'home' },
    { id: 'triage', label: t.triage, icon: 'triage' },
    { id: 'reports', label: t.reports, icon: 'reports' },
    { id: 'bookings', label: t.myBookings, icon: 'bookings' },
  ];

  const handleNavigation = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTrackQueue = (bookingId) => {
    setSelectedBookingId(bookingId);
    setActiveTab('queue');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageTitles = {
    home: t.home,
    triage: t.triage,
    reports: t.reports,
    bookings: t.myBookings,
    rxDecoder: 'AI Rx Decoder',
    bloodHub: 'Blood Bridge Hub',
    queue: 'Live Queue Tracker',
  };

  return (
    <div className="mediq-app">
      <header className="mobile-app-header">
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          <AppIcon type="menu" />
        </button>
        <div className="mobile-brand">Medi<span>Q</span>.</div>
        <div className="mobile-user-avatar">{userInitial}</div>
      </header>

      {/* DARK GLASSMORPHIC SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          {/* Backdrop */}
          <div 
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            onClick={() => setSidebarOpen(false)} 
          />

          {/* Sidebar Drawer Container */}
          <div 
            style={{ 
              position: 'relative', 
              width: '100%', 
              maxWidth: '380px', 
              background: '#090a10', 
              color: '#fff', 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              padding: '20px', 
              overflowY: 'auto', 
              borderRight: '1px solid rgba(255,255,255,0.1)', 
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)', 
              zIndex: 10 
            }}
          >
            {/* Header Section */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h1 style={{ 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  letterSpacing: '0.05em', 
                  background: 'linear-gradient(to right, #a78bfa, #f472b6, #ffffff)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent', 
                  backgroundClip: 'text', 
                  margin: 0 
                }}>
                  MediQ
                </h1>
                <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>Smart Care. Better Health.</p>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '50%', 
                  background: 'rgba(255,255,255,0.1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  border: 'none', 
                  color: '#fff', 
                  cursor: 'pointer', 
                  fontSize: '16px',
                  transition: 'background 0.2s ease'
                }}
              >
                ✕
              </button>
            </div>

            {/* Profile Card */}
            <div 
              style={{ 
                background: 'linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0.05))', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '16px', 
                padding: '16px', 
                marginBottom: '20px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                cursor: 'pointer' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  position: 'relative', 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  background: '#7c3aed', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '18px', 
                  fontWeight: 'bold' 
                }}>
                  {userInitial}
                  <span style={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    right: 0, 
                    width: '12px', 
                    height: '12px', 
                    background: '#34d399', 
                    border: '2px solid #090a10', 
                    borderRadius: '50%' 
                  }}></span>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>Welcome back,</p>
                  <h2 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>{displayName}</h2>
                  <span style={{ 
                    display: 'inline-block', 
                    marginTop: '4px', 
                    padding: '2px 10px', 
                    borderRadius: '999px', 
                    background: 'rgba(88,28,135,0.8)', 
                    border: '1px solid rgba(168,85,247,0.3)', 
                    fontSize: '10px', 
                    color: '#d8b4fe', 
                    fontWeight: '500' 
                  }}>
                    👑 Premium Member
                  </span>
                </div>
              </div>
              <span style={{ color: '#9ca3af', fontSize: '18px' }}>›</span>
            </div>

            {/* Navigation Menu Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: 'auto' }}>
              {/* Care Circle */}
              <div 
                onClick={() => { setActiveModal('family'); setSidebarOpen(false); }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '14px', 
                  borderRadius: '12px', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16,185,129,0.2)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AppIcon type="family" size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '500', margin: 0, color: '#fff' }}>Care Circle</h3>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{familyMembers.length} member(s) added</p>
                  </div>
                </div>
                <span style={{ color: '#6b7280', fontSize: '18px' }}>›</span>
              </div>

              {/* Know Your Symptoms */}
              <div 
                onClick={() => { setActiveModal('symptoms'); setSidebarOpen(false); }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '14px', 
                  borderRadius: '12px', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59,130,246,0.2)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AppIcon type="symptoms" size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '500', margin: 0, color: '#fff' }}>Know Your Symptoms</h3>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>20 multi-lingual guides</p>
                  </div>
                </div>
                <span style={{ color: '#6b7280', fontSize: '18px' }}>›</span>
              </div>

              {/* Physio & Yoga Guide */}
              <div 
                onClick={() => { setActiveModal('physio'); setSidebarOpen(false); }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '14px', 
                  borderRadius: '12px', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16,185,129,0.2)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AppIcon type="physio" size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '500', margin: 0, color: '#fff' }}>Physio & Yoga Guide</h3>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>10 critical condition protocols</p>
                  </div>
                </div>
                <span style={{ color: '#6b7280', fontSize: '18px' }}>›</span>
              </div>

              {/* Live Queue Tracker */}
              <div 
                onClick={() => setActiveModal('queue')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '14px', 
                  borderRadius: '12px', 
                  background: activeQueueToken ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)', 
                  border: activeQueueToken ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.1)', 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: activeQueueToken ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)', color: activeQueueToken ? '#34d399' : '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AppIcon type="queue" size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '500', margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Live Queue Tracker
                      {activeQueueToken && (
                        <span style={{ fontSize: '9px', background: '#10b981', color: '#fff', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: '800' }}>
                          Live
                        </span>
                      )}
                    </h3>
                    <p style={{ fontSize: '11px', color: activeQueueToken ? '#34d399' : '#9ca3af', margin: 0 }}>
                      {activeQueueToken ? `Active Token #${activeQueueToken.queue_number || activeQueueToken.token_number || 'N/A'}` : 'No active booking'}
                    </p>
                  </div>
                </div>
                <span style={{ color: '#6b7280', fontSize: '18px' }}>›</span>
              </div>

              {/* AI Rx Decoder */}
              <div 
                onClick={() => { handleNavigation('rxDecoder'); setSidebarOpen(false); }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '14px', 
                  borderRadius: '12px', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(250,204,21,0.2)', color: '#facc15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AppIcon type="sparkles" size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '500', margin: 0, color: '#fff' }}>AI Rx Decoder</h3>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>Translate & analyze prescriptions</p>
                  </div>
                </div>
                <span style={{ color: '#6b7280', fontSize: '18px' }}>›</span>
              </div>

              {/* Blood Bridge */}
              <div 
                onClick={() => { handleNavigation('bloodHub'); setSidebarOpen(false); }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '14px', 
                  borderRadius: '12px', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(239,68,68,0.2)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AppIcon type="blood" size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '500', margin: 0, color: '#fff' }}>Blood Bridge</h3>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>Emergency requests & donors</p>
                  </div>
                </div>
                <span style={{ color: '#6b7280', fontSize: '18px' }}>›</span>
              </div>

              {/* Emergency & SOS (Highlighted) */}
              <div 
                onClick={() => { setActiveModal('sos'); setSidebarOpen(false); }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '14px', 
                  borderRadius: '12px', 
                  background: 'rgba(127,29,29,0.2)', 
                  border: '1px solid rgba(239,68,68,0.3)', 
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(239,68,68,0.2)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AppIcon type="sos" size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '500', margin: 0, color: '#f87171' }}>Emergency & SOS</h3>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>Ambulance & Services</p>
                  </div>
                </div>
                <span style={{ color: '#6b7280', fontSize: '18px' }}>›</span>
              </div>

              {/* Help & Support */}
              <div 
                onClick={() => { setActiveModal('support'); setSidebarOpen(false); }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '14px', 
                  borderRadius: '12px', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(168,85,247,0.2)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AppIcon type="support" size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '500', margin: 0, color: '#fff' }}>Help & Support</h3>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>WhatsApp & Email</p>
                  </div>
                </div>
                <span style={{ color: '#6b7280', fontSize: '18px' }}>›</span>
              </div>
            </div>

            {/* Footer Security Badge Card */}
            <div style={{ 
              marginTop: '24px', 
              padding: '16px', 
              borderRadius: '16px', 
              background: 'linear-gradient(to bottom right, rgba(88,28,135,0.4), rgba(67,56,202,0.2), transparent)', 
              border: '1px solid rgba(168,85,247,0.2)', 
              position: 'relative', 
              overflow: 'hidden' 
            }}>
              <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: '#d8b4fe', letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>
                Safe. Secure. Confidential.
              </h4>
              <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px', marginBottom: 0 }}>
                Your health data is protected with enterprise-grade security.
              </p>
            </div>

            {/* Language Selector */}
            <div style={{ 
              marginTop: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AppIcon type="globe" size={16} />
                <span style={{ fontSize: '13px', color: '#fff', fontWeight: '500' }}>Language</span>
              </div>
              <select 
                value={lang} 
                onChange={(e) => changeLanguage(e.target.value)}
                style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  border: '1px solid rgba(255,255,255,0.2)', 
                  borderRadius: '8px', 
                  padding: '6px 10px', 
                  color: '#fff', 
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <option value="en" style={{ background: '#090a10', color: '#fff' }}>English</option>
                <option value="bn" style={{ background: '#090a10', color: '#fff' }}>বাংলা</option>
                <option value="hi" style={{ background: '#090a10', color: '#fff' }}>हिन्दी</option>
              </select>
            </div>

            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              style={{ 
                marginTop: '12px',
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background 0.2s ease'
              }}
            >
              <AppIcon type="logout" size={16} />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {activeModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#090a10', width: '100%', maxWidth: activeModal === 'symptoms' || activeModal === 'physio' ? '650px' : '400px', borderRadius: '24px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', position: 'relative', maxHeight: '85vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
            <button onClick={() => setActiveModal(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>✕</button>

           {activeModal === 'family' && (
              <div>
                <h3 style={{ margin: '0 0 4px', fontFamily: 'Fraunces, serif', fontSize: '20px', color: '#fff' }}>Care Circle</h3>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#9ca3af' }}>Add household members so you can assign appointments to them during checkout.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {familyMembers.map((m) => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' }}>
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#fff' }}>{m.name}</div>
                          <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '700', background: 'rgba(16,185,129,0.2)', padding: '2px 8px', borderRadius: '6px' }}>{m.relation || 'Self'}</span>
                        </div>
                      </div>
                      
                      {m.name !== 'Self (Primary)' && (
                        <button 
                          onClick={() => setFamilyMembers(familyMembers.filter(item => item.id !== m.id))}
                          style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '13px' }}
                          title="Remove family member"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" placeholder="Enter family member name" value={newFamilyName} onChange={(e) => setNewFamilyName(e.target.value)} style={{ flex: 1, padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', fontSize: '13px', outline: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff' }} />
                  <select value={newFamilyRelation} onChange={(e) => setNewFamilyRelation(e.target.value)} style={{ padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', fontSize: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff' }}>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <button onClick={() => { if (newFamilyName.trim()) { setFamilyMembers([...familyMembers, { id: Date.now(), name: newFamilyName, relation: newFamilyRelation }]); setNewFamilyName(''); }}} style={{ width: '100%', marginTop: '10px', background: '#7c3aed', color: '#fff', border: 'none', padding: '11px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Add Family Member</button>
              </div>
            )}
            {activeModal === 'symptoms' && (
              <div>
                <h3 style={{ margin: '0 0 4px', fontFamily: 'Fraunces, serif', fontSize: '20px', color: '#fff' }}>{t.symptomsTitle}</h3>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#9ca3af' }}>{t.symptomsSubtitle}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {currentSymptoms.map((item, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#fff' }}>{item.symptom}</span>
                        <span style={{ background: '#7c3aed', color: '#fff', fontSize: '10.5px', fontWeight: '700', padding: '3px 10px', borderRadius: '100px', whiteSpace: 'nowrap' }}>{item.specialist}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af', lineHeight: '1.4' }}>{item.meaning}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeModal === 'physio' && <PhysioGuideModal onClose={() => setActiveModal(null)} />}

          {activeModal === 'queue' && (
              <LiveQueueTracker
                user={session?.user || null}
                bookingId={selectedBookingId}
                onClose={() => {
                  setActiveModal(null);
                  handleNavigation('home');
                }}
              />
            )}

            {activeModal === 'sos' && (
              <div>
                <h3 style={{ margin: '0 0 4px', fontFamily: 'Fraunces, serif', fontSize: '20px', color: '#f87171' }}>Emergency & SOS Hub</h3>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#9ca3af' }}>Tap any emergency service below to instantly invoke your phone dialer:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <a href="tel:102" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', padding: '14px', borderRadius: '14px', textDecoration: 'none', color: '#f87171', fontWeight: '700', fontSize: '14px' }}><span>🚑 National Ambulance</span><span>102 →</span></a>
                  <a href="tel:112" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', padding: '14px', borderRadius: '14px', textDecoration: 'none', color: '#f87171', fontWeight: '700', fontSize: '14px' }}><span>🚨 Emergency Response (ERSS)</span><span>112 →</span></a>
                  <a href="tel:101" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', padding: '14px', borderRadius: '14px', textDecoration: 'none', color: '#f87171', fontWeight: '700', fontSize: '14px' }}><span>🚒 Fire Department</span><span>101 →</span></a>
                </div>
              </div>
            )}

            {activeModal === 'support' && (
              <div>
                <h3 style={{ margin: '0 0 4px', fontFamily: 'Fraunces, serif', fontSize: '20px', color: '#fff' }}>MediQ Helpdesk</h3>
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#9ca3af' }}>Choose your preferred channel to connect with our support team:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <a href="https://wa.me/918585058779?text=Hello%20MediQ%20Support,%20I%20need%20assistance." target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: '14px', borderRadius: '14px', textDecoration: 'none', color: '#34d399', fontWeight: '700', fontSize: '13px' }}>
                    <span>🟢 WhatsApp Support (+91 85850 58779)</span>
                    <span>→</span>
                  </a>
                  <a href="mailto:helpdesk.mediq@gmail.com?subject=Support%20Request%20-%20MediQ" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px', borderRadius: '14px', textDecoration: 'none', color: '#fff', fontWeight: '700', fontSize: '13px' }}>
                    <span>✉️ Email Support (helpdesk.mediq@gmail.com)</span>
                    <span>→</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="app-main">
        <header className="desktop-app-header">
          <div className="desktop-page-info">
            <span className="desktop-page-eyebrow">MediQ Patient Portal</span>
            <h1>{pageTitles[activeTab]}</h1>
          </div>
          <div className="desktop-header-actions">
            <div className="desktop-language">
              <AppIcon type="globe" size={17} />
              <select value={lang} onChange={(e) => changeLanguage(e.target.value)}>
                <option value="en">English</option>
                <option value="bn">বাংলা</option>
                <option value="hi">हिन्दी</option>
              </select>
            </div>
            <div className="desktop-profile">
              <div className="desktop-profile-avatar">{userInitial}</div>
              <div className="desktop-profile-info">
                <strong>{displayName}</strong>
                <span>{isGuest ? 'Guest access' : 'Patient'}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="app-content">
          {activeTab === 'home' && (
            <HospitalFlow
              user={session?.user || null}
              isGuest={isGuest}
              onLogout={handleLogout}
              displayName={displayName}
              initialCity={initialCity}
              lang={lang}
              t={t}
              familyMembers={familyMembers}
            />
          )}
          {activeTab === 'triage' && <SymptomTriage onClose={() => handleNavigation('home')} onSelectSpecialty={() => handleNavigation('home')} />}
          {activeTab === 'reports' && <Reports user={session?.user || null} lang={lang} />}
          {activeTab === 'bookings' && <MyBookings onTrackQueue={handleTrackQueue} />}
          {activeTab === 'rxDecoder' && <RxDecoder user={session?.user || null} />}
          {activeTab === 'bloodHub' && <BloodHub user={session?.user || null} />}
          {activeTab === 'queue' && (
            <LiveQueueTracker 
              user={session?.user || null} 
              bookingId={selectedBookingId} 
              onClose={() => handleNavigation('home')} 
            />
          )}
        </main>
      </div>

      <nav className="mobile-bottom-nav">
        {navigationItems.map((item) => (
          <button key={item.id} className={activeTab === item.id ? 'active' : ''} onClick={() => handleNavigation(item.id)}>
            <span className="mobile-nav-icon"><AppIcon type={item.icon} size={21} /></span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
          <MediQOne
  userName={displayName}
  userId={session?.user?.id || null}
  activeBooking={activeBooking}
  onActionTrigger={(type, payload) => {
    if (type === 'view_queue') {
      setActiveTab('queue');
    }
    if (type === 'view_appointment') {
  setActiveBooking(payload);
  setActiveTab('bookings');
}

    if (type === 'view_bookings') {
      setActiveTab('bookings');
    }

    if (type === 'find_doctor') {
      setActiveTab('home');
    }

    if (type === 'find_hospital') {
      setActiveTab('home');
    }

    if (type === 'urgent_care') {
      setActiveTab('home');
    }
  }}
/>
    </div>
  );
}