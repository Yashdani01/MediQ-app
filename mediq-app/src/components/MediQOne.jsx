import React, { useState, useEffect, useRef } from 'react';
import './MediQOne.css';

export default function MediQOne({ userName = "Sk Golam", activeBooking = null, onActionTrigger }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStep, setVoiceStep] = useState('listening');
  const [activeTab, setActiveTab] = useState('hub');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'ai', text: `Namaste ${userName}. I am MediQ One, your autonomous neural healthcare co-op companion. How may I assist your wellbeing today?`, time: 'Just now' }
  ]);
  const [simulatedState, setSimulatedState] = useState('idle');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    const bubbleTimer = setTimeout(() => {
      setShowBubble(true);
      const hideTimer = setTimeout(() => setShowBubble(false), 8000);
      return () => clearTimeout(hideTimer);
    }, 2000);
    return () => clearTimeout(bubbleTimer);
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeTab]);

  const triggerVoiceNeuralStream = () => {
    setIsVoiceActive(true);
    setVoiceStep('listening');
    
    setTimeout(() => {
      setVoiceStep('processing');
      setTimeout(() => {
        setIsVoiceActive(false);
        setActiveTab('chat');
        const userMsg = { sender: 'user', text: "🎙️ [Voice Input]: 'Buk betha korche, doctor kothay pabo?'", time: 'Just now' };
        setMessages(prev => [...prev, userMsg]);
        
        setTimeout(() => {
          const aiReply = { sender: 'ai', text: "⚠️ Neural Diagnostic Notice: Chest discomfort detected. Immediate consultation advised. I have located Dr. S. Mukherjee (Cardiologist) available nearby with a live queue of 3 patients. Shall I reserve your priority token?", time: 'Just now' };
          setMessages(prev => [...prev, aiReply]);
          setSimulatedState('confirming_slot');
        }, 800);
      }, 1500);
    }, 4500);
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    setMessages(prev => [...prev, { sender: 'user', text, time: 'Just now' }]);

    setTimeout(() => {
      let reply = "Processed securely through your local profile matrix. Your health parameters remain fully encrypted.";
      const lower = text.toLowerCase();
      if (lower.includes('dentist') || lower.includes('teeth')) {
        reply = "Dr. Arnab Roy (Dental Specialist) has slots open at 4:30 PM today. Would you like me to book your slot?";
        setSimulatedState('confirming_slot');
      } else if (lower.includes('token') || lower.includes('queue')) {
        reply = activeBooking ? "Your active token is #07. Estimated wait time: 14 minutes." : "You currently have no active tokens today. Would you like to find a doctor?";
      }
      setMessages(prev => [...prev, { sender: 'ai', text: reply, time: 'Just now' }]);
    }, 700);
  };

  return (
    <div className="mediq-supreme-wrapper">
      {showBubble && !isOpen && (
        <div className="supreme-speech-capsule" onClick={() => setIsOpen(true)}>
          <button className="capsule-dismiss" onClick={(e) => { e.stopPropagation(); setShowBubble(false); }}>×</button>
          <div className="capsule-pulse-line"></div>
          <p className="capsule-text">🤖 Namaste! Need instant appointment booking or live token tracking?</p>
          <span className="capsule-sub">Tap to activate MediQ One</span>
        </div>
      )}

      <button className="supreme-orb-trigger" onClick={() => { setIsOpen(true); setShowBubble(false); }}>
        <div className="orb-halo halo-1"></div>
        <div className="orb-halo halo-2"></div>
        <div className="orb-liquid-core">
          <span className="core-icon">✨</span>
        </div>
        <div className="orb-status-badge">AI</div>
      </button>

      {isOpen && (
        <div className="supreme-backdrop" onClick={() => setIsOpen(false)}>
          <div className="supreme-command-deck" onClick={(e) => e.stopPropagation()}>
            <div className="deck-header">
              <div className="deck-brand">
                <div className="brand-logo-glow">✨</div>
                <div>
                  <h2>MediQ One</h2>
                  <p>Neural Healthcare & Emergency Dispatch Matrix</p>
                </div>
              </div>
              <div className="deck-actions">
                <button className="deck-action-btn" onClick={triggerVoiceNeuralStream} title="Voice Aura">🎙️</button>
                <button className="deck-action-btn close-btn" onClick={() => setIsOpen(false)}>✕</button>
              </div>
            </div>

            <div className="deck-nav-tabs">
              <button className={`nav-tab ${activeTab === 'hub' ? 'active' : ''}`} onClick={() => setActiveTab('hub')}>Command Hub</button>
              <button className={`nav-tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>Neural Stream</button>
              <button className={`nav-tab ${activeTab === 'health-card' ? 'active' : ''}`} onClick={() => setActiveTab('health-card')}>Emergency Card</button>
            </div>

            {activeTab === 'hub' && (
              <div className="tab-pane hub-pane">
                <div className="hologram-user-card">
                  <div className="user-info">
                    <span className="user-subtitle">Secured Session Profile</span>
                    <h3>{userName} 🛡️</h3>
                  </div>
                  <div className="system-health-badge">
                    <span className="green-pulsar"></span> System Verified
                  </div>
                </div>

                <div className="hub-section-label">Intelligent Quick Dispatch</div>
                <div className="hub-grid-actions">
                  {!activeBooking ? (
                    <>
                      <button className="hub-action-card" onClick={() => onActionTrigger('find_doctor')}>
                        <span className="card-emoji">🩺</span>
                        <div>
                          <strong>Find Doctor</strong>
                          <small>Specialist & General</small>
                        </div>
                      </button>
                      <button className="hub-action-card" onClick={() => onActionTrigger('find_hospital')}>
                        <span className="card-emoji">📍</span>
                        <div>
                          <strong>Nearby Clinic</strong>
                          <small>GPS Route Mapping</small>
                        </div>
                      </button>
                      <button className="hub-action-card highlight" onClick={triggerVoiceNeuralStream}>
                        <span className="card-emoji">🎙️</span>
                        <div>
                          <strong>Voice Triage</strong>
                          <small>Speak naturally</small>
                        </div>
                      </button>
                      <button className="hub-action-card" onClick={() => onActionTrigger('find_dentist')}>
                        <span className="card-emoji">🦷</span>
                        <div>
                          <strong>Dental Care</strong>
                          <small>Instant booking</small>
                        </div>
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="hub-action-card" onClick={() => onActionTrigger('my_token')}>
                        <span className="card-emoji">🎫</span>
                        <div>
                          <strong>Active Token</strong>
                          <small>Queue status #07</small>
                        </div>
                      </button>
                      <button className="hub-action-card danger" onClick={() => onActionTrigger('cancel_booking')}>
                        <span className="card-emoji">❌</span>
                        <div>
                          <strong>Cancel Visit</strong>
                          <small>Safe state router</small>
                        </div>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="tab-pane chat-pane">
                <div className="chat-stream-box">
                  {messages.map((m, idx) => (
                    <div key={idx} className={`stream-bubble-item ${m.sender}`}>
                      <div className="bubble-text-content">{m.text}</div>
                      <span className="bubble-time-tag">{m.time}</span>
                    </div>
                  ))}

                  {simulatedState === 'confirming_slot' && (
                    <div className="interactive-confirm-card">
                      <p>🔒 Secure token reservation with Dr. Mukherjee?</p>
                      <div className="confirm-btn-row">
                        <button className="btn-confirm" onClick={() => { alert("Slot secured successfully!"); setSimulatedState('idle'); }}>Confirm (₹500)</button>
                        <button className="btn-dismiss" onClick={() => setSimulatedState('idle')}>Decline</button>
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                <form className="chat-input-bar-supreme" onSubmit={handleTextSubmit}>
                  <input 
                    type="text" 
                    placeholder="Ask MediQ One or type symptoms..." 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  <button type="submit" className="send-action-btn">➤</button>
                </form>
              </div>
            )}

            {activeTab === 'health-card' && (
              <div className="tab-pane passport-pane">
                <div className="emergency-passport-card">
                  <div className="passport-header">
                    <span>MEDIQ SECURE PASSPORT</span>
                    <span className="offline-ready-tag">⚡ Offline Ready</span>
                  </div>
                  <div className="passport-body">
                    <div className="p-row"><strong>Full Name:</strong> {userName}</div>
                    <div className="p-row"><strong>Blood Group:</strong> O+ (Verified)</div>
                    <div className="p-row"><strong>Emergency Contact:</strong> +91 98765 43210</div>
                    <div className="p-row"><strong>Active Allergies:</strong> None Recorded</div>
                  </div>
                  <button className="flash-param-btn" onClick={() => alert("Showing high-contrast emergency code for paramedics...")}>
                    Show Paramedic Quick-Flash Code
                  </button>
                </div>
              </div>
            )}

            {isVoiceActive && (
              <div className="voice-aura-cinematic-overlay">
                <div className="cinematic-wave-orbits">
                  <div className="orbit-ring-v o1"></div>
                  <div className="orbit-ring-v o2"></div>
                  <div className="orbit-ring-v o3"></div>
                </div>
                <div className="voice-live-status">
                  {voiceStep === 'listening' && "Listening to regional dialect (Bengali/Hindi/English)..."}
                  {voiceStep === 'processing' && "Analyzing clinical intent through neural matrix..."}
                </div>
                <button className="terminate-voice-btn" onClick={() => setIsVoiceActive(false)}>Abort Voice Session</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}