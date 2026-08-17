import { useState } from 'react';
import './Login.css';

export default function Login({ onLoginSuccess, onContinueAsGuest }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (phoneNumber.length < 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }
    setOtpSent(true);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp.length < 4) {
      alert('Please enter the verification code.');
      return;
    }
    // Simulate successful login with user object
    onLoginSuccess({ id: 'user_' + Date.now(), phone: phoneNumber }, 'Yash Dani');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Brand Header */}
        <div className="login-brand">
          <div className="login-logo-icon">🏥</div>
          <h2>MediQ</h2>
          <p>Instant Healthcare & Queue Management</p>
        </div>

        {/* Form Section */}
        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="login-form">
            <div className="input-group">
              <label>Mobile Number</label>
              <div className="phone-input-wrap">
                <span className="country-code">+91</span>
                <input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
            </div>

            <button type="submit" className="login-primary-btn">
              Continue with OTP →
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="login-form">
            <p className="otp-subtitle">
              Enter the 4-digit verification code sent to <strong>+91 {phoneNumber}</strong>
            </p>
            <div className="input-group">
              <input
                type="text"
                placeholder="• • • •"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="otp-pin-input"
                required
              />
            </div>

            <button type="submit" className="login-primary-btn">
              Verify & Sign In
            </button>
            
            <button
              type="button"
              className="login-text-btn"
              onClick={() => setOtpSent(false)}
            >
              ← Change Mobile Number
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="login-divider">
          <span>or</span>
        </div>

        {/* Guest Action */}
        <button className="login-guest-btn" onClick={onContinueAsGuest}>
          Browse as Guest
        </button>

        {/* Security Footer Note */}
        <div className="login-footer-badge">
          <span>🔒 Verified Hospitals & Secure Booking</span>
        </div>
      </div>
    </div>
  );
}
