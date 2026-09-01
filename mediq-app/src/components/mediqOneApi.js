import { supabase } from '../supabaseClient';
import {
  searchDoctors,
  bookAppointment,
  getMyCurrentBooking,
  cancelAppointment,
} from '../hospitalData';

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
   REAL TOOL EXECUTION
   These run the actual hospitalData.js functions — the same
   ones the normal booking UI uses — so anything MediQ One
   does in chat is a real, valid action in the database.
========================================================= */

async function checkDailyBookingLimit(userId) {
  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!patient) {
    // Can't check — let bookAppointment's own patient lookup handle the error.
    return { allowed: true };
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('patient_id', patient.id)
    .neq('status', 'cancelled')
    .gte('booked_at', startOfToday.toISOString());

  const DAILY_BOOKING_CAP = 3;

  return { allowed: (count || 0) < DAILY_BOOKING_CAP, count: count || 0 };
}

async function runMediQOneTool(name, args = {}, { userId } = {}) {
  if (name === 'search_doctors') {
    let results = await searchDoctors(
      args.city || '',
      args.specialty_or_symptom || ''
    );

    let cityFallbackUsed = false;

    if ((!results || results.length === 0) && args.city) {
      // No exact city match — the hospital's `city` field may not match
      // what the patient typed (it could be stored differently from the
      // `location` field shown on the Home page). Retry across all
      // locations rather than falsely reporting zero doctors.
      results = await searchDoctors('', args.specialty_or_symptom || '');
      cityFallbackUsed = true;
    }

    const doctors = (results || []).slice(0, 8).map((d) => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty,
      hospital: d.hospital?.name || '',
      city: d.hospital?.city || '',
      location: d.hospital?.location || '',
      consultation_fee: d.consultation_fee,
      status: d.status,
      delay_minutes: d.delay_minutes,
      patients_waiting: d.liveQueue,
      degrees: d.degrees,
    }));

    const resultPayload = cityFallbackUsed
      ? {
          doctors,
          note: "No hospitals matched that city name exactly, so these results are from all locations. Check each doctor's 'location' field and only tell the patient it's nearby if it genuinely matches what they said.",
        }
      : { doctors };

    return resultPayload;
  }

  if (name === 'get_my_current_booking') {
    if (!userId) {
      return { error: 'No logged-in patient found.' };
    }

    const booking = await getMyCurrentBooking(userId);

    if (!booking) {
      return { hasActiveBooking: false };
    }

    return {
      hasActiveBooking: true,
      doctor: booking.doctors?.name,
      specialty: booking.doctors?.specialty,
      hospital: booking.hospitals?.name,
      token_number: booking.token_number,
      status: booking.status,
      booking_code: booking.booking_code,
    };
  }

  if (name === 'book_appointment') {
    if (!userId) {
      return { error: 'No logged-in patient found. Ask the patient to log in first.' };
    }

    if (!args.doctor_id) {
      return { error: 'Missing doctor_id — search for the doctor again first.' };
    }

    if (!args.contact_phone) {
      return { error: 'Missing contact_phone — ask the patient for their phone number before booking.' };
    }

    const dailyLimit = await checkDailyBookingLimit(userId);

    if (!dailyLimit.allowed) {
      return {
        error:
          'Daily booking limit reached (3 bookings today). Please contact the clinic directly for further bookings today, or try again tomorrow.',
      };
    }

    const { data: doctorRow, error: doctorErr } = await supabase
      .from('doctors')
      .select('id, hospital_id, name, status')
      .eq('id', args.doctor_id)
      .single();

    if (doctorErr || !doctorRow) {
      return { error: 'Could not find that doctor. Please search again.' };
    }

    if (doctorRow.status === 'on_leave' || doctorRow.status === 'completed') {
      return { error: `Dr. ${doctorRow.name} is not available for booking right now.` };
    }

    const result = await bookAppointment(
      userId,
      doctorRow.id,
      doctorRow.hospital_id,
      'cash', // chat bookings are cash-only — UPI needs a screenshot upload done in-app
      null,
      null,
      args.contact_phone,
      'Self (Primary)',
      Boolean(args.is_priority)
    );

    if (result?.error) {
      console.error('MediQ One tool booking error:', result.error);
      return { error: 'Booking failed on our end. Please try again, or use the Home page.' };
    }

    return {
      success: true,
      booking_code: result.data?.booking_code,
      token_number: result.data?.token_number,
      doctor: doctorRow.name,
      payment_method: 'cash',
      is_priority: Boolean(args.is_priority),
    };
  }

  if (name === 'cancel_appointment') {
    if (!userId) {
      return { error: 'No logged-in patient found.' };
    }

    const booking = await getMyCurrentBooking(userId);

    if (!booking) {
      return { error: 'No active booking found to cancel.' };
    }

    const result = await cancelAppointment(booking.id);

    if (result?.error) {
      return { error: 'Could not cancel the booking. It may already be completed or cancelled.' };
    }

    return {
      success: true,
      cancelled_booking_code: booking.booking_code,
      doctor: booking.doctors?.name,
    };
  }

  return { error: `Unknown tool: ${name}` };
}

/* =========================================================
   MAIN MEDIQ ONE RESPONSE — now powered by Groq (OpenAI-
   compatible) function calling via the "mediq-one-brain"
   Supabase Edge Function. Loops: send turns -> if the model
   wants a tool, run it for real -> feed the result back ->
   repeat until it gives a plain-language reply.
========================================================= */

const MAX_TOOL_STEPS = 4;

export async function getMediQOneReply({
  message,
  language = 'en',
  activeBooking,
  history = [],
  userName = '',
  userId = null,
}) {
  const baseTurns = (history || []).map((m) => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    text: m.text,
  }));

  const turns = [...baseTurns, { role: 'user', text: message }];

  let lastDoctorResults = null;

  try {
    for (let step = 0; step < MAX_TOOL_STEPS; step += 1) {
      const { data, error } = await supabase.functions.invoke(
        'mediq-one-brain',
        {
          body: {
            turns,
            language,
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

      if (data?.type === 'function_call') {
        const { id, name, args } = data;

        // Keep the model's own tool-call turn in the transcript, then run
        // it for real and feed the result back as a tool-result turn.
        turns.push({ toolCall: { id, name, args } });

        let toolResult;

        try {
          toolResult = await runMediQOneTool(name, args, { userId });
        } catch (toolErr) {
          console.error('MediQ One tool execution failed:', toolErr);
          toolResult = { error: 'Tool execution failed.' };
        }

        if (name === 'search_doctors' && toolResult?.doctors?.length) {
          lastDoctorResults = toolResult.doctors;
        }

        turns.push({ toolResult: { id, response: toolResult } });

        // Give the model one extra turn to react in plain text to an
        // error (e.g. ask for a missing phone number) — if it errors
        // again right after, stop looping and surface something useful
        // instead of burning through the whole step budget silently.
        if (toolResult?.error && step >= 1) {
          return {
            reply:
              "I need a bit more information to finish that — could you share your contact phone number, or tell me which doctor you'd like to book with?",
            assessment: null,
            action: null,
            suggestions: [],
          };
        }

        continue;
      }

      const suggestions = lastDoctorResults
        ? lastDoctorResults.slice(0, 4).map((d) => ({
            label: `Book with Dr. ${d.name}${d.consultation_fee ? ` — ₹${d.consultation_fee}` : ''}`,
            prompt: `I'd like to book an appointment with Dr. ${d.name} (${d.specialty}) at ${d.hospital}.`,
          }))
        : (data?.suggestions || []);

      return {
        reply:
          data?.reply ||
          'I could not get a response right now. Please try again.',
        assessment: data?.assessment || null,
        action: data?.action || null,
        suggestions,
      };
    }

    return {
      reply:
        "I'm having trouble completing that right now. Please try again, or use the Home page search.",
      assessment: null,
      action: null,
      suggestions: [],
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
      bn: 'bn-IN',
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