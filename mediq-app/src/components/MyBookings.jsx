import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { getMyBookings, cancelAppointment } from '../hospitalData';

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
      alert('Could not cancel appointment.');
      return;
    }

    alert('Appointment cancelled successfully.');
    loadBookings();
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading bookings...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>My Bookings</h2>

      {bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        bookings.map((booking) => (
          <div
            key={booking.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '15px',
            }}
          >
            <h3>{booking.doctor?.name || 'Doctor'}</h3>

            <p>
              <strong>Specialty:</strong>{' '}
              {booking.doctor?.specialty || 'N/A'}
            </p>

            <p>
              <strong>Hospital:</strong>{' '}
              {booking.hospital?.name || 'N/A'}
            </p>

            <p>
              <strong>Location:</strong>{' '}
              {booking.hospital?.location || 'N/A'}
            </p>

            <p>
              <strong>City:</strong>{' '}
              {booking.hospital?.city || 'N/A'}
            </p>

            <p>
              <strong>Queue Number:</strong>{' '}
              {booking.queue_number}
            </p>

            <p>
              <strong>Status:</strong> {booking.status}
            </p>

            <p>
              <strong>Payment:</strong>{' '}
              {booking.payment_method || 'N/A'}
            </p>

            {booking.hospital?.google_maps_url && (
              <p>
                <a
                  href={booking.hospital.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📍 Open in Google Maps
                </a>
              </p>
            )}

            {booking.status === 'waiting' && (
              <button
                onClick={() => handleCancel(booking.id)}
                style={{
                  padding: '10px 15px',
                  cursor: 'pointer',
                }}
              >
                Cancel Appointment
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default MyBookings;
