import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  getMyBookings,
  cancelAppointment,
} from '../hospitalData';

import './MyBookings.css';

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setBookings([]);
      setLoading(false);
      return;
    }

    const data = await getMyBookings(user.id);

    setBookings(data || []);
    setLoading(false);
  }

  async function handleCancel(appointmentId) {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this appointment?'
    );

    if (!confirmed) return;

    const result = await cancelAppointment(appointmentId);

    if (result.error) {
      alert('Could not cancel appointment. Please try again.');
      return;
    }

    alert('Appointment cancelled successfully.');

    loadBookings();
  }

  if (loading) {
    return (
      <div className="my-bookings-loading">
        Loading your bookings...
      </div>
    );
  }

  return (
    <div className="my-bookings-page">

      <div className="my-bookings-header">
        <h2 className="my-bookings-title">
          My Bookings
        </h2>

        <p className="my-bookings-subtitle">
          View and manage all your appointments.
        </p>
      </div>

      {bookings.length === 0 ? (

        <div className="my-bookings-empty">
          <div className="my-bookings-empty-icon">
            📅
          </div>

          <h3>No bookings found</h3>

          <p>
            Your booked doctor appointments will appear here.
          </p>
        </div>

      ) : (

        <div className="my-bookings-list">

          {bookings.map((booking) => {

            const doctorName =
              booking.doctor?.name || 'Doctor';

            const doctorInitial =
              doctorName.charAt(0).toUpperCase();

            return (

              <div
                className="booking-card"
                key={booking.id}
              >

                {/* HEADER */}

                <div className="booking-card-header">

                  <div className="booking-doctor-info">

                    <div className="booking-doctor-avatar">
                      {doctorInitial}
                    </div>

                    <div>
                      <h3 className="booking-doctor-name">
                        {doctorName}
                      </h3>

                      <p className="booking-specialty">
                        {booking.doctor?.specialty || 'Specialist'}
                      </p>
                    </div>

                  </div>


                  <div
                    className={`booking-status ${
                      booking.status || ''
                    }`}
                  >
                    {booking.status || 'Unknown'}
                  </div>

                </div>


                {/* DETAILS */}

                <div className="booking-details">

                  <div className="booking-detail">
                    <span className="booking-detail-label">
                      Hospital
                    </span>

                    <span className="booking-detail-value">
                      {booking.hospital?.name || 'N/A'}
                    </span>
                  </div>


                  <div className="booking-detail">
                    <span className="booking-detail-label">
                      Queue Number
                    </span>

                    <span className="booking-detail-value">
                      #{booking.queue_number || 'N/A'}
                    </span>
                  </div>


                  <div className="booking-detail">
                    <span className="booking-detail-label">
                      City
                    </span>

                    <span className="booking-detail-value">
                      {booking.hospital?.city || 'N/A'}
                    </span>
                  </div>


                  <div className="booking-detail">
                    <span className="booking-detail-label">
                      Payment
                    </span>

                    <span className="booking-detail-value">
                      {booking.payment_method || 'N/A'}
                    </span>
                  </div>


                  <div className="booking-detail full-width">
                    <span className="booking-detail-label">
                      Location
                    </span>

                    <span className="booking-detail-value">
                      {booking.hospital?.location || 'N/A'}
                    </span>
                  </div>

                </div>


                {/* ACTION BUTTONS */}

                <div className="booking-actions">

                  {booking.hospital?.google_maps_url && (
                    <a
                      href={booking.hospital.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="booking-map-button"
                    >
                      📍 Open in Maps
                    </a>
                  )}


                  {booking.status === 'waiting' && (
                    <button
                      className="booking-cancel-button"
                      onClick={() =>
                        handleCancel(booking.id)
                      }
                    >
                      Cancel Appointment
                    </button>
                  )}

                </div>

              </div>
            );
          })}

        </div>

      )}

    </div>
  );
}

export default MyBookings;
