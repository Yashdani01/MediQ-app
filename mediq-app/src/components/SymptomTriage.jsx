import { useState } from 'react';
import './SymptomTriage.css';

export default function SymptomTriage({ onClose, onSelectSpecialty }) {
  const [symptomInput, setSymptomInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [triageResult, setTriageResult] = useState(null);
  const [isEmergency, setIsEmergency] = useState(false);

  const commonSymptoms = [
    { label: '🦷 Toothache / Dental', specialty: 'Dentist' },
    { label: '🔥 Fever & Chills', specialty: 'General Physician' },
    { label: '🍬 High Sugar / Diabetes', specialty: 'Diabetologist' },
    { label: '❤️ Chest Discomfort / BP', specialty: 'Cardiologist' },
    { label: '🤕 Headache & Dizziness', specialty: 'General Physician' },
    { label: '🦴 Joint & Bone Pain', specialty: 'Orthopedic' }
  ];

  const evaluateSymptoms = (text) => {
    const lower = text.toLowerCase();

    // Emergency Red-Flag Safety Check
    if (
      lower.includes('severe chest pain') || 
      lower.includes('breathless') || 
      lower.includes('unconscious') || 
      lower.includes('heart attack') ||
      lower.includes('heavy bleeding')
    ) {
      setIsEmergency(true);
      setTriageResult(null);
      return;
    }

    setIsEmergency(false);

    // Symptom to Specialist Mapping
    if (lower.includes('tooth') || lower.includes('dant') || lower.includes('teeth') || lower.includes('dental') || lower.includes('pain in mouth')) {
      setTriageResult({ specialty: 'Dentist', message: 'Based on your symptoms, a dental evaluation is recommended.' });
    } else if (lower.includes('heart') || lower.includes('chest') || lower.includes('bp') || lower.includes('palpitation')) {
      setTriageResult({ specialty: 'Cardiologist', message: 'Cardiovascular assessment advised for your peace of mind.' });
    } else if (lower.includes('sugar') || lower.includes('diabetes') || lower.includes('urine') || lower.includes('thirsty')) {
      setTriageResult({ specialty: 'Diabetologist', message: 'A metabolic and diabetes checkup is recommended.' });
    } else {
      setTriageResult({ specialty: 'General Physician', message: 'A general physical examination is recommended to evaluate your condition.' });
    }
  };

  const startVoiceTriage = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition not supported on this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const speech = event.results[0][0].transcript;
      setSymptomInput(speech);
      evaluateSymptoms(speech);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  return (
    <div className="triage-overlay">
      <div className="triage-card">
        <div className="triage-header">
          <div>
            <h3>MediQ Smart Triage</h3>
            <p>Describe or select your symptoms for instant guidance</p>
          </div>
          <button className="triage-close-btn" onClick={onClose}>×</button>
        </div>

        {isEmergency ? (
          <div className="emergency-alert-box">
            <div className="emergency-icon">🚨</div>
            <h4>Emergency Medical Alert Detected</h4>
            <p>Your description indicates potential critical symptoms. Please seek immediate medical attention or contact emergency services right away.</p>
            <div className="emergency-actions">
              <a href="tel:112" className="emergency-call-btn">📞 Call Emergency (112)</a>
              <a 
                href="https://www.google.com/maps/search/hospital+emergency+near+me" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="emergency-map-btn"
              >
                📍 Nearest Hospital Emergency
              </a>
            </div>
            <button className="ghost-btn" onClick={() => setIsEmergency(false)} style={{ marginTop: '12px' }}>
              Back to Symptom Checker
            </button>
          </div>
        ) : (
          <>
            <div className="triage-input-row">
              <input
                type="text"
                placeholder={isListening ? "Listening... Speak your symptoms" : "e.g., severe toothache, high fever..."}
                value={symptomInput}
                onChange={(e) => {
                  setSymptomInput(e.target.value);
                  evaluateSymptoms(e.target.value);
                }}
                className="triage-text-input"
              />
              <button 
                type="button" 
                onClick={startVoiceTriage} 
                className={`triage-mic-btn ${isListening ? 'listening' : ''}`}
                title="Speak symptoms"
              >
                🎙️
              </button>
            </div>

            <p className="triage-section-label">Or choose common symptoms:</p>
            <div className="triage-chips-grid">
              {commonSymptoms.map((item) => (
                <button
                  key={item.specialty}
                  className="triage-chip"
                  onClick={() => {
                    setSymptomInput(item.label);
                    setTriageResult({ specialty: item.specialty, message: `Recommended specialist for ${item.label.toLowerCase()}` });
                    setIsEmergency(false);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {triageResult && (
              <div className="triage-result-card">
                <div className="result-badge">Recommended Specialist</div>
                <h4>{triageResult.specialty}</h4>
                <p>{triageResult.message}</p>
                <button
                  className="primary-btn"
                  onClick={() => {
                    onSelectSpecialty(triageResult.specialty);
                    onClose();
                  }}
                >
                  Find Available {triageResult.specialty}s →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
