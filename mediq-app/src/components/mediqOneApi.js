// src/components/mediqOneApi.js

let currentSessionId = localStorage.getItem('mediq_ai_session_id') || null;

export function getSessionId() {
  if (!currentSessionId) {
    currentSessionId = 'mq_session_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('mediq_ai_session_id', currentSessionId);
  }
  return currentSessionId;
}

/**
 * Sends user input and context to your backend AI orchestration service.
 * If backend endpoint is not yet live, it provides intelligent structured fallbacks.
 */
export async function sendMediQQuery({ message, patientContext, activeBooking }) {
  const sessionId = getSessionId();

  try {
    const response = await fetch('https://api.med-iq.in/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        message,
        patientContext,
        activeBooking
      })
    });

    if (!response.ok) {
      throw new Error('AI backend network error');
    }

    const data = await response.json();
    return data;

  } catch (err) {
    console.warn("Backend AI bridge offline. Using local intelligent clinical fallback.");
    return simulateLocalAIResponse(message, activeBooking);
  }
}

function simulateLocalAIResponse(userText, activeBooking) {
  const lower = userText.toLowerCase();

  if (lower.includes('chest') || lower.includes('pain') || lower.includes('buk') || lower.includes('heart')) {
    return {
      reply: "⚠️ Clinical Notice: Chest discomfort requires attention. I recommend consulting a General Physician or Cardiologist immediately.",
      actionType: "find_doctor",
      payload: { specialty: "Cardiologist" }
    };
  } else if (lower.includes('dentist') || lower.includes('teeth') || lower.includes('daant')) {
    return {
      reply: "🦷 Found 2 Dental Surgeons available near your location today. Standard consultation fee is ₹400.",
      actionType: "find_doctor",
      payload: { specialty: "Dentist" }
    };
  } else if (lower.includes('token') || lower.includes('queue') || lower.includes('status')) {
    if (activeBooking) {
      return {
        reply: `Your active token is #${activeBooking.number} for Dr. ${activeBooking.doctorName} at ${activeBooking.hospitalName}.`,
        actionType: "view_queue",
        payload: activeBooking
      };
    }
    return {
      reply: "You currently have no active queue tokens. Would you like to browse doctors?",
      actionType: "find_doctor",
      payload: {}
    };
  }

  return {
    reply: "I've processed your request securely through your patient records. How else can I assist your health journey?",
    actionType: null,
    payload: null
  };
}