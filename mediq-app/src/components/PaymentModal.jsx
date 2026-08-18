// src/components/PaymentModal.jsx
import React, { useState } from 'react';
import './PaymentModal.css';

const PaymentModal = ({ isOpen, onClose, onConfirm, doctorName, fee, loading }) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(paymentMethod);
  };

  return (
    <div className="payment-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <button className="payment-close" onClick={onClose}>✕</button>
        
        <div className="payment-header">
          <h2>Confirm Booking</h2>
          <p className="payment-subtitle">
            {doctorName} • ₹{fee}
          </p>
        </div>

        <div className="payment-methods">
          <div 
            className={`payment-method ${paymentMethod === 'cash' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('cash')}
          >
            <span className="payment-icon">💰</span>
            <div>
              <h4>Cash</h4>
              <p>Pay at the clinic</p>
            </div>
            {paymentMethod === 'cash' && (
              <span className="payment-check">✓</span>
            )}
          </div>

          <div 
            className={`payment-method ${paymentMethod === 'upi' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('upi')}
          >
            <span className="payment-icon">📱</span>
            <div>
              <h4>UPI</h4>
              <p>Pay via PhonePe, GPay, etc.</p>
            </div>
            {paymentMethod === 'upi' && (
              <span className="payment-check">✓</span>
            )}
          </div>
        </div>

        <div className="payment-actions">
          <button 
            className="payment-cancel" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="payment-confirm"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Booking...' : 'Confirm & Book'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
