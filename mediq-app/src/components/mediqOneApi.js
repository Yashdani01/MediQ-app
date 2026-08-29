function makeSessionId() {
  return `mediq-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

export function createMediQOneSession() {
  return {
    id: makeSessionId(),
    createdAt: new Date().toISOString(),

    context: {
      symptoms: [],
      duration: null,
      severity: null,
      concern: null,
    },
  };
}

/* =========================================================
   LANGUAGE DETECTION
========================================================= */

export function detectMediQOneLanguage(text = '') {
  const value = String(text);

  if (/[\u0980-\u09FF]/.test(value)) {
    return 'bn';
  }

  if (/[\u0900-\u097F]/.test(value)) {
    return 'hi';
  }

  return 'en';
}

/* =========================================================
   TEXT NORMALIZATION
========================================================= */

function normalize(text = '') {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ');
}

/* =========================================================
   KEYWORD HELPERS
========================================================= */

function containsAny(text, words) {
  return words.some((word) => text.includes(word));
}

/* =========================================================
   HEALTHCARE INTENT DETECTION
========================================================= */

function detectIntent(message = '') {
  const text = normalize(message);

  if (
    containsAny(text, [
      'appointment',
      'booking',
      'booked',
      'schedule',
      'when is my doctor',
    ])
  ) {
    return 'appointment';
  }

  if (
    containsAny(text, [
      'queue',
      'token',
      'waiting',
      'wait time',
      'my turn',
      'position',
    ])
  ) {
    return 'queue';
  }

  if (
    containsAny(text, [
      'hospital',
      'emergency room',
      'clinic',
      'nearby hospital',
    ])
  ) {
    return 'hospital';
  }

  if (
    containsAny(text, [
      'doctor',
      'specialist',
      'physician',
      'dermatologist',
      'dentist',
      'cardiologist',
      'neurologist',
      'gynecologist',
      'orthopedic',
      'orthopaedic',
    ])
  ) {
    return 'doctor';
  }

  if (
    containsAny(text, [
      'symptom',
      'pain',
      'headache',
      'fever',
      'cough',
      'cold',
      'vomit',
      'vomiting',
      'nausea',
      'stomach',
      'chest',
      'breathing',
      'dizzy',
      'rash',
      'infection',
      'tooth',
      'back pain',
      'weak',
      'swelling',
      'bleeding',
    ])
  ) {
    return 'symptom';
  }

  return 'general';
}

/* =========================================================
   URGENCY ASSESSMENT

   This is NOT a diagnosis engine.
   It only identifies obvious warning signals
   for escalation.
========================================================= */

function assessUrgency(message = '') {
  const text = normalize(message);

  const emergencySignals = [
    'chest pain',
    'cannot breathe',
    'cant breathe',
    'difficulty breathing',
    'severe difficulty breathing',
    'unconscious',
    'passed out',
    'stroke',
    'face drooping',
    'sudden weakness',
    'severe bleeding',
    'coughing blood',
    'vomiting blood',
    'suicidal',
  ];

  const urgentSignals = [
    'severe pain',
    'high fever',
    'persistent vomiting',
    'severe headache',
    'fainting',
    'rapid swelling',
    'difficulty swallowing',
    'blood in stool',
  ];

  if (containsAny(text, emergencySignals)) {
    return {
      urgency: 'emergency',
      label: 'Emergency care recommended',
    };
  }

  if (containsAny(text, urgentSignals)) {
    return {
      urgency: 'urgent',
      label: 'Same-day medical assessment recommended',
    };
  }

  return {
    urgency: 'moderate',
    label: 'Healthcare guidance',
  };
}

/* =========================================================
   SYMPTOM CATEGORY
========================================================= */

function detectSymptomCategory(message = '') {
  const text = normalize(message);

  if (
    containsAny(text, [
      'headache',
      'migraine',
      'dizzy',
      'dizziness',
      'numb',
    ])
  ) {
    return 'neurological';
  }

  if (
    containsAny(text, [
      'tooth',
      'teeth',
      'gum',
      'dental',
    ])
  ) {
    return 'dental';
  }

  if (
    containsAny(text, [
      'rash',
      'skin',
      'acne',
      'itching',
    ])
  ) {
    return 'dermatology';
  }

  if (
    containsAny(text, [
      'stomach',
      'abdominal',
      'vomiting',
      'nausea',
      'diarrhea',
    ])
  ) {
    return 'digestive';
  }

  if (
    containsAny(text, [
      'chest',
      'heart',
      'palpitation',
    ])
  ) {
    return 'cardiac';
  }

  if (
    containsAny(text, [
      'cough',
      'breathing',
      'throat',
      'cold',
    ])
  ) {
    return 'respiratory';
  }

  return 'general';
}

/* =========================================================
   MAIN MEDIQ ONE RESPONSE
========================================================= */

export async function getMediQOneReply({
  message,
  activeBooking,
  session,
}) {
  /*
    Simulate processing delay.

    Replace this later with an API call to your
    backend AI orchestrator.
  */

  await new Promise((resolve) =>
    setTimeout(resolve, 500)
  );

  const text = normalize(message);

  const intent = detectIntent(text);

  const assessment = assessUrgency(text);

  /* -----------------------------------------------------
     EMERGENCY
  ----------------------------------------------------- */

  if (assessment.urgency === 'emergency') {
    return {
      reply:
        'Some of the symptoms you mentioned may require immediate medical attention. Please contact your local emergency service or go to the nearest emergency department now. Do not rely on this chat for emergency treatment.',

      assessment,

      action: {
        type: 'urgent_care',
        label: 'Find emergency care',
      },

      suggestions: [
        {
          label: 'Find nearest hospital',
          type: 'action',
          action: 'find_hospital',
        },
      ],
    };
  }

  /* -----------------------------------------------------
     APPOINTMENT
  ----------------------------------------------------- */

  if (intent === 'appointment') {
    if (activeBooking) {
      const doctor =
        activeBooking.doctorName ||
        activeBooking.doctor?.name ||
        'your doctor';

      const hospital =
        activeBooking.hospitalName ||
        activeBooking.hospital?.name ||
        '';

      const time =
        activeBooking.time ||
        activeBooking.appointmentTime ||
        activeBooking.slot ||
        '';

      return {
        reply: `You have an active appointment with ${doctor}${
          hospital ? ` at ${hospital}` : ''
        }${time ? `, scheduled for ${time}` : ''}.`,

        assessment: {
          urgency: 'low',
          label: 'Appointment information',
        },

        suggestions: [
          {
            label: 'View appointment',
            type: 'action',
            action: 'view_appointment',
            payload: {
              booking: activeBooking,
            },
          },

          {
            label: 'Check queue',
            type: 'action',
            action: 'view_queue',
            payload: {
              booking: activeBooking,
            },
          },
        ],
      };
    }

    return {
      reply:
        'I could not find an active appointment in your current MediQ session. You can view your bookings or search for a doctor to make a new appointment.',

      suggestions: [
        {
          label: 'My bookings',
          type: 'action',
          action: 'view_bookings',
        },

        {
          label: 'Find a doctor',
          type: 'action',
          action: 'find_doctor',
        },
      ],
    };
  }

  /* -----------------------------------------------------
     QUEUE
  ----------------------------------------------------- */

  if (intent === 'queue') {
    if (activeBooking) {
      const token =
        activeBooking.number ||
        activeBooking.token ||
        activeBooking.queueToken ||
        activeBooking.token_number;

      return {
        reply: token
          ? `Your current queue token is #${token}. You can open the live queue to check your position and waiting status.`
          : 'You have an active appointment. Open the live queue to check the latest waiting information.',

        assessment: {
          urgency: 'low',
          label: 'Live appointment status',
        },

        suggestions: [
          {
            label: 'Open live queue',
            type: 'action',
            action: 'view_queue',
            payload: {
              booking: activeBooking,
            },
          },
        ],
      };
    }

    return {
      reply:
        'I could not find an active queue in your current session. If you have an appointment, check My Bookings to view its queue status.',

      suggestions: [
        {
          label: 'My bookings',
          type: 'action',
          action: 'view_bookings',
        },
      ],
    };
  }

  /* -----------------------------------------------------
     HOSPITAL SEARCH
  ----------------------------------------------------- */

  if (intent === 'hospital') {
    return {
      reply:
        'I can help you find the right healthcare facility. Are you looking for a general hospital, urgent care, or a specific type of specialist service?',

      assessment: {
        urgency: 'moderate',
        label: 'Care navigation',
      },

      suggestions: [
        {
          label: 'Nearby hospitals',
          type: 'action',
          action: 'find_hospital',
        },

        {
          label: 'Urgent care',
          type: 'action',
          action: 'find_urgent_care',
        },
      ],
    };
  }

  /* -----------------------------------------------------
     DOCTOR SEARCH
  ----------------------------------------------------- */

  if (intent === 'doctor') {
    let specialty = '';

    if (text.includes('skin')) {
      specialty = 'dermatologist';
    } else if (text.includes('dental')) {
      specialty = 'dentist';
    } else if (
      text.includes('heart') ||
      text.includes('cardiologist')
    ) {
      specialty = 'cardiologist';
    } else if (
      text.includes('brain') ||
      text.includes('neurologist')
    ) {
      specialty = 'neurologist';
    } else if (
      text.includes('bone') ||
      text.includes('orthopedic')
    ) {
      specialty = 'orthopedic specialist';
    }

    return {
      reply: specialty
        ? `I can help you find a ${specialty} near you.`
        : 'I can help you find the right doctor. Tell me what symptoms or healthcare concern you have, and I can help narrow down the appropriate type of care.',

      assessment: {
        urgency: 'moderate',
        label: 'Doctor navigation',
      },

      suggestions: [
        {
          label: specialty
            ? `Find ${specialty}`
            : 'Find a doctor',

          type: 'action',
          action: 'find_doctor',

          payload: {
            specialty,
          },
        },

        {
          label: 'Describe symptoms',
          prompt:
            'I want help deciding which doctor I should see.',
        },
      ],
    };
  }

  /* -----------------------------------------------------
     SYMPTOM GUIDANCE
  ----------------------------------------------------- */

  if (intent === 'symptom') {
    const category =
      detectSymptomCategory(text);

    if (session?.context) {
      session.context.symptoms.push(message);
      session.context.concern = category;
    }

    if (assessment.urgency === 'urgent') {
      return {
        reply:
          'Based on what you described, it would be safer to seek medical assessment today. I cannot diagnose the cause through chat, but I can help you find an appropriate healthcare provider or nearby facility.',

        assessment,

        suggestions: [
          {
            label: 'Find a doctor today',
            type: 'action',
            action: 'find_doctor',
          },

          {
            label: 'Nearby hospital',
            type: 'action',
            action: 'find_hospital',
          },
        ],
      };
    }

    const questions = {
      neurological:
        'To help guide you better, when did the headache or neurological symptom begin, and did it start suddenly or gradually?',

      dental:
        'To better understand the situation, how severe is the dental pain, and is there any swelling or fever?',

      dermatology:
        'Can you tell me when the skin problem started and whether it is spreading, painful, or itchy?',

      digestive:
        'Can you tell me when the stomach symptoms began and whether you also have fever, vomiting, or severe pain?',

      respiratory:
        'How long have you had these symptoms, and are you experiencing any difficulty breathing or a high fever?',

      cardiac:
        'Can you describe the symptom in more detail? If you have severe chest pain, difficulty breathing, fainting, or sudden weakness, seek emergency care immediately.',

      general:
        'I can help you think through the next step. When did these symptoms begin, and would you describe them as mild, moderate, or severe?',
    };

    return {
      reply:
        questions[category] ||
        questions.general,

      assessment,

      suggestions: [
        {
          label: 'Mild',
          prompt: 'My symptoms are mild.',
        },

        {
          label: 'Moderate',
          prompt: 'My symptoms are moderate.',
        },

        {
          label: 'Severe',
          prompt: 'My symptoms are severe.',
        },
      ],
    };
  }

  /* -----------------------------------------------------
     GENERAL
  ----------------------------------------------------- */

  if (
    containsAny(text, [
      'hello',
      'hi',
      'hey',
    ])
  ) {
    return {
      reply:
        'Hello. I can help you understand your next healthcare step, find doctors or hospitals, manage appointments, and check your queue. What would you like help with?',

      suggestions: [
        {
          label: 'Describe symptoms',
          prompt:
            'I want help understanding my symptoms.',
        },

        {
          label: 'Find a doctor',
          prompt:
            'Help me find the right doctor.',
        },

        {
          label: 'My appointment',
          prompt:
            'Tell me about my appointment.',
        },
      ],
    };
  }

  return {
    reply:
      'I want to make sure I guide you toward the right next step. You can describe your symptoms, ask me to help find a doctor or hospital, or ask about an existing appointment or queue.',

    suggestions: [
      {
        label: 'Describe symptoms',
        prompt:
          'I want help understanding my symptoms.',
      },

      {
        label: 'Find a doctor',
        prompt:
          'Help me find the right doctor.',
      },

      {
        label: 'Nearby hospital',
        prompt:
          'I need a nearby hospital.',
      },
    ],
  };
}

/* =========================================================
   TEXT TO SPEECH
========================================================= */

export function speakMediQOne(text, language = 'en') {
  return new Promise((resolve, reject) => {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      reject(
        new Error(
          'Speech synthesis is not supported.'
        )
      );
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(text);

    const languageMap = {
      en: 'en-US',
      bn: 'bn-BD',
      hi: 'hi-IN',
    };

    utterance.lang =
      languageMap[language] || 'en-US';

    utterance.rate = 0.95;
    utterance.pitch = 1;

    utterance.onend = () => resolve();

    utterance.onerror = (event) =>
      reject(event);

    window.speechSynthesis.speak(utterance);
  });
}

export function stopMediQOneSpeech() {
  if (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window
  ) {
    window.speechSynthesis.cancel();
  }
}

/* =========================================================
   SPEECH RECOGNITION
========================================================= */

let recognitionInstance = null;

export function startMediQOneListening({
  language = 'en',
  onInterim,
}) {
  return new Promise((resolve, reject) => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      reject(
        new Error(
          'Speech recognition is not supported in this browser.'
        )
      );
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognitionInstance = recognition;

    const languageMap = {
      en: 'en-US',
      bn: 'bn-BD',
      hi: 'hi-IN',
    };

    recognition.lang =
      languageMap[language] || 'en-US';

    recognition.continuous = false;
    recognition.interimResults = true;

    let finalText = '';

    recognition.onresult = (event) => {
      let interimText = '';

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i += 1
      ) {
        const transcript =
          event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      if (interimText && onInterim) {
        onInterim(interimText);
      }
    };

    recognition.onend = () => {
      resolve({
        text: finalText,
      });
    };

    recognition.onerror = (event) => {
      reject(event.error);
    };

    recognition.start();
  });
}

export function stopMediQOneListening() {
  if (recognitionInstance) {
    try {
      recognitionInstance.stop();
    } catch (error) {
      console.warn(
        'Unable to stop speech recognition:',
        error
      );
    }

    recognitionInstance = null;
  }
}