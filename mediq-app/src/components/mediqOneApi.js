// src/mediqOneApi.js

const SUPABASE_URL = "https://rotbmaxzsdpyhgiacrfo.supabase.co"; // Your project URL
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvdGJtYXh6c2RweWhnaWFjcmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5OTcyOTYsImV4cCI6MjEwMTU3MzI5Nn0.5JYmpnw30VWTLIjq9aDHurD2A7JaTVETWGIjdo_Zo9g";         // Paste your public anon key here

export function createMediQOneSession() {
  return { id: `session-${Date.now()}` };
}

export function detectMediQOneLanguage(text) {
  // Simple heuristic or default to English
  if (/[\u0980-\u09FF]/.test(text)) return 'bn'; // Bengali
  if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Hindi
  return 'en';
}

export async function getMediQOneReply({ message }) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/mediq-one-brain`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return { reply: data.reply || "I received an empty response." };
  } catch (error) {
    console.error("Error communicating with MediQ One brain:", error);
    return { reply: "I'm having trouble connecting to the network right now. Please try again." };
  }
}

export async function speakMediQOne(text, language) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'bn' ? 'bn-IN' : language === 'hi' ? 'hi-IN' : 'en-US';
    window.speechSynthesis.speak(utterance);
  }
}

export function stopMediQOneSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function startMediQOneListening({ onInterim }) {
  return new Promise((resolve) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      resolve({ text: "" });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onInterim) onInterim(transcript);
      if (event.results[0].isFinal) {
        resolve({ text: transcript });
      }
    };

    recognition.onerror = () => resolve({ text: "" });
    recognition.onend = () => resolve({ text: "" });

    recognition.start();
  });
}

export function stopMediQOneListening() {
  // SpeechRecognition auto-stops on final result
}

export async function sendChatMessage(userMessage) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/mediq-one-brain`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ message: userMessage }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return data.reply || "I received an empty response.";
  } catch (error) {
    console.error("Error communicating with MediQ One brain:", error);
    return "I'm having trouble connecting to the network right now. Please try again.";
  }
}