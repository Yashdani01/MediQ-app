import React, { useState, useEffect, useRef } from 'react';
import './MediQOne.css';

export default function MediQOne({ userName = "Sk Golam", activeBooking = null, onActionTrigger }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [activeTab, setActiveTab] = useState('assistant'); // 'assistant' | 'quick'
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatLog, setChatLog] = useState([
    { sender: 'ai', text: `Namaste, ${userName}. I'm MediQ One. How can I assist your health journey today?`, time: 'Just now' }
  ]);
  const scrollRef = useRef(null);

  // Subtle initial notification trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBubble(true);
      const hide = setTimeout(() => setShowBubble(false), 6000);
      return () => clearTimeout(hide);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Smooth auto-scroll for chat
  useEffect(() => {
    if (isOpen) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatLog, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    const userText = inputQuery;
    setInputQuery('');
    setChatLog(prev => [...prev, { sender: 'user', text: userText, time: 'Just now' }]);
    setIsTyping(true);

    // Simulate intelligent professional response
    setTimeout(() => {
      let aiResponse = "I've processed your request securely through your profile database matrix.";
      const lower = userText.toLowerCase();

      if (lower.includes('chest') || lower.includes('pain') || lower.includes('buk') || lower.includes('heart')) {
        aiResponse = "⚠️ Clinical Notice: Chest discomfort requires attention. I recommend consulting a General Physician or Cardiologist immediately. Would you like me to find nearby specialists?";
      } else if (lower.includes('dentist') || lower.includes('teeth') || lower.includes('daant')) {
        aiResponse = "🦷 Found 2 Dental Surgeons available near your location today. Standard consultation fee is ₹400. Shall I secure a priority queue token?";
      } else if (lower.includes('token') || lower.includes('queue')) {
        aiResponse = activeBooking ? `Your active token is #${activeBooking.number} for ${activeBooking.doctorName}.` : "You have no active queues right now. Would you like to browse doctors?";
      }

      setChatLog(prev => [...prev, { sender: 'ai', text: aiResponse, time: 'Just now' }]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <div className="mediq-one-wrapper">
      {/* Sleek Floating Prompt Bubble */}
      {showBubble && !isOpen && (
        <div className="mediq-bubble-card" onClick={() => setIsOpen(true)}>
          <button className="bubble-x" onClick={(e) => { e.stopPropagation(); setShowBubble(false); }}>×</button>
          <div className="bubble-indicator"></div>
          <p>Need an appointment or live queue status? Tap MediQ One.</p>
        </div>
      )}

      {/* Elite Floating Orb Trigger */}
      <button className="mediq-orb-trigger" onClick={() => { setIsOpen(true); setShowBubble(false); }}>
        <div className="orb-pulse-ring"></div>
        <div className="orb-core">
          <span className="orb-sparkle">✦</span>
        </div>
        <span className="orb-badge-label">MediQ One</span>
      </button>

      {/* Professional Master Overlay */}
      {isOpen && (
        <div className="mediq-backdrop" onClick={() => setIsOpen(false)}>
          <div className="mediq-drawer-container" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="mediq-header">
              <div className="mediq-brand-info">
                <div className="brand-icon-box">✦</div>
                <div>
                  <h3>MediQ One</h3>
                  <span className="secure-tag">Secure Health Intelligence</span>
                </div>
              </div>
              <button className="mediq-close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            {/* Navigation Switcher */}
            <div className="mediq-tabs-row">
              <button className={`tab-pill ${activeTab === 'assistant' ? 'active' : ''}`} onClick={() => setActiveTab('assistant')}>AI Assistant</button>
              <button className={`tab-pill ${activeTab === 'quick' ? 'active' : ''}`} onClick={() => setActiveTab('quick')}>Quick Actions</button>
            </div>

            {/* TAB 1: AI ASSISTANT CHAT */}
            {activeTab === 'assistant' && (
              <div className="mediq-pane chat-pane">
                <div className="chat-history-area">
                  {chatLog.map((msg, idx) => (
                    <div key={idx} className={`chat-bubble ${msg.sender}`}>
                      <p>{msg.text}</p>
                      <span className="msg-time">{msg.time}</span>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="chat-bubble ai typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>

                <form className="chat-input-row" onSubmit={handleSend}>
                  <input 
                    type="text" 
                    placeholder="Ask anything or state symptoms..." 
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                  />
                  <button type="submit" className="send-icon-btn">↑</button>
                </form>
              </div>
            )}

            {/* TAB 2: QUICK ACTIONS HUB */}
            {activeTab === 'quick' && (
              <div className="mediq-pane quick-pane">
                <div className="pane-section-title">Common Health Workflows</div>
                <div className="quick-grid">
                  <button className="quick-card" onClick={() => { onActionTrigger('find_doctor'); setIsOpen(false); }}>
                    <span className="qc-icon">🩺</span>
                    <div>
                      <strong>Find Doctor</strong>
                      <small>Browse specialists</small>
                    </div>
                  </button>
                  <button className="quick-card" onClick={() => { onActionTrigger('find_hospital'); setIsOpen(false); }}>
                    <span className="qc-icon">🏥</span>
                    <div>
                      <strong>Nearby Hospital</strong>
                      <small>GPS & map routing</small>
                    </div>
                  </button>
                  <button className="quick-card" onClick={() => { onActionTrigger('find_dentist'); setIsOpen(false); }}>
                    <span className="qc-icon">🦷</span>
                    <div>
                      <strong>Dental Care</strong>
                      <small>Instant booking</small>
                    </div>
                  </button>
                  <button className="quick-card" onClick={() => { onActionTrigger('my_token'); setIsOpen(false); }}>
                    <span className="qc-icon">🎫</span>
                    <div>
                      <strong>Live Queue</strong>
                      <small>Check active tokens</small>
                    </div>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}