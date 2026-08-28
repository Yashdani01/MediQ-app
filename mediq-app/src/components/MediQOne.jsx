// src/components/MediQOne.jsx

import React, { useState, useEffect, useRef } from 'react';
import { sendMediQQuery, getSessionId } from './mediqOneApi';
import './MediQOne.css';

export default function MediQOne({ userName = "Patient", activeBooking = null, onActionTrigger }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [chatLog, setChatLog] = useState([
    { sender: 'ai', text: `Namaste, ${userName}. I'm MediQ One. How can I assist your health journey today?`, time: 'Just now' }
  ]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatLog, isOpen]);

  // Interruptible Voice Handler (Speech Synthesis & Recognition)
  const toggleVoiceListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser environment.");
      return;
    }

    // Interrupt any ongoing speech synthesis immediately
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = async (event) => {
      const spokenText = event.results[0][0].transcript;
      setIsListening(false);
      await processUserMessage(spokenText);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Interruptible
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const processUserMessage = async (queryText) => {
    if (!queryText.trim()) return;

    const userMsg = queryText;
    setInputQuery('');
    setChatLog(prev => [...prev, { sender: 'user', text: userMsg, time: 'Just now' }]);
    setIsProcessing(true);

    // Simulate progressive streaming feel
    setTimeout(async () => {
      const response = await sendMediQQuery({
        message: userMsg,
        patientContext: { name: userName },
        activeBooking
      });

      setChatLog(prev => [...prev, { sender: 'ai', text: response.reply, time: 'Just now', action: response.actionType, payload: response.payload }]);
      setIsProcessing(false);
      speakText(response.reply);
    }, 600);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    processUserMessage(inputQuery);
  };

  return (
    <div className="mediq-one-wrapper">
      {/* Floating Orb Launcher */}
      <button className="mediq-orb-trigger" onClick={() => setIsOpen(true)}>
        <div className="orb-pulse-ring"></div>
        <div className="orb-core"><span>✦</span></div>
        <span className="orb-badge-label">MediQ One</span>
      </button>

      {/* Master Drawer Interface */}
      {isOpen && (
        <div className="mediq-backdrop" onClick={() => setIsOpen(false)}>
          <div className="mediq-drawer-container" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="mediq-header">
              <div className="mediq-brand-info">
                <div className="brand-icon-box">✦</div>
                <div>
                  <h3>MediQ One</h3>
                  <span className="secure-tag">Secure AI Orchestration (Session: {getSessionId().slice(-6)})</span>
                </div>
              </div>
              <button className="mediq-close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            {/* Pane */}
            <div className="mediq-pane">
              <div className="chat-history-area">
                {chatLog.map((msg, idx) => (
                  <div key={idx} className={`chat-bubble ${msg.sender}`}>
                    <p>{msg.text}</p>
                    {msg.action && (
                      <button 
                        style={{ marginTop: '8px', background: '#38bdf8', color: '#0b0f19', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer' }}
                        onClick={() => {
                          if (onActionTrigger) onActionTrigger(msg.action, msg.payload);
                          setIsOpen(false);
                        }}
                      >
                        ⚡ Execute Action →
                      </button>
                    )}
                    <span className="msg-time">{msg.time}</span>
                  </div>
                ))}
                {isProcessing && (
                  <div className="chat-bubble ai">
                    <p style={{ color: '#38bdf8', fontSize: '12px' }}>⌁ Orchestrating health data & tools...</p>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>

              {/* Voice Waveform Indicator if Listening */}
              {isListening && (
                <div className="voice-waveform-bar">
                  <span style={{ fontSize: '12px', color: '#38bdf8' }}>Listening & interruptible...</span>
                  <div className="waveform-animation">
                    <span></span><span></span><span></span><span></span><span></span>
                  </div>
                </div>
              )}

              {/* Input & Voice Controls */}
              <form className="chat-input-row" onSubmit={handleFormSubmit}>
                <input 
                  type="text" 
                  placeholder="Ask symptoms, doctors, or queues..." 
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                />
                <button 
                  type="button" 
                  className={`mic-btn ${isListening ? 'listening' : ''}`} 
                  onClick={toggleVoiceListening}
                  title="Tap to speak"
                >
                  🎙️
                </button>
                <button type="submit" className="send-icon-btn">↑</button>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}