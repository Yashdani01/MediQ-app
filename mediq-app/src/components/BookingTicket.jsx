// src/components/BookingTicket.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { getAppointmentStatus, cancelAppointment } from '../hospitalData';
import './BookingTicket.css';

const BookingTicket = ({ bookingId, onClose, onCancel, user }) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  const intervalRef = useRef(null);

  const fetchBookingDetails = async () => {
    if (!bookingId) return;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctors:doctor_id (name, specialty, consultation_fee),
          hospitals:hospital_id (name, location)
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      setBooking(data);
      updateProgress(data);
    } catch (err) {
      console.error('Error fetching booking:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    if (!bookingId) return;

    try {
      const status = await getAppointmentStatus(bookingId);
      if (status) {
        setBooking((prev) => ({
          ...prev,
          status: status.status,
          checked_in_at: status.checked_in_at,
        }));
        updateProgress(status);
      }
    } catch (err) {
      console.error('Error fetching status:', err);
    }
  };

  const updateProgress = (data) => {
    if (!data) return;

    const status = data.status;
    let progressValue = 0;

    switch (status) {
      case 'booked':
        progressValue = 0;
        break;
      case 'checked-in':
        progressValue = 50;
        break;
      case 'seen':
        progressValue = 100;
        break;
      case 'cancelled':
        progressValue = 0;
        break;
      default:
        progressValue = 0;
    }

    setProgress(progressValue);
  };

  useEffect(() => {
    fetchBookingDetails();

    const interval = setInterval(fetchStatus, 15000);
    intervalRef.current = interval;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [bookingId]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelAppointment(bookingId);
      if (onCancel) {
        onCancel(bookingId);
      }
      setShowCancelConfirm(false);
      onClose();
    } catch (err) {
      console.error('Error cancelling:', err);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusStep = (status) => {
    const steps = {
      booked: {
        label: 'Booked',
        icon: '📋',
        active: true,
        completed: false,
        description: 'Your booking is confirmed',
      },
      'checked-in': {
        label: 'Checked In',
        icon: '✅',
        active: true,
        completed: true,
        description: 'You\'ve arrived at the clinic',
      },
      seen: {
        label: 'Your Turn',
        icon: '🏥',
        active: true,
        completed: true,
        description: 'Doctor is ready to see you',
      },
      cancelled: {
        label: 'Cancelled',
        icon: '❌',
        active: false,
        completed: false,
        description: 'This booking was cancelled',
      },
    };
    return steps[status] || steps.booked;
  };

  if (loading) {
    return (
      <div className="ticket-loading">
        <div className="ticket-loading-spinner"></div>
        <p>Loading your ticket...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="ticket-error">
        <span className="ticket-error-icon">⚠️</span>
        <h3>Booking not found</h3>
        <p>We couldn't find your booking details</p>
        <button className="ticket-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  const statusStep = getStatusStep(booking.status);
  const isActive = booking.status !== 'cancelled' && booking.status !== 'completed';
  const isCancelled = booking.status === 'cancelled';

  return (
    <div className="ticket-container">
      {/* Close Button */}
      <button className="ticket-close" onClick={onClose}>
        ✕
      </button>

      {/* Header */}
      <div className="ticket-header">
        <div className="ticket-brand">
          <span className="ticket-brand-icon">🏥</span>
          <span className="ticket-brand-name">MediQ</span>
        </div>
        <div className="ticket-status-pill">
          {isCancelled ? 'Cancelled' : 'Active'}
        </div>
      </div>

      {/* Token Number */}
      <div className="ticket-token">
        <span className="ticket-token-label">Token</span>
        <span className="ticket-token-number">
          #{booking.token_number || booking.queue_number}
        </span>
      </div>

      {/* Progress Ring */}
      <div className="ticket-progress-container">
        <div className="ticket-progress-ring">
          <svg className="ticket-progress-svg" viewBox="0 0 120 120">
            <circle className="ticket-progress-bg" cx="60" cy="60" r="50" />
            <circle
              className={`ticket-progress-fill ${isCancelled ? 'cancelled' : ''}`}
              cx="60"
              cy="60"
              r="50"
              style={{
                strokeDasharray: 314.16,
                strokeDashoffset: 314.16 - (progress / 100) * 314.16,
              }}
            />
            <text className="ticket-progress-text" x="60" y="56">
              {progress}%
            </text>
            <text className="ticket-progress-label" x="60" y="72">
              {booking.status === 'seen' ? 'Complete' : 'In Progress'}
            </text>
          </svg>
        </div>

        {/* Queue Position */}
        <div className="ticket-queue-info">
          <span className="ticket-queue-label">Your Position</span>
          <span className="ticket-queue-number">
            #{booking.queue_position || '--'}
          </span>
          <span className="ticket-queue-status">
            {booking.status === 'booked' && 'Waiting to be called'}
            {booking.status === 'checked-in' && 'Checked in'}
            {booking.status === 'seen' && 'Being seen now'}
            {booking.status === 'cancelled' && 'Cancelled'}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="ticket-timeline">
        <div className={`ticket-timeline-step ${booking.status === 'booked' || booking.status === 'checked-in' || booking.status === 'seen' ? 'active' : ''}`}>
          <span className="ticket-timeline-icon">📋</span>
          <div className="ticket-timeline-content">
            <p className="ticket-timeline-label">Booked</p>
            <p className="ticket-timeline-time">
              {formatTime(booking.booked_at || booking.created_at)}
            </p>
          </div>
          {(booking.status === 'booked' || booking.status === 'checked-in' || booking.status === 'seen') && (
            <span className="ticket-timeline-dot"></span>
          )}
        </div>

        <div className={`ticket-timeline-step ${booking.status === 'checked-in' || booking.status === 'seen' ? 'active' : ''}`}>
          <span className="ticket-timeline-icon">✅</span>
          <div className="ticket-timeline-content">
            <p className="ticket-timeline-label">Checked In</p>
            <p className="ticket-timeline-time">
              {booking.checked_in_at ? formatTime(booking.checked_in_at) : 'Waiting...'}
            </p>
          </div>
          {booking.status === 'checked-in' && (
            <span className="ticket-timeline-dot pulse"></span>
          )}
          {booking.status === 'seen' && (
            <span className="ticket-timeline-dot"></span>
          )}
        </div>

        <div className={`ticket-timeline-step ${booking.status === 'seen' ? 'active' : ''}`}>
          <span className="ticket-timeline-icon">🏥</span>
          <div className="ticket-timeline-content">
            <p className="ticket-timeline-label">Your Turn</p>
            <p className="ticket-timeline-time">
              {booking.status === 'seen' ? 'Now' : 'Soon'}
            </p>
          </div>
          {booking.status === 'seen' && (
            <span className="ticket-timeline-dot"></span>
          )}
        </div>
      </div>

      {/* Booking Details */}
      <div className="ticket-details">
        <div className="ticket-detail-row">
          <span className="ticket-detail-label">Doctor</span>
          <span className="ticket-detail-value">{booking.doctors?.name}</span>
        </div>
        <div className="ticket-detail-row">
          <span className="ticket-detail-label">Specialty</span>
          <span className="ticket-detail-value">{booking.doctors?.specialty}</span>
        </div>
        <div className="ticket-detail-row">
          <span className="ticket-detail-label">Hospital</span>
          <span className="ticket-detail-value">{booking.hospitals?.name}</span>
        </div>
        <div className="ticket-detail-row">
          <span className="ticket-detail-label">Date</span>
          <span className="ticket-detail-value">
            {formatDate(booking.booked_at || booking.created_at)}
          </span>
        </div>
        <div className="ticket-detail-row">
          <span className="ticket-detail-label">Status</span>
          <span className={`ticket-detail-status ${booking.status}`}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Actions */}
      {isActive && (
        <div className="ticket-actions">
          {!showCancelConfirm ? (
            <button
              className="ticket-cancel-btn"
              onClick={() => setShowCancelConfirm(true)}
              disabled={cancelling}
            >
              Cancel Booking
            </button>
          ) : (
            <div className="ticket-cancel-confirm">
              <p className="ticket-cancel-confirm-text">
                Are you sure you want to cancel this booking?
              </p>
              <div className="ticket-cancel-confirm-buttons">
                <button
                  className="ticket-cancel-confirm-no"
                  onClick={() => setShowCancelConfirm(false)}
                >
                  No, Keep it
                </button>
                <button
                  className="ticket-cancel-confirm-yes"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="ticket-footer">
        <span>Booking ID: {booking.id?.slice(0, 8)}</span>
        <span>•</span>
        <span>MediQ Secure</span>
      </div>
    </div>
  );
};

export default BookingTicket;
