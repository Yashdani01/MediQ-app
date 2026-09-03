import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import './MediQOne.css';

import {
  createMediQOneSession,
  detectMediQOneLanguage,
  getMediQOneReply,
  speakMediQOne,
  stopMediQOneSpeech,
  startMediQOneListening,
  stopMediQOneListening,
} from './mediqOneApi';

const STARTER_PROMPTS = [
  {
    id: 'symptoms',
    icon: '✦',
    title: 'Describe symptoms',
    subtitle: 'Tell me what you are experiencing',
    prompt: 'I want help understanding my symptoms.',
  },
  {
    id: 'care',
    icon: '⌖',
    title: 'Find the right care',
    subtitle: 'Doctor, specialist, or hospital',
    prompt: 'Help me find the right type of doctor.',
  },
  {
    id: 'appointment',
    icon: '◷',
    title: 'My appointment',
    subtitle: 'Check booking and appointment details',
    prompt: 'Tell me about my appointment.',
  },
  {
    id: 'queue',
    icon: '#',
    title: 'Check my queue',
    subtitle: 'Live token and waiting information',
    prompt: 'Check my queue status.',
  },
];

const LABELS = {
  en: {
    greeting: 'How can I support your care?',
    subGreeting:
      'Describe what is happening, or ask me to help you find the right next step.',
    placeholder: 'Describe symptoms or ask a healthcare question...',
    listening: 'Listening',
    thinking: 'Thinking',
    speaking: 'Speaking',
    stop: 'Stop',
    close: 'Close MediQ One',
    available: 'Healthcare copilot ready',
    send: 'Send',
    voice: 'Voice assistant',
    latest: 'Latest',
    disclaimer:
      'MediQ One provides healthcare guidance and navigation. It does not replace professional medical diagnosis or emergency services.',
    listen: 'Listen',
    stopListening: 'Stop',
  },

  bn: {
    greeting: 'কীভাবে আপনার যত্নে সাহায্য করতে পারি?',
    subGreeting:
      'আপনার সমস্যা বলুন অথবা সঠিক চিকিৎসার পরবর্তী ধাপ খুঁজতে সাহায্য নিন।',
    placeholder: 'আপনার উপসর্গ বা স্বাস্থ্য প্রশ্ন লিখুন...',
    listening: 'শুনছি',
    thinking: 'ভাবছি',
    speaking: 'বলছি',
    stop: 'থামুন',
    close: 'MediQ One বন্ধ করুন',
    available: 'স্বাস্থ্য সহকারী প্রস্তুত',
    send: 'পাঠান',
    voice: 'ভয়েস সহকারী',
    latest: 'সর্বশেষ',
    disclaimer:
      'MediQ One স্বাস্থ্য নির্দেশনা ও নেভিগেশন দেয়। এটি চিকিৎসকের রোগ নির্ণয়ের বিকল্প নয়।',
    listen: 'শুনুন',
    stopListening: 'থামুন',
  },

  hi: {
    greeting: 'मैं आपकी देखभाल में कैसे मदद कर सकता हूँ?',
    subGreeting:
      'बताएं कि क्या समस्या है, या सही स्वास्थ्य सेवा का अगला कदम खोजने में मदद लें।',
    placeholder: 'लक्षण बताएं या स्वास्थ्य संबंधी प्रश्न पूछें...',
    listening: 'सुन रहा हूँ',
    thinking: 'सोच रहा हूँ',
    speaking: 'बोल रहा हूँ',
    stop: 'रोकें',
    close: 'MediQ One बंद करें',
    available: 'हेल्थकेयर कोपायलट तैयार है',
    send: 'भेजें',
    voice: 'वॉइस असिस्टेंट',
    latest: 'नवीनतम',
    disclaimer:
      'MediQ One स्वास्थ्य मार्गदर्शन और नेविगेशन देता है। यह पेशेवर चिकित्सा निदान का विकल्प नहीं है।',
    listen: 'सुनें',
    stopListening: 'रोकें',
  },
};

function makeId(prefix = 'mq') {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function getBookingInfo(booking) {
  if (!booking) return null;

  return {
    doctor:
      booking.doctorName ||
      booking.doctor?.name ||
      (typeof booking.doctor === 'string' ? booking.doctor : '') ||
      'Your doctor',

    hospital:
      booking.hospitalName ||
      booking.hospital?.name ||
      (typeof booking.hospital === 'string' ? booking.hospital : '') ||
      '',

    time:
      booking.time ||
      booking.appointmentTime ||
      booking.slot ||
      '',

    token:
      booking.number ||
      booking.token ||
      booking.queueToken ||
      booking.queue_number ||
      booking.token_number ||
      '',
  };
}

function Icon({ name, size = 18 }) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  if (name === 'close') {
    return (
      <svg {...props}>
        <path d="M6 6l12 12" />
        <path d="M18 6L6 18" />
      </svg>
    );
  }

  if (name === 'mic') {
    return (
      <svg {...props}>
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <path d="M12 18v4" />
        <path d="M8 22h8" />
      </svg>
    );
  }

  if (name === 'send') {
    return (
      <svg {...props}>
        <path d="M22 2L11 13" />
        <path d="M22 2l-7 20-4-9-9-4Z" />
      </svg>
    );
  }

  if (name === 'spark') {
    return (
      <svg {...props}>
        <path d="M12 2l1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7Z" />
        <path d="M19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7Z" />
      </svg>
    );
  }

  if (name === 'arrow') {
    return (
      <svg {...props}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    );
  }

  if (name === 'plus') {
    return (
      <svg {...props}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    );
  }

  return null;
}

export default function MediQOne({
  userName = '',
  userId = null,
  activeBooking = null,
  onActionTrigger,
  onSendMessage,
  onVoiceStateChange,
  initialOpen = false,
  accentLabel = 'MediQ One',
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('idle');
  const [language, setLanguage] = useState('en');
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [hasScrolledUp, setHasScrolledUp] = useState(false);

  const listRef = useRef(null);
  const sessionRef = useRef(null);

  const booking = useMemo(
    () => getBookingInfo(activeBooking),
    [activeBooking]
  );

  const copy = LABELS[language] || LABELS.en;

  useEffect(() => {
    if (!sessionRef.current) {
      sessionRef.current = createMediQOneSession();
    }
  }, []);

  useEffect(() => {
    if (!open || messages.length > 0) return;

    const greeting = userName
      ? `Hello ${userName}. I'm MediQ One, your healthcare copilot.`
      : `Hello. I'm MediQ One, your healthcare copilot.`;

    setMessages([
      {
        id: makeId('assistant'),
        role: 'assistant',
        text: greeting,
        time: new Date(),
      },
    ]);
  }, [open, messages.length, userName]);

  useEffect(() => {
    if (!open || !listRef.current || hasScrolledUp) return;

    const element = listRef.current;

    requestAnimationFrame(() => {
      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth',
      });
    });
  }, [messages, status, open, hasScrolledUp]);

  useEffect(() => {
    return () => {
      stopMediQOneSpeech();
      stopMediQOneListening();
    };
  }, []);

  const updateStatus = useCallback(
    (nextStatus) => {
      setStatus(nextStatus);
      onVoiceStateChange?.(nextStatus);
    },
    [onVoiceStateChange]
  );

  const closeAssistant = useCallback(() => {
    stopMediQOneSpeech();
    stopMediQOneListening();

    setSpeakingMessageId(null);
    setStatus('idle');
    setOpen(false);
  }, []);

  const triggerAction = useCallback(
    (type, payload = null) => {
      if (!type) return;

      onActionTrigger?.(type, payload);
    },
    [onActionTrigger]
  );

  const speakMessage = useCallback(
    async (text, messageId) => {
      if (!text) return;

      if (speakingMessageId === messageId) {
        stopMediQOneSpeech();
        setSpeakingMessageId(null);
        updateStatus('idle');
        return;
      }

      stopMediQOneSpeech();

      setSpeakingMessageId(messageId);
      updateStatus('speaking');

      try {
        await speakMediQOne(text, language);
      } catch (error) {
        console.warn('MediQ One speech failed:', error);
      } finally {
        setSpeakingMessageId(null);
        updateStatus('idle');
      }
    },
    [language, speakingMessageId, updateStatus]
  );

  const sendMessage = useCallback(
    async (rawMessage) => {
      const messageText = String(rawMessage || '').trim();

      if (!messageText || status === 'thinking') {
        return;
      }

      const detectedLanguage =
        detectMediQOneLanguage(messageText);

      setLanguage(detectedLanguage);
      setInput('');
      setHasScrolledUp(false);

      const userMessage = {
        id: makeId('user'),
        role: 'user',
        text: messageText,
        time: new Date(),
      };

      setMessages((current) => [
        ...current,
        userMessage,
      ]);

      updateStatus('thinking');

      try {
        let result;

        const context = {
          language: detectedLanguage,
          activeBooking,
          history: messages.slice(-12),
          sessionId: sessionRef.current?.id,
          userName,
          userId,
        };

        if (onSendMessage) {
          const response = await onSendMessage(
            messageText,
            context
          );

          result = {
            reply:
              typeof response === 'string'
                ? response
                : response?.reply ||
                  response?.text ||
                  '',
            action: response?.action || null,
            assessment: response?.assessment || null,
            suggestions:
              response?.suggestions || [],
          };
        } else {
          result = await getMediQOneReply({
            message: messageText,
            ...context,
            session: sessionRef.current,
          });
        }

        const reply =
          result?.reply ||
          'I could not get a response right now. Please try again.';

        const assistantMessage = {
          id: makeId('assistant'),
          role: 'assistant',
          text: reply,
          time: new Date(),
          action: result?.action || null,
          assessment: result?.assessment || null,
          suggestions: result?.suggestions || [],
          urgent:
            result?.assessment?.urgency === 'emergency' ||
            result?.action?.type === 'urgent_care',
        };

        setMessages((current) => [
          ...current,
          assistantMessage,
        ]);

        if (result?.action?.type === 'auto_trigger') {
          triggerAction(
            result.action.target,
            result.action.payload || null
          );
        }
      } catch (error) {
        console.error(
          'MediQ One request failed:',
          error
        );

        setMessages((current) => [
          ...current,
          {
            id: makeId('assistant'),
            role: 'assistant',
            text: "I'm having trouble connecting right now. Please try again in a moment.",
            time: new Date(),
            error: true,
          },
        ]);
      } finally {
        updateStatus('idle');
      }
    },
    [
      activeBooking,
      messages,
      onSendMessage,
      status,
      triggerAction,
      updateStatus,
      userName,
      userId,
    ]
  );

  const startVoice = useCallback(async () => {
    if (status === 'speaking') {
      stopMediQOneSpeech();
      setSpeakingMessageId(null);
      updateStatus('idle');
      return;
    }

    if (status === 'listening') {
      stopMediQOneListening();
      updateStatus('idle');
      return;
    }

    updateStatus('listening');

    try {
      const result = await startMediQOneListening({
        language,

        onInterim: (interimText) => {
          if (interimText) {
            setInput(interimText);
          }
        },
      });

      const spokenText = result?.text?.trim();

      if (spokenText) {
        setInput(spokenText);
        await sendMessage(spokenText);
      }
    } catch (error) {
      console.warn(
        'MediQ One voice input unavailable:',
        error
      );
    } finally {
      stopMediQOneListening();
      updateStatus('idle');
    }
  }, [language, sendMessage, status, updateStatus]);

  const handleScroll = useCallback(() => {
    const element = listRef.current;

    if (!element) return;

    const distanceFromBottom =
      element.scrollHeight -
      element.scrollTop -
      element.clientHeight;

    setHasScrolledUp(distanceFromBottom > 100);
  }, []);

  const handleSuggestion = useCallback(
    (suggestion) => {
      if (!suggestion) return;

      if (suggestion.type === 'action') {
        triggerAction(
          suggestion.action,
          suggestion.payload || null
        );
        return;
      }

      if (suggestion.prompt) {
        sendMessage(suggestion.prompt);
      }
    },
    [sendMessage, triggerAction]
  );

  return (
    <div className={`mq-one ${open ? 'is-open' : ''}`} style={{ overflow: 'visible' }}>
      {!open && (
        <button
          className="mq-trigger"
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Open ${accentLabel}`}
        >
          <span className="mq-trigger-halo" />

          <span className="mq-trigger-core">
            <Icon name="spark" size={20} />
          </span>

          <span className="mq-trigger-label">
            {accentLabel}
          </span>
        </button>
      )}

      {open && (
        <>
          <div
            className="mq-backdrop"
            onClick={closeAssistant}
          />

          <section
            className="mq-shell"
            role="dialog"
            aria-modal="true"
            aria-label="MediQ One healthcare assistant"
          >
            <header className="mq-header">
              <div className="mq-brand">
                <div className="mq-mark">
                  <Icon name="spark" size={17} />
                </div>

                <div>
                  <div className="mq-title">
                    MediQ One
                  </div>

                  <div className="mq-subtitle">
                    Healthcare decision copilot
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="mq-icon-button"
                onClick={closeAssistant}
                aria-label={copy.close}
              >
                <Icon name="close" size={18} />
              </button>
            </header>

            <div
              className="mq-body"
              ref={listRef}
              onScroll={handleScroll}
            >
              {messages.length <= 1 && (
                <section className="mq-home">
                  <div className="mq-eyebrow">
                    <span className="mq-status-dot" />
                    {copy.available}
                  </div>

                  <h2>{copy.greeting}</h2>

                  <p className="mq-home-description">
                    {copy.subGreeting}
                  </p>

                  {booking && (
                    <div className="mq-context-card">
                      <div className="mq-context-top">
                        <span>Active appointment</span>

                        <span className="mq-context-live">
                          {booking.token
                            ? `Token #${booking.token}`
                            : 'Booked'}
                        </span>
                      </div>

                      <div className="mq-context-doctor">
                        {booking.doctor}
                      </div>

                      <div className="mq-context-meta">
                        {[booking.hospital, booking.time]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          triggerAction(
                            'view_queue',
                            {
                              booking: activeBooking,
                            }
                          )
                        }
                      >
                        Check appointment
                        <Icon
                          name="arrow"
                          size={14}
                        />
                      </button>
                    </div>
                  )}

                  <div className="mq-starter-label">
                    What would you like help with?
                  </div>

                  <div className="mq-starter-grid">
                    {STARTER_PROMPTS.map((item) => (
                      <button
                        key={item.id}
                        className="mq-starter-card"
                        type="button"
                        onClick={() =>
                          sendMessage(item.prompt)
                        }
                      >
                        <span className="mq-starter-icon">
                          {item.icon}
                        </span>

                        <span>
                          <strong>{item.title}</strong>
                          <small>{item.subtitle}</small>
                        </span>

                        <Icon
                          name="arrow"
                          size={15}
                        />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`mq-message ${message.role} ${
                    message.urgent ? 'urgent' : ''
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="mq-message-avatar">
                      <Icon name="spark" size={13} />
                    </div>
                  )}

                  <div className="mq-message-content">
                    {message.assessment?.urgency && (
                      <div
                        className={`mq-assessment ${message.assessment.urgency}`}
                      >
                        <span className="mq-assessment-dot" />

                        {message.assessment.label ||
                          message.assessment.urgency}
                      </div>
                    )}

                    <div className="mq-message-text">
                      {message.text}
                    </div>

                    {message.suggestions?.length > 0 && (
                      <div className="mq-suggestions">
                        {message.suggestions.map(
                          (suggestion, index) => (
                            <button
                              key={`${message.id}-${index}`}
                              type="button"
                              onClick={() =>
                                handleSuggestion(
                                  suggestion
                                )
                              }
                            >
                              {suggestion.label}
                              <Icon
                                name="arrow"
                                size={13}
                              />
                            </button>
                          )
                        )}
                      </div>
                    )}

                    {message.action?.type &&
                      message.action?.type !==
                        'auto_trigger' && (
                        <button
                          className={`mq-inline-action ${
                            message.urgent
                              ? 'danger'
                              : ''
                          }`}
                          type="button"
                          onClick={() =>
                            triggerAction(
                              message.action.type,
                              message.action.payload
                            )
                          }
                        >
                          {message.action.label ||
                            'Continue'}

                          <Icon
                            name="arrow"
                            size={14}
                          />
                        </button>
                      )}

                    {message.role === 'assistant' &&
                      message.text && (
                        <button
                          className="mq-speak-message"
                          type="button"
                          onClick={() =>
                            speakMessage(
                              message.text,
                              message.id
                            )
                          }
                        >
                          {speakingMessageId ===
                          message.id
                            ? `■ ${copy.stopListening}`
                            : `◒ ${copy.listen}`}
                        </button>
                      )}
                  </div>
                </article>
              ))}

              {status === 'thinking' && (
                <div className="mq-message assistant">
                  <div className="mq-message-avatar">
                    <Icon name="spark" size={13} />
                  </div>

                  <div className="mq-typing">
                    <span />
                    <span />
                    <span />
                    <em>{copy.thinking}</em>
                  </div>
                </div>
              )}

              <div className="mq-end" />
            </div>

            {hasScrolledUp && (
              <button
                className="mq-new-response"
                type="button"
                onClick={() => {
                  setHasScrolledUp(false);

                  listRef.current?.scrollTo({
                    top:
                      listRef.current.scrollHeight,
                    behavior: 'smooth',
                  });
                }}
              >
                ↓ {copy.latest}
              </button>
            )}

            {status !== 'idle' && (
              <div
                className={`mq-voice-state ${status}`}
              >
                {status === 'listening' && (
                  <div className="mq-wave">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                )}

                <span>
                  {status === 'listening'
                    ? copy.listening
                    : status === 'speaking'
                    ? copy.speaking
                    : copy.thinking}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    stopMediQOneSpeech();
                    stopMediQOneListening();
                    setSpeakingMessageId(null);
                    updateStatus('idle');
                  }}
                >
                  ×
                </button>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: 6,
                padding: '0 16px 6px',
              }}
            >
              {[
                { code: 'en', label: 'EN' },
                { code: 'bn', label: 'বাং' },
                { code: 'hi', label: 'हिं' },
              ].map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setLanguage(item.code)}
                  style={{
                    fontSize: 12,
                    padding: '4px 10px',
                    borderRadius: 999,
                    border:
                      language === item.code
                        ? '1.5px solid #0d9488'
                        : '1px solid #d1d5db',
                    background:
                      language === item.code ? '#0d948815' : 'transparent',
                    color: language === item.code ? '#0d9488' : '#6b7280',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <footer className="mq-composer-area">
              <form
                className="mq-composer"
                onSubmit={(event) => {
                  event.preventDefault();
                  sendMessage(input);
                }}
              >
                <textarea
                  value={input}
                  onChange={(event) => {
                    const value = event.target.value;

                    setInput(value);

                    if (value.trim()) {
                      setLanguage(
                        detectMediQOneLanguage(value)
                      );
                    }
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder={copy.placeholder}
                  rows={1}
                  aria-label={copy.placeholder}
                />

                <button
                  type="button"
                  className={`mq-mic ${
                    status === 'listening'
                      ? 'active'
                      : ''
                  }`}
                  onClick={startVoice}
                  aria-label={copy.voice}
                >
                  {status === 'speaking' ? (
                    '■'
                  ) : (
                    <Icon name="mic" size={18} />
                  )}
                </button>

                {input.trim() && (
                  <button
                    type="submit"
                    className="mq-send"
                    aria-label={copy.send}
                  >
                    <Icon name="send" size={16} />
                  </button>
                )}
              </form>

              <div className="mq-footnote">
                {copy.disclaimer}
              </div>
            </footer>
          </section>
        </>
      )}
    </div>
  );
}