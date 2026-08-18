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
  const isActive = booking.status !== 'cancelled'
