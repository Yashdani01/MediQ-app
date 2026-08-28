/*
 * ============================================================
 * MediQ One — AI / Voice / Tool API Layer
 * ============================================================
 *
 * Architecture:
 *
 *   MediQOne.jsx
 *        ↓
 *   mediqOneApi.js
 *        ↓
 *   /api/mediq-one
 *        ↓
 *   Your secure backend / AI provider
 *        ↓
 *   MediQ tools
 *
 * This file deliberately contains NO secret API keys.
 *
 * It can work in two modes:
 *
 * 1. PRODUCTION
 *    Your backend is available at /api/mediq-one.
 *
 * 2. LOCAL FALLBACK
 *    If the backend is unavailable, MediQ One still responds to
 *    common healthcare intents so you can develop the UI.
 *
 * ============================================================
 */

/* ------------------------------------------------------------
   Configuration
------------------------------------------------------------ */

const DEFAULT_API_ENDPOINT = "/api/mediq-one";

const SESSION_STORAGE_KEY = "mediq-one-session-v1";

/* ------------------------------------------------------------
   Session / Conversation Memory
------------------------------------------------------------ */

/**
 * Creates or restores the patient's MediQ One session.
 *
 * Memory is intentionally limited to the current browser session.
 * Do not put sensitive medical records into localStorage.
 */
export function createMediQOneSession() {
  try {
    const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (existing) {
      const parsed = JSON.parse(existing);

      if (parsed && parsed.id) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn("MediQ One session restore failed:", error);
  }

  const session = {
    id:
      `mq_${Date.now()}_` +
      Math.random().toString(36).slice(2, 10),

    createdAt: new Date().toISOString(),

    updatedAt: new Date().toISOString(),

    memory: [],
  };

  saveSession(session);

  return session;
}

/**
 * Save current session.
 */
function saveSession(session) {
  try {
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify(session)
    );
  } catch (error) {
    console.warn("MediQ One session save failed:", error);
  }
}

/**
 * Add conversation memory.
 */
function updateSessionMemory(
  session,
  userMessage,
  assistantMessage
) {
  const currentMemory = Array.isArray(session?.memory)
    ? session.memory
    : [];

  const nextSession = {
    ...session,

    updatedAt: new Date().toISOString(),

    memory: [
      ...currentMemory.slice(-18),

      {
        role: "user",
        content: userMessage,
        timestamp: new Date().toISOString(),
      },

      {
        role: "assistant",
        content: assistantMessage,
        timestamp: new Date().toISOString(),
      },
    ],
  };

  saveSession(nextSession);

  return nextSession;
}

/* ------------------------------------------------------------
   Language Detection
------------------------------------------------------------ */

/**
 * Detect English / Bengali / Hindi.
 *
 * This is intentionally lightweight.
 * Your production backend should perform stronger language
 * detection when needed.
 */
export function detectMediQOneLanguage(text = "") {
  const value = String(text).toLowerCase();

  /*
   * Bengali Unicode range
   */
  if (/[\u0980-\u09ff]/.test(text)) {
    return "bn";
  }

  /*
   * Hindi / Devanagari Unicode range
   */
  if (/[\u0900-\u097f]/.test(text)) {
    return "hi";
  }

  /*
   * Common Bengali transliteration.
   */
  const bengaliWords = [
    "ami",
    "amar",
    "amake",
    "buk",
    "betha",
    "byatha",
    "daktar",
    "doctor",
    "hospital",
    "matha",
    "jor",
    "daat",
    "dant",
  ];

  if (
    bengaliWords.some((word) =>
      value.includes(word)
    )
  ) {
    return "bn";
  }

  /*
   * Common Hindi transliteration.
   */
  const hindiWords = [
    "mera",
    "meri",
    "mujhe",
    "mere",
    "dard",
    "seene",
    "sir",
    "daant",
    "dant",
    "aspataal",
    "hospital",
    "bukhar",
  ];

  if (
    hindiWords.some((word) =>
      value.includes(word)
    )
  ) {
    return "hi";
  }

  return "en";
}

/* ------------------------------------------------------------
   Intent Detection
------------------------------------------------------------ */

/**
 * Determine what the patient is trying to accomplish.
 */
export function detectMediQOneIntent(text = "") {
  const value = String(text).toLowerCase();

  /*
   * Emergency / urgent symptoms
   */
  const emergencyTerms = [
    "chest pain",
    "pressure in chest",
    "tightness in chest",
    "difficulty breathing",
    "shortness of breath",
    "can't breathe",
    "cannot breathe",
    "severe bleeding",
    "unconscious",
    "passed out",
    "fainted",
    "stroke",
    "face drooping",
    "sudden weakness",
    "severe allergic reaction",
    "anaphylaxis",
  ];

  if (
    emergencyTerms.some((term) =>
      value.includes(term)
    )
  ) {
    return "urgent_care";
  }

  /*
   * Dentist
   */
  if (
    value.includes("dentist") ||
    value.includes("dental") ||
    value.includes("tooth") ||
    value.includes("teeth") ||
    value.includes("gum") ||
    value.includes("daant") ||
    value.includes("dant")
  ) {
    return "find_dentist";
  }

  /*
   * Doctor / specialist
   */
  if (
    value.includes("doctor") ||
    value.includes("specialist") ||
    value.includes("physician") ||
    value.includes("daktar")
  ) {
    return "find_doctor";
  }

  /*
   * Hospital
   */
  if (
    value.includes("hospital") ||
    value.includes("clinic") ||
    value.includes("nearby hospital") ||
    value.includes("nearest hospital")
  ) {
    return "find_hospital";
  }

  /*
   * Queue
   */
  if (
    value.includes("token") ||
    value.includes("queue") ||
    value.includes("waiting") ||
    value.includes("turn") ||
    value.includes("appointment status")
  ) {
    return "view_queue";
  }

  /*
   * Booking
   */
  if (
    value.includes("book") ||
    value.includes("appointment") ||
    value.includes("schedule") ||
    value.includes("reserve")
  ) {
    return "book_appointment";
  }

  return "general";
}

/* ------------------------------------------------------------
   Healthcare Triage
------------------------------------------------------------ */

/**
 * Basic safety-first local triage.
 *
 * IMPORTANT:
 * This is not a diagnosis engine.
 *
 * Its job is to recognize obvious urgent phrases and tell
 * the patient to seek appropriate care.
 */
function getLocalTriageResponse(text, language = "en") {
  const intent = detectMediQOneIntent(text);

  if (intent !== "urgent_care") {
    return null;
  }

  if (language === "bn") {
    return {
      reply:
        "আপনার বলা উপসর্গটি জরুরি হতে পারে। যদি এটি এখন ঘটছে বা দ্রুত খারাপ হচ্ছে, অনুগ্রহ করে জরুরি চিকিৎসা নিন বা স্থানীয় জরুরি পরিষেবায় যোগাযোগ করুন। MediQ One রোগ নির্ণয় করতে পারে না এবং জরুরি চিকিৎসা বিলম্ব করা উচিত নয়।",

      action: {
        type: "urgent_care",
        label: "Get urgent help",
      },
    };
  }

  if (language === "hi") {
    return {
      reply:
        "आपके बताए लक्षण गंभीर हो सकते हैं। यदि यह अभी हो रहा है या तेजी से बढ़ रहा है, तो तुरंत आपातकालीन चिकित्सा सहायता लें या स्थानीय आपातकालीन सेवा से संपर्क करें। MediQ One निदान नहीं करता और आपातकालीन उपचार में देरी नहीं करनी चाहिए।",

      action: {
        type: "urgent_care",
        label: "Get urgent help",
      },
    };
  }

  return {
    reply:
      "Some symptoms can be emergencies. If this is happening now or getting worse quickly, please seek urgent medical care or contact your local emergency service. MediQ One cannot diagnose an emergency, and you should not delay treatment while waiting for an AI response.",

    action: {
      type: "urgent_care",
      label: "Get urgent help",
    },
  };
}

/* ------------------------------------------------------------
   Local Assistant
------------------------------------------------------------ */

function simulateLocalAIResponse(
  userText,
  activeBooking,
  language = "en"
) {
  const intent = detectMediQOneIntent(userText);

  /*
   * Emergency takes priority over everything else.
   */
  const triage = getLocalTriageResponse(
    userText,
    language
  );

  if (triage) {
    return triage;
  }

  /* --------------------------------------------------------
     Bengali
  -------------------------------------------------------- */

  if (language === "bn") {
    if (intent === "find_dentist") {
      return {
        reply:
          "অবশ্যই। দাঁত বা মাড়ির সমস্যার জন্য আমি আপনাকে ডেন্টাল কেয়ারের দিকে নিয়ে যেতে পারি।",

        action: {
          type: "find_dentist",
          label: "Find dental care",
        },
      };
    }

    if (intent === "find_doctor") {
      return {
        reply:
          "অবশ্যই। আপনার প্রধান উপসর্গ বা কোন ধরনের বিশেষজ্ঞ দরকার তা বলুন। আমি পরবর্তী ধাপটি সাজাতে সাহায্য করব।",

        action: {
          type: "find_doctor",
          label: "Find a doctor",
        },
      };
    }

    if (intent === "find_hospital") {
      return {
        reply:
          "আমি কাছাকাছি হাসপাতাল খুঁজতে সাহায্য করতে পারি। যদি উপসর্গ গুরুতর বা দ্রুত খারাপ হয়, অনুগ্রহ করে জরুরি চিকিৎসা নিন।",

        action: {
          type: "find_hospital",
          label: "Find a hospital",
        },
      };
    }

    if (intent === "view_queue") {
      if (activeBooking) {
        const token =
          activeBooking.number ||
          activeBooking.token ||
          activeBooking.queueToken;

        return {
          reply: token
            ? `আপনার সক্রিয় কিউ টোকেন হলো #${token}।`
            : "আপনার একটি সক্রিয় ভিজিট রয়েছে।",

          action: {
            type: "view_queue",
            label: "Open my queue",
          },
        };
      }

      return {
        reply:
          "এই সেশনে আমি কোনো সক্রিয় কিউ টোকেন দেখতে পাচ্ছি না।",

        action: {
          type: "view_queue",
          label: "View my queue",
        },
      };
    }

    return {
      reply:
        "আমি আপনাকে সাহায্য করতে প্রস্তুত। আপনি ডাক্তার খুঁজতে, হাসপাতাল খুঁজতে, কিউ দেখতে বা কোনো উপসর্গ সম্পর্কে পরবর্তী ধাপ জানতে চাইলে বলুন।",

      action: null,
    };
  }

  /* --------------------------------------------------------
     Hindi
  -------------------------------------------------------- */

  if (language === "hi") {
    if (intent === "find_dentist") {
      return {
        reply:
          "बिल्कुल। दांत या मसूड़ों से जुड़ी समस्या के लिए मैं आपको सही डेंटल केयर तक पहुंचने में मदद कर सकता हूं।",

        action: {
          type: "find_dentist",
          label: "Find dental care",
        },
      };
    }

    if (intent === "find_doctor") {
      return {
        reply:
          "बिल्कुल। अपना मुख्य लक्षण या जिस विशेषज्ञ की जरूरत है वह बताएं और मैं अगले कदम में मदद करूंगा।",

        action: {
          type: "find_doctor",
          label: "Find a doctor",
        },
      };
    }

    if (intent === "find_hospital") {
      return {
        reply:
          "मैं आपके लिए नजदीकी अस्पताल खोजने में मदद कर सकता हूं। अगर लक्षण गंभीर हैं या तेजी से बढ़ रहे हैं, तो तुरंत चिकित्सा सहायता लें।",

        action: {
          type: "find_hospital",
          label: "Find a hospital",
        },
      };
    }

    if (intent === "view_queue") {
      if (activeBooking) {
        const token =
          activeBooking.number ||
          activeBooking.token ||
          activeBooking.queueToken;

        return {
          reply: token
            ? `आपका सक्रिय क्यू टोकन #${token} है।`
            : "आपकी एक सक्रिय विजिट है।",

          action: {
            type: "view_queue",
            label: "Open my queue",
          },
        };
      }

      return {
        reply:
          "मुझे इस सत्र में कोई सक्रिय क्यू टोकन नहीं दिख रहा है।",

        action: {
          type: "view_queue",
          label: "View my queue",
        },
      };
    }

    return {
      reply:
        "मैं आपकी मदद के लिए तैयार हूं। आप डॉक्टर ढूंढना, अस्पताल ढूंढना, क्यू देखना या किसी लक्षण के अगले कदम के बारे में पूछ सकते हैं।",

      action: null,
    };
  }

  /* --------------------------------------------------------
     English
  -------------------------------------------------------- */

  if (intent === "find_dentist") {
    return {
      reply:
        "Absolutely. I can help you find dental care for tooth, gum, sensitivity, or other dental concerns.",

      action: {
        type: "find_dentist",
        label: "Find dental care",
      },
    };
  }

  if (intent === "find_doctor") {
    return {
      reply:
        "Absolutely. Tell me the main symptom or specialty you’re looking for and I’ll help route you to the right type of clinician.",

      action: {
        type: "find_doctor",
        label: "Find a doctor",
      },
    };
  }

  if (intent === "find_hospital") {
    return {
      reply:
        "I can help you locate a nearby hospital. If your symptoms are severe or rapidly worsening, please seek urgent medical care rather than waiting for a search result.",

      action: {
        type: "find_hospital",
        label: "Find a hospital",
      },
    };
  }

  if (intent === "view_queue") {
    if (activeBooking) {
      const token =
        activeBooking.number ||
        activeBooking.token ||
        activeBooking.queueToken;

      const doctor =
        activeBooking.doctorName ||
        activeBooking.doctor ||
        "your doctor";

      const hospital =
        activeBooking.hospitalName ||
        activeBooking.hospital ||
        "your hospital";

      return {
        reply: token
          ? `Your active queue token is #${token} for ${doctor} at ${hospital}.`
          : `You have an active visit with ${doctor} at ${hospital}.`,

        action: {
          type: "view_queue",
          label: "Open queue",
        },
      };
    }

    return {
      reply:
        "I don’t see an active queue token in this session.",

      action: {
        type: "view_queue",
        label: "View my queue",
      },
    };
  }

  if (intent === "book_appointment") {
    return {
      reply:
        "I can help you move toward an appointment. First, tell me which doctor or specialty you want to see.",

      action: {
        type: "find_doctor",
        label: "Find a doctor",
      },
    };
  }

  return {
    reply:
      "I’m here with you. You can ask me to find a doctor, locate a hospital, find dental care, check your queue, or help you understand the next step for a symptom.",

    action: null,
  };
}

/* ------------------------------------------------------------
   Main AI Request
------------------------------------------------------------ */

/**
 * Main entry point used by MediQOne.jsx.
 *
 * The production backend should return:
 *
 * {
 *   reply: "...",
 *   action: {
 *     type: "find_doctor",
 *     label: "Find a doctor",
 *     payload: {}
 *   },
 *   session: {}
 * }
 */
export async function getMediQOneReply({
  message,
  language = "en",
  activeBooking = null,
  history = [],
  session = createMediQOneSession(),
  apiEndpoint = DEFAULT_API_ENDPOINT,
}) {
  if (!message || !String(message).trim()) {
    return {
      reply: "Tell me what you need help with.",
      action: null,
      session,
    };
  }

  const cleanMessage = String(message).trim();

  /*
   * Always detect language locally so voice and UI can
   * immediately adapt.
   */
  const detectedLanguage =
    language || detectMediQOneLanguage(cleanMessage);

  /*
   * Request sent to your secure backend.
   *
   * IMPORTANT:
   * Never put an OpenAI or other AI provider secret here.
   */
  const payload = {
    sessionId: session.id,

    message: cleanMessage,

    language: detectedLanguage,

    history: Array.isArray(history)
      ? history.slice(-10)
      : [],

    memory: Array.isArray(session.memory)
      ? session.memory.slice(-18)
      : [],

    activeBooking,

    client: {
      source: "MediQOne",
      version: "1.0.0",
    },
  };

  /*
   * Try real backend first.
   */
  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `MediQ One API returned ${response.status}`
      );
    }

    const data = await response.json();

    const reply =
      data.reply ||
      data.message ||
      "I’m ready. What would you like to do next?";

    const nextSession =
      updateSessionMemory(
        session,
        cleanMessage,
        reply
      );

    return {
      reply,

      action:
        data.action ||
        null,

      session:
        data.session ||
        nextSession,

      metadata:
        data.metadata ||
        null,
    };
  } catch (error) {
    /*
     * Backend unavailable.
     *
     * Do NOT crash the assistant.
     * Fall back to the local intent engine.
     */
    console.warn(
      "MediQ One backend unavailable. Using local fallback.",
      error
    );

    const localResponse =
      simulateLocalAIResponse(
        cleanMessage,
        activeBooking,
        detectedLanguage
      );

    const nextSession =
      updateSessionMemory(
        session,
        cleanMessage,
        localResponse.reply
      );

    return {
      reply: localResponse.reply,

      action:
        localResponse.action ||
        null,

      session: nextSession,

      metadata: {
        mode: "local-fallback",
      },
    };
  }
}

/* ------------------------------------------------------------
   Streaming API
------------------------------------------------------------ */

/**
 * Optional streaming interface.
 *
 * Your backend can return Server-Sent Events / text chunks.
 *
 * This allows the future UI to show:
 *
 * "Let me check..."
 * "I found..."
 * "There are..."
 *
 * instead of waiting for the complete response.
 *
 * Expected backend response:
 *
 * Content-Type: text/event-stream
 *
 * data: {"type":"text","text":"Hello"}
 * data: {"type":"text","text":" there"}
 * data: {"type":"done"}
 */
export async function streamMediQOneReply({
  message,
  language = "en",
  activeBooking = null,
  history = [],
  session = createMediQOneSession(),
  apiEndpoint = DEFAULT_API_ENDPOINT,
  onText,
  onAction,
  onDone,
  onError,
}) {
  try {
    const response = await fetch(
      `${apiEndpoint}/stream`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },

        body: JSON.stringify({
          sessionId: session.id,
          message,
          language,
          activeBooking,
          history,
          memory: session.memory || [],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Streaming API returned ${response.status}`
      );
    }

    if (!response.body) {
      throw new Error(
        "Streaming is not supported by this browser."
      );
    }

    const reader =
      response.body.getReader();

    const decoder =
      new TextDecoder("utf-8");

    let buffer = "";

    let completeText = "";

    while (true) {
      const { value, done } =
        await reader.read();

      if (done) break;

      buffer += decoder.decode(
        value,
        { stream: true }
      );

      const events =
        buffer.split("\n\n");

      buffer =
        events.pop() || "";

      for (const event of events) {
        const line =
          event
            .split("\n")
            .find((item) =>
              item.startsWith("data:")
            );

        if (!line) continue;

        const raw =
          line.replace(
            /^data:\s*/,
            ""
          );

        if (!raw) continue;

        if (raw === "[DONE]") {
          continue;
        }

        let data;

        try {
          data = JSON.parse(raw);
        } catch {
          /*
           * Support plain text streams too.
           */
          completeText += raw;
          onText?.(raw);
          continue;
        }

        if (data.type === "text") {
          completeText +=
            data.text || "";

          onText?.(
            data.text || ""
          );
        }

        if (data.type === "action") {
          onAction?.(
            data.action || null
          );
        }

        if (data.type === "done") {
          onDone?.({
            reply:
              data.reply ||
              completeText,
            action:
              data.action ||
              null,
          });
        }
      }
    }

    if (completeText) {
      const nextSession =
        updateSessionMemory(
          session,
          message,
          completeText
        );

      return {
        reply: completeText,
        session: nextSession,
      };
    }

    return {
      reply: "",
      session,
    };
  } catch (error) {
    console.error(
      "MediQ One streaming error:",
      error
    );

    onError?.(error);

    throw error;
  }
}

/* ------------------------------------------------------------
   Text To Speech
------------------------------------------------------------ */

let activeUtterance = null;

/**
 * Speak an assistant response.
 *
 * Browser SpeechSynthesis is used as the fallback.
 *
 * Later you can replace this implementation with:
 *
 * OpenAI realtime audio
 * ElevenLabs
 * Azure Speech
 * Google Cloud TTS
 * Native Capacitor speech
 */
export function speakMediQOne(
  text,
  language = "en",
  onEnd
) {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window)
  ) {
    return Promise.reject(
      new Error(
        "Text-to-speech is not supported on this device."
      )
    );
  }

  stopMediQOneSpeech();

  const languageMap = {
    en: "en-US",
    bn: "bn-BD",
    hi: "hi-IN",
  };

  const utterance =
    new SpeechSynthesisUtterance(
      text
    );

  utterance.lang =
    languageMap[language] ||
    "en-US";

  /*
   * Slightly slower than default makes medical responses
   * feel less robotic.
   */
  utterance.rate = 0.94;

  utterance.pitch = 1;

  utterance.volume = 1;

  /*
   * Select a voice matching the requested language.
   */
  const voices =
    window.speechSynthesis.getVoices();

  const targetLanguage =
    utterance.lang
      .toLowerCase()
      .split("-")[0];

  const preferredVoice =
    voices.find((voice) =>
      voice.lang
        ?.toLowerCase()
        .startsWith(targetLanguage)
    );

  if (preferredVoice) {
    utterance.voice =
      preferredVoice;
  }

  activeUtterance =
    utterance;

  return new Promise(
    (resolve) => {
      let finished = false;

      const finish = () => {
        if (finished) return;

        finished = true;

        activeUtterance =
          null;

        onEnd?.();

        resolve();
      };

      utterance.onend =
        finish;

      utterance.onerror =
        finish;

      window.speechSynthesis.speak(
        utterance
      );
    }
  );
}

/**
 * Stop currently speaking AI.
 *
 * This is important for the human-like
 * "interrupt while speaking" experience.
 */
export function stopMediQOneSpeech() {
  if (
    typeof window !== "undefined" &&
    "speechSynthesis" in window
  ) {
    window.speechSynthesis.cancel();
  }

  activeUtterance =
    null;
}

/* ------------------------------------------------------------
   Voice Input
------------------------------------------------------------ */

let activeRecognition = null;

/**
 * Start browser speech recognition.
 *
 * Chrome / Android generally exposes:
 *
 * webkitSpeechRecognition
 *
 * Capacitor native speech can later be connected here.
 */
export function startMediQOneListening({
  language = "en",

  onStart,

  onEnd,

  onResult,

  onError,
}) {
  if (
    typeof window === "undefined"
  ) {
    throw new Error(
      "Voice input is not available."
    );
  }

  const Recognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!Recognition) {
    throw new Error(
      "Voice input is not supported in this browser."
    );
  }

  stopMediQOneListening();

  const recognition =
    new Recognition();

  const languageMap = {
    en: "en-US",
    bn: "bn-BD",
    hi: "hi-IN",
  };

  recognition.lang =
    languageMap[language] ||
    "en-US";

  recognition.continuous =
    false;

  recognition.interimResults =
    true;

  recognition.maxAlternatives =
    1;

  recognition.onstart =
    () => {
      onStart?.();
    };

  recognition.onend =
    () => {
      activeRecognition =
        null;

      onEnd?.();
    };

  recognition.onerror =
    (event) => {
      activeRecognition =
        null;

      let message =
        "Voice input could not start.";

      if (
        event.error ===
        "not-allowed"
      ) {
        message =
          "Microphone permission was denied.";
      }

      if (
        event.error ===
        "audio-capture"
      ) {
        message =
          "No microphone was detected.";
      }

      if (
        event.error ===
        "no-speech"
      ) {
        message =
          "I didn't hear anything. Please try again.";
      }

      onError?.(message);
    };

  recognition.onresult =
    (event) => {
      let transcript = "";

      for (
        let index =
          event.resultIndex;
        index <
        event.results.length;
        index++
      ) {
        transcript +=
          event.results[index][0]
            .transcript;
      }

      transcript =
        transcript.trim();

      if (transcript) {
        onResult?.(
          transcript
        );
      }
    };

  activeRecognition =
    recognition;

  recognition.start();

  return recognition;
}

/**
 * Stop microphone recognition.
 */
export function stopMediQOneListening() {
  try {
    activeRecognition?.stop();
  } catch {
    /*
     * Recognition may already have ended.
     */
  }

  activeRecognition =
    null;
}

/* ------------------------------------------------------------
   Tool Definitions
------------------------------------------------------------ */

/**
 * These definitions are useful when your backend uses
 * function/tool calling.
 *
 * Your AI model should be allowed to request these tools.
 */
export const MEDIQ_ONE_TOOLS = [
  {
    name: "find_doctor",

    description:
      "Find doctors based on specialty, symptom, location, language, availability, or gender preference.",

    parameters: {
      type: "object",

      properties: {
        specialty: {
          type: "string",
        },

        symptom: {
          type: "string",
        },

        location: {
          type: "string",
        },

        language: {
          type: "string",
        },
      },

      required: [],
    },
  },

  {
    name: "find_hospital",

    description:
      "Find nearby hospitals or urgent care facilities.",

    parameters: {
      type: "object",

      properties: {
        location: {
          type: "string",
        },

        emergency: {
          type: "boolean",
        },
      },

      required: [],
    },
  },

  {
    name: "find_dentist",

    description:
      "Find dental care and dentists.",

    parameters: {
      type: "object",

      properties: {
        location: {
          type: "string",
        },

        concern: {
          type: "string",
        },
      },

      required: [],
    },
  },

  {
    name: "get_queue_status",

    description:
      "Retrieve the patient's current queue or appointment status.",

    parameters: {
      type: "object",

      properties: {
        bookingId: {
          type: "string",
        },
      },

      required: [],
    },
  },

  {
    name: "book_appointment",

    description:
      "Create an appointment after the patient has selected a doctor and confirmed the appointment details.",

    parameters: {
      type: "object",

      properties: {
        doctorId: {
          type: "string",
        },

        date: {
          type: "string",
        },

        time: {
          type: "string",
        },
      },

      required: [
        "doctorId",
        "date",
        "time",
      ],
    },
  },
];

/* ------------------------------------------------------------
   Tool Event Helper
------------------------------------------------------------ */

/**
 * Convert AI tool names into the action format expected
 * by MediQOne.jsx.
 */
export function normalizeMediQOneAction(
  action
) {
  if (!action) {
    return null;
  }

  const type =
    action.type ||
    action.name;

  const map = {
    find_doctor: {
      type: "find_doctor",
      label: "Find a doctor",
    },

    find_hospital: {
      type: "find_hospital",
      label: "Find a hospital",
    },

    find_dentist: {
      type: "find_dentist",
      label: "Find dental care",
    },

    get_queue_status: {
      type: "view_queue",
      label: "Open my queue",
    },

    book_appointment: {
      type: "book_appointment",
      label: "Book appointment",
    },

    urgent_care: {
      type: "urgent_care",
      label: "Get urgent help",
    },
  };

  const normalized =
    map[type];

  if (!normalized) {
    return {
      type,
      label:
        action.label ||
        "Continue",
      payload:
        action.payload ||
        null,
    };
  }

  return {
    ...normalized,

    payload:
      action.payload ||
      action.arguments ||
      null,
  };
}

/* ------------------------------------------------------------
   Clear Current Session
------------------------------------------------------------ */

export function clearMediQOneSession() {
  try {
    sessionStorage.removeItem(
      SESSION_STORAGE_KEY
    );
  } catch (error) {
    console.warn(
      "Could not clear MediQ One session:",
      error
    );
  }
}

/* ------------------------------------------------------------
   Default Export
------------------------------------------------------------ */

export default {
  createMediQOneSession,

  detectMediQOneLanguage,

  detectMediQOneIntent,

  getMediQOneReply,

  streamMediQOneReply,

  speakMediQOne,

  stopMediQOneSpeech,

  startMediQOneListening,

  stopMediQOneListening,

  normalizeMediQOneAction,

  clearMediQOneSession,

  MEDIQ_ONE_TOOLS,
};
// ============================================================
// Compatibility helpers for MediQOne.jsx
// ============================================================

export function getSessionId() {
  const session = createMediQOneSession();
  return session.id;
}

export async function sendMediQQuery({
  message,
  userMessage,
  language = "en",
  activeBooking = null,
  history = [],
}) {
  const session = createMediQOneSession();

  const text =
    message ||
    userMessage ||
    "";

  const result = await getMediQOneReply({
    message: text,
    language,
    activeBooking,
    history,
    session,
  });

  return {
    reply: result.reply || "",
    action: result.action || null,
    session: result.session || session,
    metadata: result.metadata || null,
  };
}