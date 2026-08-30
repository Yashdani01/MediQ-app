import { supabase } from '../supabaseClient';

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
   LANGUAGE DETECTION (kept local — instant, no API needed)
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
   MAIN MEDIQ ONE RESPONSE — now powered by Gemini via
   the "mediq-one-brain" Supabase Edge Function
========================================================= */

export async function getMediQOneReply({
  message,
  language = 'en',
  activeBooking,
  history = [],
  userName = '',
}) {
  // Convert our message history shape into the simple
  // { role, text } shape the Edge Function expects.
  const simplifiedHistory = (history || []).map((m) => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    text: m.text,
  }));

  try {
    const { data, error } = await supabase.functions.invoke(
      'mediq-one-brain',
      {
        body: {
          message,
          language,
          history: simplifiedHistory,
          userName,
          activeBooking: activeBooking || null,
        },
      }
    );

    if (error) {
      console.error('MediQ One brain invoke error:', error);

      return {
        reply:
          'I\u2019m having trouble connecting right now. Please try again in a moment.',
        assessment: null,
        action: null,
        suggestions: [],
      };
    }

    return {
      reply:
        data?.reply ||
        'I could not get a response right now. Please try again.',
      assessment: data?.assessment || null,
      action: data?.action || null,
      suggestions: data?.suggestions || [],
    };
  } catch (err) {
    console.error('MediQ One request failed:', err);

    return {
      reply:
        'I\u2019m having trouble connecting right now. Please try again in a moment.',
      assessment: null,
      action: null,
      suggestions: [],
    };
  }
}

/* =========================================================
   TEXT TO SPEECH (unchanged — runs entirely in-browser)
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
   SPEECH RECOGNITION (unchanged — runs entirely in-browser)
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