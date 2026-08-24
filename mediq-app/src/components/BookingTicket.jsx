```jsx
// src/components/BookingTicket.jsx

import React, {
  useState,
  useEffect,
  useRef,
} from 'react';

import {
  getAppointmentStatus,
  cancelAppointment,
} from '../hospitalData';

import './BookingTicket.css';

const BookingTicket = ({
  appointment,
  doctor,
  patientsAheadOverride,
  paymentMethod,
  upiInfo,
  onClose,
}) => {
  const [booking, setBooking] =
    useState(() => ({
      id: appointment?.id,

      token_number:
        appointment?.token_number,

      queue_number:
        appointment?.queue_number,

      status:
        appointment?.status ||
        'waiting',

      booked_at:
        appointment?.booked_at ||
        appointment?.created_at,

      checked_in_at:
        appointment?.checked_in_at ||
        null,

      queue_position:
        patientsAheadOverride,

      doctors: doctor
        ? {
            name: doctor.name,
            specialty:
              doctor.specialty,
            consultation_fee:
              doctor.consultation_fee,
          }
        : null,

      hospitals:
        appointment?.hospital
          ? {
              name:
                appointment.hospital.name,
            }
          : null,
    }));

  const [cancelling, setCancelling] =
    useState(false);

  const [
    showCancelConfirm,
    setShowCancelConfirm,
  ] = useState(false);

  const intervalRef = useRef(null);

  /* =====================================================
     FETCH LIVE STATUS
  ===================================================== */

  const fetchStatus = async () => {
    if (!booking?.id) return;

    try {
      const status =
        await getAppointmentStatus(
          booking.id
        );

      if (status) {
        setBooking((prev) => ({
          ...prev,

          status:
            status.status,

          checked_in_at:
            status.checked_in_at,

          booked_at:
            status.booked_at ||
            status.created_at ||
            prev.booked_at,
        }));
      }
    } catch (err) {
      console.error(
        'Error fetching status:',
        err
      );
    }
  };

  useEffect(() => {
    if (!booking?.id) return;

    fetchStatus();

    const interval = setInterval(
      fetchStatus,
      15000
    );

    intervalRef.current = interval;

    return () => {
      if (intervalRef.current) {
        clearInterval(
          intervalRef.current
        );
      }
    };
  }, [booking?.id]);

  /* =====================================================
     CANCEL BOOKING
  ===================================================== */

  const handleCancel = async () => {
    if (!booking?.id) {
      alert('Booking ID is missing.');
      return;
    }

    setCancelling(true);

    try {
      const result =
        await cancelAppointment(
          booking.id
        );

      if (result?.error) {
        throw result.error;
      }

      setBooking((prev) => ({
        ...prev,
        status: 'cancelled',
      }));

      setShowCancelConfirm(false);

      alert(
        'Booking cancelled successfully.'
      );

      setTimeout(() => {
        onClose();
      }, 800);

    } catch (err) {
      console.error(
        'Error cancelling booking:',
        err
      );

      alert(
        err?.message ||
          'Failed to cancel booking. Please try again.'
      );

    } finally {
      setCancelling(false);
    }
  };

  /* =====================================================
     DATE & TIME
  ===================================================== */

  const formatTime = (dateStr) => {
    if (!dateStr) return '--';

    const date = new Date(dateStr);

    return date.toLocaleTimeString(
      'en-IN',
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';

    const date = new Date(dateStr);

    return date.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );
  };

  /* =====================================================
     STATUS
  ===================================================== */

  const isCheckedIn =
    !!booking?.checked_in_at;

  const isCompleted =
    booking?.status === 'completed' ||
    booking?.status === 'seen';

  const isCancelled =
    booking?.status === 'cancelled';

  const isActive =
    !isCompleted &&
    !isCancelled;

  let progress = 0;

  if (isCancelled) {
    progress = 0;
  } else if (isCompleted) {
    progress = 100;
  } else if (isCheckedIn) {
    progress = 50;
  } else {
    progress = 0;
  }

  const progressLabel =
    isCancelled
      ? 'Cancelled'
      : isCompleted
        ? 'Complete'
        : isCheckedIn
          ? 'Checked In'
          : 'Waiting';

  const bookedStepActive = true;

  const checkedInStepActive =
    isCheckedIn ||
    isCompleted;

  const yourTurnStepActive =
    isCompleted;

  const queueStatusText =
    isCancelled
      ? 'Cancelled'
      : isCompleted
        ? 'Completed'
        : isCheckedIn
          ? 'Checked in — waiting to be called'
          : 'Waiting to be called';

  const displayStatusLabel =
    isCancelled
      ? 'Cancelled'
      : isCompleted
        ? 'Completed'
        : isCheckedIn
          ? 'Checked In'
          : 'Waiting';

  /* =====================================================
     BOOKING NOT FOUND
  ===================================================== */

  if (!booking?.id) {
    return (
      <div className="ticket-error">

        <span className="ticket-error-icon">
          ⚠️
        </span>

        <h3>
          Booking not found
        </h3>

        <p>
          We couldn't find your booking details
        </p>

        <button
          className="ticket-close-btn"
          onClick={onClose}
        >
          Close
        </button>

      </div>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="ticket-container">

      <button
        className="ticket-close"
        onClick={onClose}
      >
        ✕
      </button>

      {/* HEADER */}

      <div className="ticket-header">

        <div className="ticket-brand">

          <span className="ticket-brand-icon">
            🏥
          </span>

          <span className="ticket-brand-name">
            MediQ
          </span>

        </div>

        <div className="ticket-status-pill">

          {isCancelled
            ? 'Cancelled'
            : isCompleted
              ? 'Completed'
              : 'Active'}

        </div>

      </div>

      {/* TOKEN */}

      <div className="ticket-token">

        <span className="ticket-token-label">
          Token
        </span>

        <span className="ticket-token-number">
          #
          {booking.token_number ||
            booking.queue_number ||
            '--'}
        </span>

      </div>

      {/* PROGRESS */}

      <div className="ticket-progress-container">

        <div className="ticket-progress-ring">

          <svg
            className="ticket-progress-svg"
            viewBox="0 0 120 120"
          >

            <circle
              className="ticket-progress-bg"
              cx="60"
              cy="60"
              r="50"
            />

            <circle
              className={
                `ticket-progress-fill ` +
                `${isCancelled ? 'cancelled' : ''}`
              }
              cx="60"
              cy="60"
              r="50"
              style={{
                strokeDasharray: 314.16,

                strokeDashoffset:
                  314.16 -
                  (progress / 100) *
                    314.16,
              }}
            />

            <text
              className="ticket-progress-text"
              x="60"
              y="56"
            >
              {progress}%
            </text>

            <text
              className="ticket-progress-label"
              x="60"
              y="72"
            >
              {progressLabel}
            </text>

          </svg>

        </div>

        {/* QUEUE */}

        <div className="ticket-queue-info">

          <span className="ticket-queue-label">
            Patients Ahead
          </span>

          <span className="ticket-queue-number">
            #
            {booking.queue_position ??
              '--'}
          </span>

          <span className="ticket-queue-status">
            {queueStatusText}
          </span>

        </div>

      </div>

      {/* TIMELINE */}

      <div className="ticket-timeline">

        {/* BOOKED */}

        <div
          className={
            `ticket-timeline-step ` +
            `${bookedStepActive ? 'active' : ''}`
          }
        >

          <span className="ticket-timeline-icon">
            📋
          </span>

          <div className="ticket-timeline-content">

            <p className="ticket-timeline-label">
              Booked
            </p>

            <p className="ticket-timeline-time">
              {formatTime(
                booking.booked_at
              )}
            </p>

          </div>

          {bookedStepActive && (
            <span className="ticket-timeline-dot" />
          )}

        </div>

        {/* CHECKED IN */}

        <div
          className={
            `ticket-timeline-step ` +
            `${
              checkedInStepActive
                ? 'active'
                : ''
            }`
          }
        >

          <span className="ticket-timeline-icon">
            ✅
          </span>

          <div className="ticket-timeline-content">

            <p className="ticket-timeline-label">
              Checked In
            </p>

            <p className="ticket-timeline-time">

              {booking.checked_in_at
                ? formatTime(
                    booking.checked_in_at
                  )
                : 'Waiting...'}

            </p>

          </div>

          {isCheckedIn &&
            !isCompleted && (
              <span className="ticket-timeline-dot pulse" />
            )}

          {isCompleted && (
            <span className="ticket-timeline-dot" />
          )}

        </div>

        {/* YOUR TURN */}

        <div
          className={
            `ticket-timeline-step ` +
            `${
              yourTurnStepActive
                ? 'active'
                : ''
            }`
          }
        >

          <span className="ticket-timeline-icon">
            🏥
          </span>

          <div className="ticket-timeline-content">

            <p className="ticket-timeline-label">
              Your Turn
            </p>

            <p className="ticket-timeline-time">

              {isCompleted
                ? 'Completed'
                : 'Soon'}

            </p>

          </div>

          {isCompleted && (
            <span className="ticket-timeline-dot" />
          )}

        </div>

      </div>

      {/* DETAILS */}

      <div className="ticket-details">

        <div className="ticket-detail-row">

          <span className="ticket-detail-label">
            Doctor
          </span>

          <span className="ticket-detail-value">
            {booking.doctors?.name || '--'}
          </span>

        </div>

        <div className="ticket-detail-row">

          <span className="ticket-detail-label">
            Specialty
          </span>

          <span className="ticket-detail-value">
            {booking.doctors?.specialty || '--'}
          </span>

        </div>

        <div className="ticket-detail-row">

          <span className="ticket-detail-label">
            Hospital
          </span>

          <span className="ticket-detail-value">

            {booking.hospitals?.name ||
              '--'}

          </span>

        </div>

        <div className="ticket-detail-row">

          <span className="ticket-detail-label">
            Date
          </span>

          <span className="ticket-detail-value">
            {formatDate(
              booking.booked_at
            )}
          </span>

        </div>

        <div className="ticket-detail-row">

          <span className="ticket-detail-label">
            Payment
          </span>

          <span className="ticket-detail-value">

            {paymentMethod === 'upi'
              ? `UPI${
                  upiInfo?.upiId
                    ? ` · ${upiInfo.upiId}`
                    : ''
                }`
              : 'Cash'}

          </span>

        </div>

        <div className="ticket-detail-row">

          <span className="ticket-detail-label">
            Status
          </span>

          <span
            className={
              `ticket-detail-status ` +
              `${booking.status}`
            }
          >
            {displayStatusLabel}
          </span>

        </div>

      </div>

      {/* CANCEL */}

      {isActive && (

        <div className="ticket-actions">

          {!showCancelConfirm ? (

            <button
              className="ticket-cancel-btn"
              onClick={() =>
                setShowCancelConfirm(true)
              }
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
                  onClick={() =>
                    setShowCancelConfirm(false)
                  }
                  disabled={cancelling}
                >
                  No, Keep it
                </button>

                <button
                  className="ticket-cancel-confirm-yes"
                  onClick={handleCancel}
                  disabled={cancelling}
                >

                  {cancelling
                    ? 'Cancelling...'
                    : 'Yes, Cancel'}

                </button>

              </div>

            </div>

          )}

        </div>

      )}

      {/* FOOTER */}

      <div className="ticket-footer">

        <span>
          Booking ID:{' '}
          {booking.id?.slice(0, 8)}
        </span>

        <span>•</span>

        <span>
          MediQ Secure
        </span>

      </div>

    </div>
  );
};

export default BookingTicket;
```
