import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { FaRupeeSign, FaBus, FaCalendarAlt, FaFilter, FaMapMarkerAlt, FaTimes } from 'react-icons/fa';
import { format } from 'date-fns';
import './Profile.css';

const Profile = () => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past'
  const [error, setError] = useState(null);

  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, [currentUser]);

  const fetchBookings = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const bookingsRef = collection(db, 'bookings');
      
      let querySnapshot;
      
      // Try with orderBy first, if it fails (index missing), try without
      try {
        const q = query(
          bookingsRef,
          where('userId', '==', currentUser.uid),
          orderBy('bookingDate', 'desc')
        );
        querySnapshot = await getDocs(q);
      } catch (indexError) {
        // If index is missing, query without orderBy
        console.warn('Index missing or error with orderBy, querying without orderBy:', indexError);
        const q = query(
          bookingsRef,
          where('userId', '==', currentUser.uid)
        );
        querySnapshot = await getDocs(q);
      }
      
      const bookingsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort manually by bookingDate (newest first)
      bookingsData.sort((a, b) => {
        const dateA = a.bookingDate ? new Date(a.bookingDate).getTime() : 0;
        const dateB = b.bookingDate ? new Date(b.bookingDate).getTime() : 0;
        return dateB - dateA; // Descending order (newest first)
      });
      
      console.log('Fetched bookings:', bookingsData.length);
      console.log('Bookings data:', bookingsData);
      console.log('Current user ID:', currentUser.uid);
      
      setBookings(bookingsData);
      setFilteredBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      setError(`Failed to load bookings: ${error.message}`);
      
      // If error mentions index, show helpful message
      if (error.message && (error.message.includes('index') || error.code === 'failed-precondition')) {
        setError('Firestore index required. Check browser console for index creation link. Trying without orderBy...');
        // Try again without orderBy
        try {
          const q = query(
            collection(db, 'bookings'),
            where('userId', '==', currentUser.uid)
          );
          const querySnapshot = await getDocs(q);
          const bookingsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          bookingsData.sort((a, b) => {
            const dateA = a.bookingDate ? new Date(a.bookingDate).getTime() : 0;
            const dateB = b.bookingDate ? new Date(b.bookingDate).getTime() : 0;
            return dateB - dateA;
          });
          setBookings(bookingsData);
          setFilteredBookings(bookingsData);
          setError(null);
        } catch (retryError) {
          console.error('Retry also failed:', retryError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filter === 'all') {
      setFilteredBookings(bookings);
    } else if (filter === 'upcoming') {
      const upcoming = bookings.filter(booking => {
        try {
          const bookingDate = booking.date?.toDate ? booking.date.toDate() : new Date(booking.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          bookingDate.setHours(0, 0, 0, 0);
          return bookingDate >= today;
        } catch {
          return true; // If date parsing fails, include it
        }
      });
      setFilteredBookings(upcoming);
    } else if (filter === 'past') {
      const past = bookings.filter(booking => {
        try {
          const bookingDate = booking.date?.toDate ? booking.date.toDate() : new Date(booking.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          bookingDate.setHours(0, 0, 0, 0);
          return bookingDate < today;
        } catch {
          return false; // If date parsing fails, exclude it
        }
      });
      setFilteredBookings(past);
    }
  }, [filter, bookings]);

  const calculateRefund = (booking) => {
    try {
      const bookingDate = booking.date?.toDate ? booking.date.toDate() : new Date(booking.date);
      const today = new Date();
      const hoursUntilDeparture = (bookingDate - today) / (1000 * 60 * 60);
      
      // Refund policy:
      // - More than 24 hours: 90% refund
      // - 12-24 hours: 50% refund
      // - Less than 12 hours: No refund
      if (hoursUntilDeparture > 24) {
        return { percentage: 90, amount: Math.floor(booking.fare * 0.9), policy: '90% refund (Cancelled 24+ hours before departure)' };
      } else if (hoursUntilDeparture > 12) {
        return { percentage: 50, amount: Math.floor(booking.fare * 0.5), policy: '50% refund (Cancelled 12-24 hours before departure)' };
      } else {
        return { percentage: 0, amount: 0, policy: 'No refund (Cancelled less than 12 hours before departure)' };
      }
    } catch {
      return { percentage: 90, amount: Math.floor(booking.fare * 0.9), policy: '90% refund' };
    }
  };

  const handleCancelBooking = async (booking) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    const refundInfo = calculateRefund(booking);
    const confirmMessage = `Refund Policy: ${refundInfo.policy}\nRefund Amount: ₹${refundInfo.amount}\n\nDo you want to proceed with cancellation?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setCancellingId(booking.id);
      const bookingRef = doc(db, 'bookings', booking.id);
      await updateDoc(bookingRef, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        refundAmount: refundInfo.amount,
        refundPolicy: refundInfo.policy
      });
      
      // Refresh bookings
      await fetchBookings();
      alert(`Booking cancelled successfully. Refund amount: ₹${refundInfo.amount}`);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <div className="user-info">
            <div className="user-avatar">
              {currentUser?.displayName?.[0] || currentUser?.email?.[0] || 'U'}
            </div>
            <div className="user-details">
              <h2>{currentUser?.displayName || 'User'}</h2>
              <p>{currentUser?.email}</p>
            </div>
          </div>
        </div>

        <div className="bookings-section">
          <div className="bookings-header">
            <h2>My Bookings</h2>
            {bookings.length > 0 && (
              <div className="bookings-filter">
                <FaFilter />
                <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                  <option value="all">All Bookings ({bookings.length})</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                </select>
              </div>
            )}
          </div>
          
          {error && (
            <div className="error" style={{ marginBottom: '20px' }}>
              {error}
              <br />
              <button onClick={fetchBookings} className="btn btn-primary" style={{ marginTop: '10px' }}>
                Retry
              </button>
            </div>
          )}
          
          {!error && bookings.length === 0 && !loading ? (
            <div className="no-bookings">
              <FaBus className="no-bookings-icon" />
              <p>You haven't made any bookings yet.</p>
              <Link to="/" className="btn btn-primary">
                Book Your First Trip
              </Link>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="no-bookings">
              <FaBus className="no-bookings-icon" />
              <p>No {filter === 'upcoming' ? 'upcoming' : 'past'} bookings found.</p>
              {filter !== 'all' && (
                <button onClick={() => setFilter('all')} className="btn btn-primary">
                  View All Bookings
                </button>
              )}
            </div>
          ) : (
            <div className="bookings-list">
              {filteredBookings.map(booking => {
                let bookingDate;
                try {
                  bookingDate = booking.date?.toDate ? booking.date.toDate() : new Date(booking.date);
                } catch {
                  bookingDate = new Date(booking.date);
                }
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                bookingDate.setHours(0, 0, 0, 0);
                const isUpcoming = bookingDate >= today;
                
                return (
                <div key={booking.id} className="booking-card">
                  <div className="booking-header">
                    <div className="booking-id">
                      <span className="id-label">Booking ID:</span>
                      <span className="id-value">{booking.id}</span>
                    </div>
                    <span className={`booking-status ${booking.status}`}>
                      {booking.status}
                    </span>
                  </div>
                  
                  {booking.status === 'cancelled' && booking.refundAmount !== undefined && (
                    <div className="refund-info">
                      <span>Refund: ₹{booking.refundAmount}</span>
                    </div>
                  )}

                  <div className="booking-route">
                    <div className="route-point">
                      <FaMapMarkerAlt className="route-icon" />
                      <div>
                        <span className="city">{booking.from}</span>
                        <span className="time">{booking.departureTime}</span>
                      </div>
                    </div>
                    <div className="route-arrow">→</div>
                    <div className="route-point">
                      <FaMapMarkerAlt className="route-icon" />
                      <div>
                        <span className="city">{booking.to}</span>
                        <span className="time">{booking.arrivalTime}</span>
                      </div>
                    </div>
                  </div>
                  
                  {isUpcoming && (
                    <div className="upcoming-badge">
                      <FaCalendarAlt />
                      <span>Upcoming Trip</span>
                    </div>
                  )}

                  <div className="booking-details-grid">
                    <div className="detail-item">
                      <FaCalendarAlt />
                      <div>
                        <span className="detail-label">Travel Date</span>
                        <span className="detail-value">
                          {(() => {
                            try {
                              const date = booking.date?.toDate ? booking.date.toDate() : new Date(booking.date);
                              return format(date, 'MMM dd, yyyy');
                            } catch {
                              return booking.date || 'N/A';
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <FaBus />
                      <div>
                        <span className="detail-label">Bus</span>
                        <span className="detail-value">{booking.busName}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Seats</span>
                      <span className="detail-value">{booking.seatLabels?.join(', ') || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Passenger{booking.passengers?.length > 1 ? 's' : ''}</span>
                      <span className="detail-value">
                        {booking.passengers && booking.passengers.length > 0
                          ? `${booking.passengers.length} passenger${booking.passengers.length > 1 ? 's' : ''}`
                          : booking.passengerName || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="booking-footer">
                    <div className="booking-fare">
                      <FaRupeeSign />
                      <span>{booking.fare}</span>
                    </div>
                    <div className="booking-actions">
                      {isUpcoming && booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleCancelBooking(booking)}
                          className="btn btn-danger"
                          disabled={cancellingId === booking.id}
                        >
                          <FaTimes />
                          {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                      <Link
                        to={`/booking-confirmation/${booking.id}`}
                        className="btn btn-secondary"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
          
          {bookings.length > 0 && (
            <div className="bookings-summary">
              <div className="summary-item">
                <span className="summary-label">Total Bookings:</span>
                <span className="summary-value">{bookings.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total Spent:</span>
                <span className="summary-value">
                  <FaRupeeSign />
                  {bookings.reduce((sum, booking) => sum + (booking.fare || 0), 0)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

