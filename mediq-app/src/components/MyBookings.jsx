import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { getMyBookings, cancelAppointment } from '../hospitalData';
import './MyBookings.css';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        setBookings([]);
        return;
      }

      const data = await getMyBookings(user.id);

      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(appointmentId) {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this appointment?'
    );

    if (!confirmed) return;

    setCancellingId(appointmentId);

    try {
      const result = await cancelAppointment(appointmentId);

      if (result?.error) {
        console.error(result.error);
        alert('Could not cancel the appointment. Please try again.');
        return;
      }

      alert('Appointment cancelled successfully.');

      await loadBookings();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setCancellingId(null);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';

    try {
      return new Date(dateString).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  }

  function getStatusClass(status) {
    switch (status?.toLowerCase()) {
      case 'waiting':
        return 'status-waiting';

      case 'checked_in':
        return 'status-checked-in';

      case 'seen':
      case 'completed':
        return 'status-completed';

      case 'cancelled':
        return 'status-cancelled';

      default:
        return 'status-default';
    }
  }

  if (loading) {
    return (
      <div className="my-bookings-page">
        <div className="bookings-loading">
          <div className="bookings-spinner" />
          <p>Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-bookings-page">
      <div className="my-bookings-container">
        <div className="bookings-header">
          <div>
            <p className="bookings-eyebrow">
              MEDIQ PATIENT PORTAL
            </p>

            <h1>My Bookings</h1>

            <p className="bookings-subtitle">
              View and manage your doctor appointments.
            </p>
          </div>

          <button
            type="button"
            className="refresh-bookings-btn"
            onClick={loadBookings}
          >
            ↻ Refresh
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="bookings-empty">
            <div className="bookings-empty-icon">
              📅
            </div>

            <h2>No bookings found</h2>

            <p>
              You don't have any doctor appointments yet.
              Book an appointment from the Home page.
            </p>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking) => {
              const doctorName =
                booking.doctor?.name || 'Doctor';

              const specialty =
                booking.doctor?.specialty || 'General Consultation';

              const hospitalName =
                booking.hospital?.name || 'Hospital';

              const location =
                booking.hospital?.location || '';

              const city =
                booking.hospital?.city || '';

              const mapsUrl =
                booking.hospital?.google_maps_url;

              return (
                <div
                  className="booking-card"
                  key={booking.id}
                >
                  <div className="booking-card-top">
                    <div className="doctor-info">
                      <div className="doctor-avatar">
                        {doctorName.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <h2>{doctorName}</h2>

                        <p className="doctor-specialty">
                          {specialty}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`booking-status ${getStatusClass(
                        booking.status
                      )}`}
                    >
                      {booking.status || 'Unknown'}
                    </span>
                  </div>

                  <div className="booking-details">
                    <div className="booking-detail">
                      <span className="detail-icon">
                        🏥
                      </span>

                      <div>
                        <span className="detail-label">
                          Hospital
                        </span>

                        <strong>
                          {hospitalName}
                        </strong>
                      </div>
                    </div>

                    {(location || city) && (
                      <div className="booking-detail">
                        <span className="detail-icon">
                          📍
                        </span>

                        <div>
                          <span className="detail-label">
                            Location
                          </span>

                          <strong>
                            {[location, city]
                              .filter(Boolean)
                              .join(', ')}
                          </strong>
                        </div>
                      </div>
                    )}

                    <div className="booking-detail">
                      <span className="detail-icon">
                        🎫
                      </span>

                      <div>
                        <span className="detail-label">
                          Queue Number
                        </span>

                        <strong className="queue-number">
                          #{booking.queue_number ?? 'N/A'}
                        </strong>
                      </div>
                    </div>

                    <div className="booking-detail">
                      <span className="detail-icon">
                        💳
                      </span>

                      <div>
                        <span className="detail-label">
                          Payment Method
                        </span>

                        <strong>
                          {booking.payment_method || 'Not specified'}
                        </strong>
                      </div>
                    </div>

                    {booking.doctor?.consultation_fee && (
                      <div className="booking-detail">
                        <span className="detail-icon">
                          ₹
                        </span>

                        <div>
                          <span className="detail-label">
                            Consultation Fee
                          </span>

                          <strong>
                            ₹{booking.doctor.consultation_fee}
                          </strong>
                        </div>
                      </div>
                    )}

                    {booking.booked_at && (
                      <div className="booking-detail booking-date">
                        <span className="detail-icon">
                          🕒
                        </span>

                        <div>
                          <span className="detail-label">
                            Booked On
                          </span>

                          <strong>
                            {formatDate(booking.booked_at)}
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="booking-actions">
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="directions-btn"
                      >
                        📍 Get Directions
                      </a>
                    )}

                    {booking.status === 'waiting' && (
                      <button
                        type="button"
                        className="cancel-booking-btn"
                        onClick={() =>
                          handleCancel(booking.id)
                        }
                        disabled={
                          cancellingId === booking.id
                        }
                      >
                        {cancellingId === booking.id
                          ? 'Cancelling...'
                          : 'Cancel Appointment'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
