// src/components/BookingTicket.jsx

import React, { useState, useEffect, useRef } from 'react';
import { getAppointmentStatus, cancelAppointment } from '../hospitalData';
import './BookingTicket.css';

const BookingTicket = ({
  appointment,
  doctor,
  patientsAheadOverride,
  paymentMethod,
  upiInfo,
  onClose,
  onCancelled,
}) => {
  const [booking, setBooking] = useState(() => ({
    id: appointment?.id,

    token_number:
      appointment?.token_number ??
      appointment?.queue_number ??
      null,

    queue_number:
      appointment?.queue_number ??
      appointment?.token_number ??
      null,

    status: appointment?.status || 'waiting',

    booked_at:
      appointment?.booked_at ||
      appointment?.created_at ||
      null,

    appointment_date:
      appointment?.appointment_date ||
      appointment?.booking_date ||
      appointment?.date ||
      null,

    appointment_time:
      appointment?.appointment_time ||
      appointment?.booking_time ||
      appointment?.time ||
      null,

    checked_in_at:
      appointment?.checked_in_at || null,

    queue_position:
      patientsAheadOverride ??
      appointment?.queue_position ??
      null,

    doctors: doctor
      ? {
          name: doctor.name,
          specialty: doctor.specialty,
          consultation_fee: doctor.consultation_fee,
        }
      : appointment?.doctors || null,

    hospitals: appointment?.hospital
      ? {
          name: appointment.hospital.name,
        }
      : appointment?.hospitals || null,
  }));

  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const intervalRef = useRef(null);

  /*
   * Keep booking data synced if the parent sends updated appointment data.
   */
  useEffect(() => {
    if (!appointment?.id) return;

    setBooking((prev) => ({
      ...prev,

      id: appointment.id,

      token_number:
        appointment.token_number ??
        appointment.queue_number ??
        prev.token_number,

      queue_number:
        appointment.queue_number ??
        appointment.token_number ??
        prev.queue_number,

      status: appointment.status || prev.status,

      booked_at:
        appointment.booked_at ||
        appointment.created_at ||
        prev.booked_at,

      appointment_date:
        appointment.appointment_date ||
        appointment.booking_date ||
        appointment.date ||
        prev.appointment_date,

      appointment_time:
        appointment.appointment_time ||
        appointment.booking_time ||
        appointment.time ||
        prev.appointment_time,

      checked_in_at:
        appointment.checked_in_at ?? prev.checked_in_at,

      doctors:
        doctor
          ? {
              name: doctor.name,
              specialty: doctor.specialty,
              consultation_fee: doctor.consultation_fee,
            }
          : appointment.doctors || prev.doctors,

      hospitals:
        appointment.hospital
          ? {
              name: appointment.hospital.name,
            }
          : appointment.hospitals || prev.hospitals,
    }));
  }, [appointment, doctor]);

  /*
   * Fetch latest booking status.
   */
  const fetchStatus = async () => {
    if (!booking?.id) return;

    try {
      const statusData = await getAppointmentStatus(booking.id);

      if (!statusData) return;

      setBooking((prev) => ({
        ...prev,

        status:
          statusData.status ||
          prev.status,

        checked_in_at:
          statusData.checked_in_at ??
          prev.checked_in_at,

        booked_at:
          statusData.booked_at ||
          statusData.created_at ||
          prev.booked_at,

        appointment_date:
          statusData.appointment_date ||
          statusData.booking_date ||
          statusData.date ||
          prev.appointment_date,

        appointment_time:
          statusData.appointment_time ||
          statusData.booking_time ||
          statusData.time ||
          prev.appointment_time,

        queue_position:
          statusData.queue_position ??
          statusData.patients_ahead ??
          prev.queue_position,
      }));
    } catch (err) {
      console.error('Error fetching booking status:', err);
    }
  };

  /*
   * Auto-refresh active appointment status.
   */
  useEffect(() => {
    if (!booking?.id) return;

    fetchStatus();

    intervalRef.current = setInterval(() => {
      fetchStatus();
    }, 15000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [booking?.id]);

  /*
   * Cancel appointment.
   */
  const handleCancel = async () => {
    if (!booking?.id || cancelling) return;

    setCancelling(true);
    setCancelError('');

    try {
      console.log('Cancelling appointment:', booking.id);

      const result = await cancelAppointment(booking.id);

      console.log('Cancel appointment result:', result);

      /*
       * Immediately update the ticket.
       */
      const cancelledBooking = {
        ...booking,
        status: 'cancelled',
      };

      setBooking(cancelledBooking);

      setShowCancelConfirm(false);

      /*
       * Notify parent component so My Bookings can refresh immediately.
       */
      if (typeof onCancelled === 'function') {
        await onCancelled(cancelledBooking);
      }

      /*
       * Stop status polling because booking is cancelled.
       */
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      /*
       * Close ticket after successful cancellation.
       */
      setTimeout(() => {
        if (typeof onClose === 'function') {
          onClose();
        }
      }, 500);

    } catch (err) {
      console.error('Error cancelling appointment:', err);

      const errorMessage =
        err?.message ||
        err?.error_description ||
        'Failed to cancel booking. Please try again.';

      setCancelError(errorMessage);

    } finally {
      setCancelling(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--';

    /*
     * If the database already stores a time like 10:30:00
     */
    if (
      typeof dateStr === 'string' &&
      /^\d{1,2}:\d{2}/.test(dateStr)
    ) {
      const [hourString, minute] = dateStr.split(':');

      const hour = Number(hourString);

      if (Number.isNaN(hour)) return dateStr;

      const ampm = hour >= 12 ? 'PM' : 'AM';

      const formattedHour =
        hour % 12 === 0
          ? 12
          : hour % 12;

      return `${formattedHour
        .toString()
        .padStart(2, '0')}:${minute} ${ampm}`;
    }

    const date = new Date(dateStr);

    if (Number.isNaN(date.getTime())) {
      return '--';
    }

    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';

    /*
     * Handle YYYY-MM-DD without timezone shifting.
     */
    if (
      typeof dateStr === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    ) {
      const [year, month, day] = dateStr.split('-');

      const date = new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
      );

      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }

    const date = new Date(dateStr);

    if (Number.isNaN(date.getTime())) {
      return '--';
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  /*
   * Status handling.
   */
  const normalizedStatus = (
    booking?.status || 'waiting'
  ).toLowerCase();

  const isCompleted =
    normalizedStatus === 'completed' ||
    normalizedStatus === 'seen';

  const isCancelled =
    normalizedStatus === 'cancelled' ||
    normalizedStatus === 'canceled';

  const isWaiting =
    normalizedStatus === 'waiting' ||
    normalizedStatus === 'pending' ||
    normalizedStatus === 'confirmed';

  const isCheckedIn = Boolean(booking?.checked_in_at);

  const isActive =
    !isCompleted &&
    !isCancelled;

  /*
   * Progress calculation.
   */
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
          : isWaiting
            ? 'Waiting'
            : booking?.status || 'Waiting';

  /*
   * Prefer actual appointment date.
   * Fall back to booked_at only if appointment date doesn't exist.
   */
  const displayDate =
    booking?.appointment_date ||
    booking?.booked_at;

  /*
   * Prefer actual appointment time.
   */
  const displayTime =
    booking?.appointment_time ||
    null;

  if (!booking?.id) {
    return (
      <div className="ticket-error">
        <span className="ticket-error-icon">
          ⚠️
        </span>

        <h3>Booking not found</h3>

        <p>
          We couldn't find your booking details.
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

  return (
    <div className="ticket-container">

      <button
        className="ticket-close"
        onClick={onClose}
        type="button"
        disabled={cancelling}
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

        <div
          className={`ticket-status-pill ${
            isCancelled
              ? 'cancelled'
              : 'active'
          }`}
        >
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
              className={`ticket-progress-fill ${
                isCancelled
                  ? 'cancelled'
                  : ''
              }`}
              cx="60"
              cy="60"
              r="50"
              style={{
                strokeDasharray: 314.16,
                strokeDashoffset:
                  314.16 -
                  (progress / 100) * 314.16,
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

        <div
          className={`ticket-timeline-step ${
            bookedStepActive
              ? 'active'
              : ''
          }`}
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

        <div
          className={`ticket-timeline-step ${
            checkedInStepActive
              ? 'active'
              : ''
          }`}
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

          {isCheckedIn && !isCompleted && (
            <span className="ticket-timeline-dot pulse" />
          )}

          {isCompleted && (
            <span className="ticket-timeline-dot" />
          )}

        </div>

        <div
          className={`ticket-timeline-step ${
            yourTurnStepActive
              ? 'active'
              : ''
          }`}
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

      {/* BOOKING DETAILS */}

      <div className="ticket-details">

        <div className="ticket-detail-row">

          <span className="ticket-detail-label">
            Doctor
          </span>

          <span className="ticket-detail-value">
            {booking.doctors?.name ||
              '--'}
          </span>

        </div>

        <div className="ticket-detail-row">

          <span className="ticket-detail-label">
            Specialty
          </span>

          <span className="ticket-detail-value">
            {booking.doctors?.specialty ||
              '--'}
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
            Appointment Date
          </span>

          <span className="ticket-detail-value">
            {formatDate(displayDate)}
          </span>

        </div>

        {displayTime && (
          <div className="ticket-detail-row">

            <span className="ticket-detail-label">
              Appointment Time
            </span>

            <span className="ticket-detail-value">
              {formatTime(displayTime)}
            </span>

          </div>
        )}

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
            className={`ticket-detail-status ${
              normalizedStatus
            }`}
          >
            {displayStatusLabel}
          </span>

        </div>

      </div>

      {/* CANCEL BOOKING */}

      {isActive && (

        <div className="ticket-actions">

          {!showCancelConfirm ? (

            <button
              className="ticket-cancel-btn"
              onClick={() => {
                setCancelError('');
                setShowCancelConfirm(true);
              }}
              disabled={cancelling}
              type="button"
            >
              Cancel Booking
            </button>

          ) : (

            <div className="ticket-cancel-confirm">

              <p className="ticket-cancel-confirm-text">
                Are you sure you want to cancel this booking?
              </p>

              {cancelError && (
                <p
                  style={{
                    color: '#dc2626',
                    fontSize: '13px',
                    marginBottom: '12px',
                  }}
                >
                  {cancelError}
                </p>
              )}

              <div className="ticket-cancel-confirm-buttons">

                <button
                  className="ticket-cancel-confirm-no"
                  onClick={() => {
                    setCancelError('');
                    setShowCancelConfirm(false);
                  }}
                  disabled={cancelling}
                  type="button"
                >
                  No, Keep it
                </button>

                <button
                  className="ticket-cancel-confirm-yes"
                  onClick={handleCancel}
                  disabled={cancelling}
                  type="button"
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
          {booking.id
            ? booking.id.slice(0, 8)
            : '--'}
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
