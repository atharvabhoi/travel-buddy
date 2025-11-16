import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { FaCheckCircle, FaRupeeSign, FaDownload } from 'react-icons/fa';
import { format } from 'date-fns';
import './BookingConfirmation.css';

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      const bookingSnap = await getDoc(bookingRef);
      
      if (bookingSnap.exists()) {
        setBooking({ id: bookingSnap.id, ...bookingSnap.data() });
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading booking details...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="error-container">
        <div className="error">Booking not found</div>
        <Link to="/" className="btn btn-primary">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="booking-confirmation-page">
      <div className="container">
        <div className="confirmation-card">
          <div className="success-header">
            <FaCheckCircle className="success-icon" />
            <h1>Booking Confirmed!</h1>
            <p>Your ticket has been booked successfully</p>
          </div>

          <div className="booking-id">
            <span className="id-label">Booking ID:</span>
            <span className="id-value">{booking.id}</span>
          </div>

          <div className="ticket-details">
            <div className="ticket-section">
              <h3>Journey Details</h3>
              <div className="detail-row">
                <span className="detail-label">Route:</span>
                <span className="detail-value">{booking.from} → {booking.to}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date:</span>
                <span className="detail-value">
                  {format(new Date(booking.date), 'EEEE, MMMM dd, yyyy')}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Departure:</span>
                <span className="detail-value">{booking.departureTime}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Arrival:</span>
                <span className="detail-value">{booking.arrivalTime}</span>
              </div>
            </div>

            <div className="ticket-section">
              <h3>Bus Details</h3>
              <div className="detail-row">
                <span className="detail-label">Bus Name:</span>
                <span className="detail-value">{booking.busName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Seats:</span>
                <span className="detail-value">{booking.seatLabels?.join(', ')}</span>
              </div>
            </div>

            <div className="ticket-section">
              <h3>Passenger Details</h3>
              {booking.passengers && booking.passengers.length > 0 ? (
                booking.passengers.map((passenger, index) => (
                  <div key={index} className="passenger-detail-card">
                    <div className="passenger-header">
                      <span className="passenger-number">Passenger {index + 1}</span>
                      <span className="seat-assignment">Seat: {passenger.seatLabel}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{passenger.name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Age:</span>
                      <span className="detail-value">{passenger.age} years</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{passenger.phone}</span>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="detail-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{booking.passengerName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Age:</span>
                    <span className="detail-value">{booking.passengerAge} years</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{booking.passengerPhone}</span>
                  </div>
                </>
              )}
            </div>

            <div className="ticket-section fare-section">
              <h3>Fare Details</h3>
              <div className="detail-row">
                <span className="detail-label">Total Fare:</span>
                <span className="detail-value fare-amount">
                  <FaRupeeSign />
                  {booking.fare}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value status-confirmed">{booking.status}</span>
              </div>
            </div>
          </div>

          <div className="confirmation-actions">
            <button className="btn btn-secondary">
              <FaDownload />
              Download Ticket
            </button>
            <Link to="/profile" className="btn btn-primary">
              View My Bookings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;

