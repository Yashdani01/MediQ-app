import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./MediQOne.css";

/**
 * MediQ One
 * Healthcare AI copilot UI.
 *
 * The component intentionally does NOT contain an LLM/API key.
 * Connect your production AI backend with:
 *
 * <MediQOne
 *   userName="Rahul"
 *   activeBooking={{ doctor: "Dr. Sen", specialty: "Cardiology", time: "10:30 AM" }}
 *   onSendMessage={async (message, context) => ({ text: "...", urgent: false })}
 *   onActionTrigger={(action) => ...}
 * />
 *
 * Voice uses the browser Web Speech API when available. For Capacitor,
 * replace/bridge startListening and speakText with your native voice layer.
 */

const ACTIONS = [
  { id: "doctors", icon: "⌁", label: "Find a doctor", hint: "Specialist or general care" },
  { id: "hospitals", icon: "＋", label: "Nearby hospitals", hint: "Emergency & hospitals" },
  { id: "dentist", icon: "◌", label: "Dental care", hint: "Dentists & appointments" },
  { id: "queue", icon: "#", label: "My queue", hint: "Active token & wait time" },
];

const TRIAGE_RULES = [
  {
    words: ["chest pain", "chest pressure", "heart pain", "buk betha", "বুকে ব্যথা", "छाती में दर्द"],
    urgent: true,
    text: "Chest pain can have serious causes. If it is severe, new, worsening, or accompanied by trouble breathing, fainting, sweating, or pain spreading to the arm, jaw, or back, seek emergency medical care now.",
  },
  {
    words: ["difficulty breathing", "can't breathe", "shortness of breath", "শ্বাসকষ্ট", "सांस लेने में दिक्कत"],
    urgent: true,
    text: "Significant difficulty breathing can be an emergency. Please seek urgent medical attention, especially if symptoms are sudden, severe, or worsening.",
  },
  {
    words: ["dentist", "tooth pain", "toothache", "দাঁতের ব্যথা", "দাঁত", "दांत में दर्द", "डेंटिस्ट"],
    urgent: false,
    text: "I can help you find dental care. For severe swelling, facial swelling, uncontrolled bleeding, or difficulty breathing/swallowing, seek urgent medical care.",
  },
  {
    words: ["fever", "জ্বর", "बुखार"],
    urgent: false,
    text: "I can help you think through next steps for a fever. Tell me the person's age, temperature, how long it has lasted, and any major symptoms.",
  },
];

function detectIntent(message = "") {
  const value = message.toLowerCase().trim();
  for (const rule of TRIAGE_RULES) {
    if (rule.words.some((word) => value.includes(word))) return rule;
  }
  return null;
}

function detectLanguage(message = "") {
  if (/[\u0980-\u09FF]/.test(message)) return "bn";
  if (/[\u0900-\u097F]/.test(message)) return "hi";
  return "en";
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function defaultGreeting(userName) {
  return {
    id: makeId(),
    role: "assistant",
    text: userName
      ? `Hi ${userName}. I'm MediQ One. I can help you navigate care, understand symptoms at a high level, find the right service, and keep track of your MediQ journey.`
      : "Hi. I'm MediQ One. I can help you navigate care, understand symptoms at a high level, find the right service, and keep track of your MediQ journey.",
    time: new Date(),
  };
}

export default function MediQOne({
  userName = "",
  activeBooking = null,
  onActionTrigger,
  onSendMessage,
  onVoiceStateChange,
  initialOpen = false,
  accentLabel = "MediQ One",
}) {
  const [open, setOpen] = useState(initialOpen);
  const [tab, setTab] = useState("assistant");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => [defaultGreeting(userName)]);
  const [typing, setTyping] = useState(false);
  const [voiceState, setVoiceState] = useState("idle");
  const [language, setLanguage] = useState("en");
  const [isSupportedVoice, setIsSupportedVoice] = useState(false);

  const listRef = useRef(null);
  const recognitionRef = useRef(null);
  const endRef = useRef(null);

  const updateVoiceState = useCallback(
    (next) => {
      setVoiceState(next);
      onVoiceStateChange?.(next);
    },
    [onVoiceStateChange]
  );

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupportedVoice(Boolean(SpeechRecognition));

    if (!SpeechRecognition) return undefined;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = "en-IN";

    recognition.onstart = () => updateVoiceState("listening");
    recognition.onerror = () => updateVoiceState("idle");
    recognition.onend = () => {
      setVoiceState((current) => (current === "listening" ? "idle" : current));
    };
    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
      const detected = detectLanguage(transcript);
      setLanguage(detected);
    };

    recognitionRef.current = recognition;
    return () => recognition.abort();
  }, [updateVoiceState]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, typing]);

  const bookingLabel = useMemo(() => {
    if (!activeBooking) return null;
    return [
      activeBooking.doctor,
      activeBooking.specialty,
      activeBooking.time,
    ].filter(Boolean).join(" · ");
  }, [activeBooking]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (voiceState === "listening") {
      recognitionRef.current.stop();
      updateVoiceState("idle");
      return;
    }

    const langMap = { en: "en-IN", bn: "bn-IN", hi: "hi-IN" };
    recognitionRef.current.lang = langMap[language] || "en-IN";
    try {
      recognitionRef.current.start();
    } catch {
      // SpeechRecognition can throw if start is called while already active.
    }
  }, [language, updateVoiceState, voiceState]);

  const speakText = useCallback(
    (text) => {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = { en: "en-IN", bn: "bn-IN", hi: "hi-IN" }[language] || "en-IN";
      utterance.rate = 0.96;
      utterance.pitch = 1;

      utterance.onstart = () => updateVoiceState("speaking");
      utterance.onend = () => updateVoiceState("idle");
      utterance.onerror = () => updateVoiceState("idle");

      window.speechSynthesis.speak(utterance);
    },
    [language, updateVoiceState]
  );

  const addAssistantMessage = useCallback(
    (text, urgent = false, speak = false) => {
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          text,
          urgent,
          time: new Date(),
        },
      ]);
      if (speak) speakText(text);
    },
    [speakText]
  );

  const submitMessage = useCallback(
    async (rawMessage) => {
      const message = rawMessage.trim();
      if (!message || typing) return;

      const detectedLanguage = detectLanguage(message);
      setLanguage(detectedLanguage);

      setMessages((current) => [
        ...current,
        { id: makeId(), role: "user", text: message, time: new Date() },
      ]);
      setInput("");
      setTyping(true);
      updateVoiceState("thinking");

      const route = detectIntent(message);

      try {
        if (onSendMessage) {
          const response = await onSendMessage(message, {
            language: detectedLanguage,
            activeBooking,
            intent: route?.words?.[0] || "general",
          });

          const responseText =
            typeof response === "string" ? response : response?.text;

          if (responseText) {
            addAssistantMessage(responseText, Boolean(response?.urgent), true);
          } else {
            addAssistantMessage(
              "I couldn't get a response from the care service right now. Please try again.",
              false,
              true
            );
          }
        } else if (route) {
          // Safe local fallback for demos. Production apps should connect onSendMessage.
          addAssistantMessage(route.text, route.urgent, true);
        } else {
          addAssistantMessage(
            "I can help with care navigation, symptoms at a high level, finding doctors or hospitals, dental care, and your MediQ queue. For a medical concern, tell me what you're experiencing and how long it has been happening.",
            false,
            true
          );
        }
      } catch {
        addAssistantMessage(
          "I'm having trouble reaching the assistant service. Please try again in a moment.",
          false,
          true
        );
      } finally {
        setTyping(false);
        updateVoiceState("idle");
      }
    },
    [
      activeBooking,
      addAssistantMessage,
      onSendMessage,
      typing,
      updateVoiceState,
    ]
  );

  const triggerAction = useCallback(
    (actionId) => {
      onActionTrigger?.(actionId);
      setOpen(true);
      setTab("assistant");

      const labels = {
        doctors: "I'd like to find a doctor.",
        hospitals: "Show me nearby hospitals.",
        dentist: "I need dental care.",
        queue: "Show my active queue.",
      };

      if (labels[actionId]) submitMessage(labels[actionId]);
    },
    [onActionTrigger, submitMessage]
  );

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage(input);
    }
  };

  return (
    <div className={`mediq-one ${open ? "is-open" : ""}`}>
      {open && (
        <button
          className="mediq-backdrop"
          aria-label="Close MediQ One"
          onClick={() => setOpen(false)}
        />
      )}

      <section className="mediq-panel" aria-hidden={!open}>
        <header className="mediq-header">
          <div className="mediq-brand">
            <div className="mediq-status-orb" aria-hidden="true">
              <span />
            </div>
            <div>
              <div className="mediq-eyebrow">{accentLabel}</div>
              <div className="mediq-title">Healthcare copilot</div>
            </div>
          </div>

          <div className="mediq-header-actions">
            <span className="mediq-live">
              <i /> Ready
            </span>
            <button
              className="mediq-icon-button"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </header>

        <div className="mediq-tabs" role="tablist">
          <button
            className={tab === "assistant" ? "active" : ""}
            onClick={() => setTab("assistant")}
            role="tab"
            aria-selected={tab === "assistant"}
          >
            AI Assistant
          </button>
          <button
            className={tab === "actions" ? "active" : ""}
            onClick={() => setTab("actions")}
            role="tab"
            aria-selected={tab === "actions"}
          >
            Quick Actions
          </button>
        </div>

        {tab === "assistant" ? (
          <>
            <div className="mediq-context-row">
              <span className="mediq-context-chip">Private care context</span>
              {bookingLabel && (
                <span className="mediq-context-chip booking">
                  <b>Next</b> {bookingLabel}
                </span>
              )}
            </div>

            <div className="mediq-chat" ref={listRef}>
              {messages.map((message) => (
                <div
                  className={`mediq-message ${message.role} ${
                    message.urgent ? "urgent" : ""
                  }`}
                  key={message.id}
                >
                  {message.role === "assistant" && (
                    <div className="mediq-avatar">M</div>
                  )}
                  <div className="mediq-bubble-wrap">
                    {message.urgent && (
                      <div className="mediq-alert-label">Urgent guidance</div>
                    )}
                    <div className="mediq-bubble">{message.text}</div>
                    <time>
                      {message.time.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                </div>
              ))}

              {typing && (
                <div className="mediq-message assistant">
                  <div className="mediq-avatar">M</div>
                  <div className="mediq-bubble-wrap">
                    <div className="mediq-bubble mediq-typing">
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="mediq-composer">
              <textarea
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  setLanguage(detectLanguage(event.target.value));
                }}
                onKeyDown={handleKeyDown}
                placeholder="Tell me what you need…"
                rows={1}
                aria-label="Message MediQ One"
              />

              <button
                className={`mediq-voice ${voiceState !== "idle" ? "active" : ""}`}
                onClick={startListening}
                disabled={!isSupportedVoice}
                aria-label={
                  isSupportedVoice
                    ? voiceState === "listening"
                      ? "Stop listening"
                      : "Start voice input"
                    : "Voice input unavailable"
                }
                title={
                  isSupportedVoice
                    ? "Voice input"
                    : "Use your native Capacitor voice bridge on Android"
                }
              >
                {voiceState === "listening" ? "■" : "◉"}
              </button>

              <button
                className="mediq-send"
                onClick={() => submitMessage(input)}
                disabled={!input.trim() || typing}
                aria-label="Send message"
              >
                ↑
              </button>
            </div>

            <div className="mediq-composer-meta">
              <span>
                {voiceState === "listening"
                  ? "Listening…"
                  : voiceState === "thinking"
                  ? "Thinking…"
                  : voiceState === "speaking"
                  ? "Speaking…"
                  : "AI guidance is not a diagnosis"}
              </span>
              <span className="mediq-language">{language.toUpperCase()}</span>
            </div>
          </>
        ) : (
          <div className="mediq-actions-view">
            <div className="mediq-actions-intro">
              <span>What do you need?</span>
              <p>Jump straight to the care task instead of explaining everything.</p>
            </div>

            <div className="mediq-action-grid">
              {ACTIONS.map((action) => (
                <button
                  className="mediq-action-card"
                  key={action.id}
                  onClick={() => triggerAction(action.id)}
                >
                  <span className="mediq-action-icon">{action.icon}</span>
                  <span>
                    <strong>{action.label}</strong>
                    <small>{action.hint}</small>
                  </span>
                  <b>↗</b>
                </button>
              ))}
            </div>

            {activeBooking && (
              <button
                className="mediq-booking-card"
                onClick={() => triggerAction("queue")}
              >
                <div>
                  <span className="mediq-card-kicker">ACTIVE CARE JOURNEY</span>
                  <strong>{activeBooking.doctor || "Your appointment"}</strong>
                  <small>
                    {[activeBooking.specialty, activeBooking.time]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                </div>
                <span className="mediq-card-arrow">→</span>
              </button>
            )}

            <div className="mediq-safety-note">
              <span>✦</span>
              MediQ One helps you navigate healthcare. Emergency symptoms should
              be assessed by an appropriate medical professional or emergency service.
            </div>
          </div>
        )}
      </section>

      <button
        className="mediq-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Close MediQ One" : "Open MediQ One"}
        aria-expanded={open}
      >
        <span className="mediq-pulse" />
        <span className="mediq-trigger-core">
          <span className="mediq-trigger-mark">M</span>
        </span>
        <span className="mediq-trigger-label">
          <b>MediQ One</b>
          <small>AI care assistant</small>
        </span>
      </button>
    </div>
  );
}
