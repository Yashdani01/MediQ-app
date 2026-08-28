import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './MediQOne.css';

import {
  createMediQOneSession,
  detectMediQOneLanguage,
  detectMediQOneIntent,
  getMediQOneReply,
  speakMediQOne,
  stopMediQOneSpeech,
  startMediQOneListening,
  stopMediQOneListening,
} from './mediqOneApi';

const QUICK_ACTIONS = [
  {
    id: 'find_doctor',
    label: 'Find a doctor',
    sub: 'Specialist or general care',
    icon: '✦',
  },
  {
    id: 'find_hospital',
    label: 'Nearby hospital',
    sub: 'Hospitals and urgent care',
    icon: '⌖',
  },
  {
    id: 'find_dentist',
    label: 'Dental care',
    sub: 'Dentist and dental appointments',
    icon: '◌',
  },
  {
    id: 'view_queue',
    label: 'My queue',
    sub: 'Token and waiting time',
    icon: '#',
  },
];

const LABELS = {
  en: {
    greeting: 'How can I help?',
    subGreeting: 'Care, appointments, queues, or finding the right place to go.',
    placeholder: 'Ask MediQ One…',
    listening: 'Listening',
    thinking: 'Thinking',
    speaking: 'Speaking',
    stop: 'Stop',
    close: 'Close MediQ One',
    quick: 'Quick access',
    healthcare: 'Healthcare copilot',
    available: 'Available now',
    appointment: 'Active care',
    noAppointment: 'No active appointment',
    send: 'Send',
    voice: 'Voice assistant',
    latest: 'Latest',
    disclaimer:
      'MediQ One provides healthcare guidance and navigation, not a diagnosis.',
  },

  bn: {
    greeting: 'কীভাবে সাহায্য করতে পারি?',
    subGreeting: 'চিকিৎসা, অ্যাপয়েন্টমেন্ট, কিউ বা সঠিক সেবা খুঁজতে বলুন।',
    placeholder: 'MediQ One-কে জিজ্ঞেস করুন…',
    listening: 'শুনছি',
    thinking: 'ভাবছি',
    speaking: 'বলছি',
    stop: 'থামুন',
    close: 'MediQ One বন্ধ করুন',
    quick: 'দ্রুত সহায়তা',
    healthcare: 'স্বাস্থ্যসেবা সহকারী',
    available: 'এখন সক্রিয়',
    appointment: 'চলমান চিকিৎসা',
    noAppointment: 'কোনো সক্রিয় অ্যাপয়েন্টমেন্ট নেই',
    send: 'পাঠান',
    voice: 'ভয়েস সহকারী',
    latest: 'সর্বশেষ',
    disclaimer: 'MediQ One স্বাস্থ্য নির্দেশনা ও নেভিগেশন দেয়, রোগ নির্ণয় নয়।',
  },

  hi: {
    greeting: 'मैं कैसे मदद कर सकता हूँ?',
    subGreeting: 'इलाज, अपॉइंटमेंट, क्यू या सही देखभाल खोजने के लिए पूछें।',
    placeholder: 'MediQ One से पूछें…',
    listening: 'सुन रहा हूँ',
    thinking: 'सोच रहा हूँ',
    speaking: 'बोल रहा हूँ',
    stop: 'रोकें',
    close: 'MediQ One बंद करें',
    quick: 'त्वरित सहायता',
    healthcare: 'हेल्थकेयर सहायक',
    available: 'अभी उपलब्ध',
    appointment: 'चल रही देखभाल',
    noAppointment: 'कोई सक्रिय अपॉइंटमेंट नहीं',
    send: 'भेजें',
    voice: 'वॉइस सहायक',
    latest: 'नवीनतम',
    disclaimer: 'MediQ One स्वास्थ्य मार्गदर्शन देता है, निदान नहीं।',
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
  activeBooking = null,
  onActionTrigger,
  onSendMessage,
  onVoiceStateChange,
  initialOpen = false,
  accentLabel = 'MediQ One',
}) {
  const [open, setOpen] = useState(initialOpen);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('idle');
  const [language, setLanguage] = useState('en');
  const [showActions, setShowActions] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [hasScrolledUp, setHasScrolledUp] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);
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
      ? `Good evening, ${userName}.`
      : 'Good evening.';

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

  useEffect(() => {
    const handleKeyboard = (event) => {
      if (event.key === 'Escape' && open) {
        closeAssistant();
      }
    };

    window.addEventListener('keydown', handleKeyboard);

    return () => {
      window.removeEventListener('keydown', handleKeyboard);
    };
  });

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
    setShowActions(false);
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
    [language, updateStatus]
  );

  const sendMessage = useCallback(
    async (rawMessage) => {
      const messageText = String(rawMessage || '').trim();

      if (!messageText || status === 'thinking') {
        return;
      }

      const detectedLanguage = detectMediQOneLanguage(messageText);

      setLanguage(detectedLanguage);
      setInput('');
      setHasScrolledUp(false);

      const userMessage = {
        id: makeId('user'),
        role: 'user',
        text: messageText,
        time: new Date(),
      };

      setMessages((current) => [...current, userMessage]);
      updateStatus('thinking');

      try {
        let result;

        if (onSendMessage) {
          const response = await onSendMessage(messageText, {
            language: detectedLanguage,
            activeBooking,
            history: messages.slice(-12),
            sessionId: sessionRef.current?.id,
            intent: detectMediQOneIntent(messageText),
          });

          result = {
            reply:
              typeof response === 'string'
                ? response
                : response?.reply || response?.text || '',
            action: response?.action || null,
          };
        } else {
          result = await getMediQOneReply({
            message: messageText,
            language: detectedLanguage,
            activeBooking,
            history: messages.slice(-12),
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
          urgent: result?.action?.type === 'urgent_care',
        };

        setMessages((current) => [...current, assistantMessage]);

        if (result?.action?.type) {
          triggerAction(
            result.action.type,
            result.action.payload || null
          );
        }

        await speakMessage(reply, assistantMessage.id);
      } catch (error) {
        console.error('MediQ One request failed:', error);

        const errorMessage = {
          id: makeId('assistant'),
          role: 'assistant',
          text: 'I’m having trouble connecting to MediQ right now. Please try again.',
          time: new Date(),
          error: true,
        };

        setMessages((current) => [...current, errorMessage]);
      } finally {
        updateStatus('idle');
      }
    },
    [
      activeBooking,
      messages,
      onSendMessage,
      speakMessage,
      status,
      triggerAction,
      updateStatus,
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
      console.warn('MediQ One voice input unavailable:', error);
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

  const openQuickAction = useCallback(
    (action) => {
      setShowActions(false);

      const prompts = {
        find_doctor: 'I want to find a doctor.',
        find_hospital: 'I need a nearby hospital.',
        find_dentist: 'I need dental care.',
        view_queue: 'Show my queue status.',
      };

      if (action.id === 'view_queue' && activeBooking) {
        triggerAction('view_queue', {
          booking: activeBooking,
        });

        return;
      }

      sendMessage(prompts[action.id] || action.label);
    },
    [activeBooking, sendMessage, triggerAction]
  );

  return (
    <div className={`mq-one ${open ? 'is-open' : ''}`}>
      {!open && (
        <button
          className="mq-trigger"
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Open ${accentLabel}`}
        >
          <span className="mq-trigger-halo" />

          <span className="mq-trigger-core">
            <Icon name="spark" size={19} />
          </span>

          <span className="mq-trigger-label">
            {accentLabel}
          </span>
        </button>
      )}

      {open && (
        <section
          className="mq-shell"
          role="dialog"
          aria-label="MediQ One healthcare assistant"
        >
          <header className="mq-header">
            <div className="mq-brand">
              <div className="mq-mark">
                <Icon name="spark" size={16} />
              </div>

              <div>
                <div className="mq-title">MediQ One</div>
                <div className="mq-subtitle">
                  {copy.healthcare}
                </div>
              </div>
            </div>

            <div className="mq-header-actions">
              <button
                type="button"
                className="mq-icon-button"
                onClick={() => setShowActions((value) => !value)}
                aria-label="Quick actions"
              >
                <Icon name="plus" size={17} />
              </button>

              <button
                type="button"
                className="mq-icon-button"
                onClick={closeAssistant}
                aria-label={copy.close}
              >
                <Icon name="close" size={17} />
              </button>
            </div>
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

                {booking ? (
                  <div className="mq-context-card">
                    <div className="mq-context-top">
                      <span>{copy.appointment}</span>

                      <span className="mq-context-live">
                        {booking.token
                          ? `#${booking.token}`
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
                        triggerAction('view_queue', {
                          booking: activeBooking,
                        })
                      }
                    >
                      {booking.token
                        ? 'Open queue'
                        : 'View appointment'}

                      <Icon name="arrow" size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="mq-empty-context">
                    {copy.noAppointment}
                  </div>
                )}

                <div className="mq-quick-label">
                  {copy.quick}
                </div>

                <div className="mq-action-list">
                  {QUICK_ACTIONS.slice(0, 3).map((action) => (
                    <button
                      key={action.id}
                      className="mq-action-row"
                      type="button"
                      onClick={() =>
                        openQuickAction(action)
                      }
                    >
                      <span className="mq-action-icon">
                        {action.icon}
                      </span>

                      <span className="mq-action-copy">
                        <strong>{action.label}</strong>
                        <small>{action.sub}</small>
                      </span>

                      <Icon name="arrow" size={15} />
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
                  <div className="mq-message-text">
                    {message.text}
                  </div>

                  {message.action?.type && (
                    <button
                      className={`mq-inline-action ${
                        message.urgent ? 'danger' : ''
                      }`}
                      type="button"
                      onClick={() =>
                        triggerAction(
                          message.action.type,
                          message.action.payload
                        )
                      }
                    >
                      <span>
                        {message.action.type ===
                        'urgent_care'
                          ? '!'
                          : '→'}
                      </span>

                      {message.action.label ||
                        'Continue'}

                      <Icon name="arrow" size={14} />
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
                        aria-label={
                          speakingMessageId === message.id
                            ? copy.stop
                            : 'Read response aloud'
                        }
                      >
                        {speakingMessageId === message.id
                          ? '■ Stop'
                          : '◒ Listen'}
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
                  top: listRef.current.scrollHeight,
                  behavior: 'smooth',
                });
              }}
            >
              ↓ {copy.latest}
            </button>
          )}

          {showActions && (
            <div className="mq-action-drawer">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() =>
                    openQuickAction(action)
                  }
                >
                  <span>{action.icon}</span>

                  <span>
                    <strong>{action.label}</strong>
                    <small>{action.sub}</small>
                  </span>
                </button>
              ))}
            </div>
          )}

          {status !== 'idle' && (
            <div className={`mq-voice-state ${status}`}>
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
                aria-label={copy.stop}
              >
                ×
              </button>
            </div>
          )}

          <footer className="mq-composer-area">
            <form
              className="mq-composer"
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage(input);
              }}
            >
              <textarea
                ref={inputRef}
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
                  status === 'listening' ||
                  status === 'speaking'
                    ? 'active'
                    : ''
                }`}
                onClick={startVoice}
                aria-label={copy.voice}
              >
                {status === 'speaking' ? (
                  '■'
                ) : (
                  <Icon name="mic" size={17} />
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
      )}
    </div>
  );
}