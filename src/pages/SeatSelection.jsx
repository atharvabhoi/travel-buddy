import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, getDocs, onSnapshot, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { FaRupeeSign, FaUser, FaLock, FaMars, FaVenus } from 'react-icons/fa';
import './SeatSelection.css';

const SeatSelection = () => {
  const { busId } = useParams();
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date') || '';
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [bus, setBus] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [bookedSeatsData, setBookedSeatsData] = useState({}); // { seatNumber: { gender, passengerName } }
  const [blockedSeats, setBlockedSeats] = useState({}); // { seatNumber: { userId, timestamp } }
  const [passengers, setPassengers] = useState([{ name: '', age: '', phone: '', gender: 'male' }]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const blockTimeoutRef = useRef(null);
  const seatBlockDocRef = useRef(null);
  const SEAT_BLOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  // Cleanup seat blocks - defined early so it can be used in useEffect
  const cleanupSeatBlocks = useCallback(async () => {
    if (!currentUser || !seatBlockDocRef.current) return;

    try {
      const blockRef = doc(db, 'seatBlocks', seatBlockDocRef.current);
      await deleteDoc(blockRef);
      seatBlockDocRef.current = null;
      if (blockTimeoutRef.current) {
        clearTimeout(blockTimeoutRef.current);
        blockTimeoutRef.current = null;
      }
    } catch (error) {
      console.error('Error cleaning up seat blocks:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchBusDetails();
    
    if (busId && date) {
      const cleanup = setupRealTimeListeners();
      
      // Cleanup on unmount
      return () => {
        cleanup();
        cleanupSeatBlocks();
        if (blockTimeoutRef.current) {
          clearTimeout(blockTimeoutRef.current);
        }
      };
    }
  }, [busId, date, currentUser, cleanupSeatBlocks]);

  // Cleanup seat blocks when component unmounts
  useEffect(() => {
    return () => {
      cleanupSeatBlocks();
    };
  }, [cleanupSeatBlocks]);

  const fetchBusDetails = async () => {
    try {
      const busRef = doc(db, 'buses', busId);
      const busSnap = await getDoc(busRef);
      
      if (busSnap.exists()) {
        setBus({ id: busSnap.id, ...busSnap.data() });
      }
    } catch (error) {
      console.error('Error fetching bus details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Setup real-time listeners for bookings and seat blocks
  const setupRealTimeListeners = () => {
    if (!busId || !date) {
      return () => {}; // Return empty cleanup function
    }

    // Real-time listener for bookings
    const bookingsRef = collection(db, 'bookings');
    const bookingsQuery = query(
      bookingsRef,
      where('busId', '==', busId),
      where('date', '==', date)
    );

    const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const booked = [];
      const bookedData = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.seats && Array.isArray(data.seats)) {
          booked.push(...data.seats);
          // Store passenger data for each seat
          if (data.passengers && Array.isArray(data.passengers)) {
            data.passengers.forEach((passenger, idx) => {
              if (data.seats[idx]) {
                bookedData[data.seats[idx]] = {
                  gender: passenger.gender || 'male',
                  name: passenger.name
                };
              }
            });
          }
        }
      });
      setBookedSeats(booked);
      setBookedSeatsData(bookedData);
    }, (error) => {
      console.error('Error listening to bookings:', error);
    });

    // Real-time listener for seat blocks
    const seatBlocksRef = collection(db, 'seatBlocks');
    const seatBlocksQuery = query(
      seatBlocksRef,
      where('busId', '==', busId),
      where('date', '==', date)
    );

    const unsubscribeBlocks = onSnapshot(seatBlocksQuery, (snapshot) => {
      const blocks = {};
      const now = Date.now();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        // Only show blocks that are not expired (within 5 minutes)
        const blockTime = data.timestamp?.toMillis() || Date.now();
        const timeDiff = now - blockTime;
        
        if (timeDiff < SEAT_BLOCK_TIMEOUT && data.seats && Array.isArray(data.seats)) {
          data.seats.forEach(seat => {
            blocks[seat] = {
              userId: data.userId,
              timestamp: blockTime,
              blockId: doc.id,
              expiresIn: SEAT_BLOCK_TIMEOUT - timeDiff
            };
          });
        }
      });
      setBlockedSeats(blocks);
    }, (error) => {
      console.error('Error listening to seat blocks:', error);
    });

    // Cleanup function
    return () => {
      unsubscribeBookings();
      unsubscribeBlocks();
    };
  };

  // Block selected seats in Firestore
  const blockSeats = useCallback(async (seats) => {
    if (!currentUser || seats.length === 0) return;

    try {
      // Clean up old blocks first
      await cleanupSeatBlocks();

      // Create new block document
      const blockData = {
        busId,
        date,
        userId: currentUser.uid,
        seats,
        timestamp: serverTimestamp()
      };

      const blockRef = doc(collection(db, 'seatBlocks'));
      await setDoc(blockRef, blockData);
      seatBlockDocRef.current = blockRef.id;

      // Auto-unblock after timeout
      blockTimeoutRef.current = setTimeout(() => {
        cleanupSeatBlocks();
      }, SEAT_BLOCK_TIMEOUT);

    } catch (error) {
      console.error('Error blocking seats:', error);
    }
  }, [busId, date, currentUser, cleanupSeatBlocks]);


  // Sleeper bus configuration: 2 decks, 6 rows, 3 columns each = 36 seats total
  const isSleeper = bus?.type === 'sleeper';
  const totalSeats = isSleeper ? 36 : 40;
  const seatsPerRow = isSleeper ? 3 : 4;
  const rows = isSleeper ? 6 : Math.ceil(totalSeats / seatsPerRow);
  const decks = isSleeper ? 2 : 1;

  // Seat pricing for sleeper buses (different prices for different seats)
  const getSeatPrice = (seatNumber, deck = null) => {
    if (!isSleeper) return bus?.fare || 0;
    
    // Determine deck if not provided
    if (deck === null) {
      deck = seatNumber <= 18 ? 1 : 2;
    }
    
    // Calculate row within the deck (1-6)
    const seatInDeck = deck === 1 ? seatNumber : seatNumber - 18;
    const row = Math.floor((seatInDeck - 1) / seatsPerRow) + 1;
    
    // Lower deck: rows 5-6 are premium (₹799), others standard (₹649)
    // Upper deck: row 1 and row 5 are premium (₹799), others standard (₹649)
    if (deck === 1) { // Lower deck
      return (row >= 5) ? 799 : 649;
    } else { // Upper deck
      return (row === 1 || row === 5) ? 799 : 649;
    }
  };

  const getSeatLabel = (seatNumber, deck = null) => {
    if (isSleeper) {
      // Determine deck if not provided
      if (deck === null) {
        deck = seatNumber <= 18 ? 1 : 2;
      }
      // Calculate row within the deck (1-6)
      const seatInDeck = deck === 1 ? seatNumber : seatNumber - 18;
      const row = Math.floor((seatInDeck - 1) / seatsPerRow) + 1;
      const col = ((seatInDeck - 1) % seatsPerRow) + 1;
      const deckLabel = deck === 1 ? 'L' : 'U';
      return `${deckLabel}${row}${col}`;
    } else {
      const row = Math.floor((seatNumber - 1) / seatsPerRow);
      const col = (seatNumber - 1) % seatsPerRow;
      return `${String.fromCharCode(65 + row)}${col + 1}`;
    }
  };

  const toggleSeat = useCallback(async (seatNumber) => {
    // Check if seat is booked
    if (bookedSeats.includes(seatNumber)) {
      alert('This seat is already booked');
      return;
    }

    // Check if seat is blocked by another user
    const seatBlock = blockedSeats[seatNumber];
    if (seatBlock && seatBlock.userId !== currentUser?.uid) {
      alert('This seat is currently being booked by another user. Please try again in a moment.');
      return;
    }
    
    let newSelectedSeats;
    if (selectedSeats.includes(seatNumber)) {
      // Deselect seat
      newSelectedSeats = selectedSeats.filter(s => s !== seatNumber);
      setSelectedSeats(newSelectedSeats);
      // Remove corresponding passenger if seat is deselected
      const seatIndex = selectedSeats.indexOf(seatNumber);
      if (seatIndex !== -1 && passengers.length > seatIndex + 1) {
        setPassengers(passengers.filter((_, idx) => idx !== seatIndex));
      }
    } else {
      // Select seat
      if (selectedSeats.length < 5) {
        newSelectedSeats = [...selectedSeats, seatNumber];
        setSelectedSeats(newSelectedSeats);
        // Add passenger form for new seat
        if (passengers.length <= selectedSeats.length) {
          setPassengers([...passengers, { name: '', age: '', phone: '', gender: 'male' }]);
        }
      } else {
        alert('You can select maximum 5 seats at a time');
        return;
      }
    }

    // Update seat blocks in real-time
    if (newSelectedSeats.length > 0) {
      await blockSeats(newSelectedSeats);
    } else {
      await cleanupSeatBlocks();
    }
  }, [bookedSeats, blockedSeats, currentUser, selectedSeats, passengers, blockSeats, cleanupSeatBlocks]);

  const updatePassenger = (index, field, value) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const handleBooking = async () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }

    // Validate all passengers
    const requiredPassengers = passengers.slice(0, selectedSeats.length);
    const invalidPassengers = requiredPassengers.filter(
      p => !p.name || !p.age || !p.phone
    );

    if (invalidPassengers.length > 0) {
      alert(`Please fill in all details for ${invalidPassengers.length} passenger(s)`);
      return;
    }

    try {
      setBooking(true);
      
      // Create booking with multiple passengers
      const bookingData = {
        userId: currentUser.uid,
        busId: busId,
        busName: bus.name,
        from: bus.from,
        to: bus.to,
        date: date,
        seats: selectedSeats,
        seatLabels: selectedSeats.map(getSeatLabel),
        passengers: requiredPassengers.map((p, idx) => {
          const seatNum = selectedSeats[idx];
          const deck = isSleeper ? (seatNum <= 18 ? 1 : 2) : 1;
          return {
            name: p.name,
            age: parseInt(p.age),
            phone: p.phone,
            gender: p.gender || 'male',
            seatNumber: seatNum,
            seatLabel: getSeatLabel(seatNum, deck),
            seatPrice: getSeatPrice(seatNum, deck)
          };
        }),
        // Keep backward compatibility
        passengerName: requiredPassengers[0].name,
        passengerAge: parseInt(requiredPassengers[0].age),
        passengerPhone: requiredPassengers[0].phone,
        fare: selectedSeats.reduce((total, seatNum) => {
          const deck = isSleeper ? (seatNum <= 18 ? 1 : 2) : 1;
          return total + getSeatPrice(seatNum, deck);
        }, 0),
        status: 'confirmed',
        bookingDate: new Date().toISOString(),
        departureTime: bus.departureTime,
        arrivalTime: bus.arrivalTime
      };

      // Clean up seat blocks before booking
      await cleanupSeatBlocks();

      const docRef = await addDoc(collection(db, 'bookings'), bookingData);
      navigate(`/booking-confirmation/${docRef.id}`);
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading seat map...</p>
      </div>
    );
  }

  if (!bus) {
    return <div className="error">Bus not found</div>;
  }

  // Calculate total fare based on individual seat prices
  const totalFare = selectedSeats.reduce((total, seatNum) => {
    if (isSleeper) {
      const deck = seatNum <= 18 ? 1 : 2;
      return total + getSeatPrice(seatNum, deck);
    }
    return total + (bus?.fare || 0);
  }, 0);

  return (
    <div className="seat-selection-page">
      <div className="container">
        <div className="seat-selection-content">
          <div className="seat-map-section">
            <h2>Select Your Seats</h2>
            <div className="bus-layout">
              {isSleeper ? (
                // Sleeper Bus Layout: Two Decks
                <div className="sleeper-layout">
                  {/* Lower Deck */}
                  <div className="deck-section">
                    <div className="deck-header">
                      <h3>Lower deck</h3>
                      <div className="steering-icon">🚗</div>
                    </div>
                    <div className="seats-grid">
                      {Array.from({ length: rows }, (_, rowIndex) => (
                        <div key={`lower-${rowIndex}`} className="seat-row">
                          <div className="row-label">{rowIndex + 1}</div>
                          <div className="seats-in-row">
                            {Array.from({ length: seatsPerRow }, (_, colIndex) => {
                              const seatNumber = rowIndex * seatsPerRow + colIndex + 1;
                              const isSelected = selectedSeats.includes(seatNumber);
                              const isBooked = bookedSeats.includes(seatNumber);
                              const seatBlock = blockedSeats[seatNumber];
                              const isBlocked = seatBlock && seatBlock.userId !== currentUser?.uid;
                              const isMyBlock = seatBlock && seatBlock.userId === currentUser?.uid;
                              const seatLabel = getSeatLabel(seatNumber, 1);
                              const seatPrice = getSeatPrice(seatNumber, 1);
                              const bookedData = bookedSeatsData[seatNumber];
                              
                              return (
                                <button
                                  key={seatNumber}
                                  className={`sleeper-seat ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''} ${isBlocked ? 'blocked' : ''} ${isMyBlock ? 'my-block' : ''} ${bookedData?.gender === 'female' ? 'female-booked' : bookedData?.gender === 'male' ? 'male-booked' : ''}`}
                                  onClick={() => toggleSeat(seatNumber)}
                                  disabled={isBooked || isBlocked}
                                  title={isBlocked ? 'Seat is being booked by another user' : isBooked ? 'Seat is already booked' : `₹${seatPrice}`}
                                >
                                  {isBlocked && <FaLock className="block-icon" />}
                                  {isBooked && bookedData && (
                                    bookedData.gender === 'female' ? <FaVenus className="gender-icon" /> : <FaMars className="gender-icon" />
                                  )}
                                  {!isBooked && !isBlocked && (
                                    <span className="seat-price"><FaRupeeSign />{seatPrice}</span>
                                  )}
                                  {isBooked && <span className="sold-label">Sold</span>}
                                  <span className="seat-number">{seatLabel}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Upper Deck */}
                  <div className="deck-section">
                    <div className="deck-header">
                      <h3>Upper deck</h3>
                    </div>
                    <div className="seats-grid">
                      {Array.from({ length: rows }, (_, rowIndex) => (
                        <div key={`upper-${rowIndex}`} className="seat-row">
                          <div className="row-label">{rowIndex + 1}</div>
                          <div className="seats-in-row">
                            {Array.from({ length: seatsPerRow }, (_, colIndex) => {
                              const seatNumber = 18 + rowIndex * seatsPerRow + colIndex + 1; // Upper deck starts at seat 19
                              const isSelected = selectedSeats.includes(seatNumber);
                              const isBooked = bookedSeats.includes(seatNumber);
                              const seatBlock = blockedSeats[seatNumber];
                              const isBlocked = seatBlock && seatBlock.userId !== currentUser?.uid;
                              const isMyBlock = seatBlock && seatBlock.userId === currentUser?.uid;
                              const seatLabel = getSeatLabel(seatNumber, 2);
                              const seatPrice = getSeatPrice(seatNumber, 2);
                              const bookedData = bookedSeatsData[seatNumber];
                              
                              return (
                                <button
                                  key={seatNumber}
                                  className={`sleeper-seat ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''} ${isBlocked ? 'blocked' : ''} ${isMyBlock ? 'my-block' : ''} ${bookedData?.gender === 'female' ? 'female-booked' : bookedData?.gender === 'male' ? 'male-booked' : ''}`}
                                  onClick={() => toggleSeat(seatNumber)}
                                  disabled={isBooked || isBlocked}
                                  title={isBlocked ? 'Seat is being booked by another user' : isBooked ? 'Seat is already booked' : `₹${seatPrice}`}
                                >
                                  {isBlocked && <FaLock className="block-icon" />}
                                  {isBooked && bookedData && (
                                    bookedData.gender === 'female' ? <FaVenus className="gender-icon" /> : <FaMars className="gender-icon" />
                                  )}
                                  {!isBooked && !isBlocked && (
                                    <span className="seat-price"><FaRupeeSign />{seatPrice}</span>
                                  )}
                                  {isBooked && <span className="sold-label">Sold</span>}
                                  <span className="seat-number">{seatLabel}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // Regular Seater Bus Layout
                <>
                  <div className="driver-section">
                    <div className="driver-icon">🚌</div>
                    <span>Driver</span>
                  </div>
                  
                  <div className="seats-grid">
                    {Array.from({ length: rows }, (_, rowIndex) => (
                      <div key={rowIndex} className="seat-row">
                        <div className="row-label">{String.fromCharCode(65 + rowIndex)}</div>
                        <div className="seats-in-row">
                          {Array.from({ length: seatsPerRow }, (_, colIndex) => {
                            const seatNumber = rowIndex * seatsPerRow + colIndex + 1;
                            const isSelected = selectedSeats.includes(seatNumber);
                            const isBooked = bookedSeats.includes(seatNumber);
                            const seatBlock = blockedSeats[seatNumber];
                            const isBlocked = seatBlock && seatBlock.userId !== currentUser?.uid;
                            const isMyBlock = seatBlock && seatBlock.userId === currentUser?.uid;
                            const seatLabel = getSeatLabel(seatNumber);
                            
                            return (
                              <button
                                key={seatNumber}
                                className={`seat ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''} ${isBlocked ? 'blocked' : ''} ${isMyBlock ? 'my-block' : ''}`}
                                onClick={() => toggleSeat(seatNumber)}
                                disabled={isBooked || isBlocked}
                                title={isBlocked ? 'Seat is being booked by another user' : isBooked ? 'Seat is already booked' : ''}
                              >
                                {isBlocked && <FaLock className="block-icon" />}
                                {seatLabel}
                              </button>
                            );
                          })}
                          {rowIndex === Math.floor(rows / 2) && (
                            <div className="aisle"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="seat-legend">
              <div className="legend-item">
                <div className="seat available"></div>
                <span>Available</span>
              </div>
              <div className="legend-item">
                <div className="seat selected"></div>
                <span>Selected</span>
              </div>
              <div className="legend-item">
                <div className="seat blocked"></div>
                <span>Blocked (by others)</span>
              </div>
              <div className="legend-item">
                <div className="seat booked"></div>
                <span>Booked</span>
              </div>
            </div>
            <div className="real-time-indicator">
              <span className="live-dot"></span>
              <span>Live seat availability updates</span>
            </div>
          </div>

          <div className="booking-details-section">
            <div className="booking-card">
              <h3>Booking Details</h3>
              
              <div className="route-summary">
                <div className="route-point">
                  <span className="time">{bus.departureTime}</span>
                  <span className="city">{bus.from}</span>
                </div>
                <div className="route-divider">→</div>
                <div className="route-point">
                  <span className="time">{bus.arrivalTime}</span>
                  <span className="city">{bus.to}</span>
                </div>
              </div>

              <div className="bus-info-summary">
                <p><strong>{bus.name}</strong></p>
                <p>{bus.type} • {bus.operator}</p>
              </div>

              <div className="passenger-form">
                <h4>Passenger Details ({selectedSeats.length} {selectedSeats.length === 1 ? 'Passenger' : 'Passengers'})</h4>
                {selectedSeats.length > 0 ? (
                  selectedSeats.map((seat, index) => (
                    <div key={index} className="passenger-card">
                      <div className="passenger-header">
                        <span className="passenger-number">Passenger {index + 1}</span>
                        <span className="seat-assignment">
                          Seat: {isSleeper ? getSeatLabel(seat, seat <= 18 ? 1 : 2) : getSeatLabel(seat)}
                          {isSleeper && (
                            <span className="seat-price-badge">
                              <FaRupeeSign />{getSeatPrice(seat, seat <= 18 ? 1 : 2)}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="input-group">
                        <label>Name</label>
                        <input
                          type="text"
                          value={passengers[index]?.name || ''}
                          onChange={(e) => updatePassenger(index, 'name', e.target.value)}
                          placeholder="Enter passenger name"
                          required
                        />
                      </div>
                      <div className="input-group">
                        <label>Age</label>
                        <input
                          type="number"
                          value={passengers[index]?.age || ''}
                          onChange={(e) => updatePassenger(index, 'age', e.target.value)}
                          placeholder="Enter age"
                          min="1"
                          max="120"
                          required
                        />
                      </div>
                      <div className="input-group">
                        <label>Phone</label>
                        <input
                          type="tel"
                          value={passengers[index]?.phone || ''}
                          onChange={(e) => updatePassenger(index, 'phone', e.target.value)}
                          placeholder="Enter phone number"
                          required
                        />
                      </div>
                      {isSleeper && (
                        <div className="input-group">
                          <label>Gender</label>
                          <div className="gender-select">
                            <button
                              type="button"
                              className={`gender-btn ${passengers[index]?.gender === 'male' ? 'active' : ''}`}
                              onClick={() => updatePassenger(index, 'gender', 'male')}
                            >
                              <FaMars /> Male
                            </button>
                            <button
                              type="button"
                              className={`gender-btn ${passengers[index]?.gender === 'female' ? 'active' : ''}`}
                              onClick={() => updatePassenger(index, 'gender', 'female')}
                            >
                              <FaVenus /> Female
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="no-seats-message">Please select seats to add passenger details</p>
                )}
              </div>

              <div className="fare-summary">
                <div className="fare-row">
                  <span>Seats Selected:</span>
                  <span>{selectedSeats.length}</span>
                </div>
                <div className="fare-row">
                  <span>Seat Numbers:</span>
                  <span>
                    {selectedSeats.map(seat => 
                      isSleeper ? getSeatLabel(seat, seat <= 18 ? 1 : 2) : getSeatLabel(seat)
                    ).join(', ') || 'None'}
                  </span>
                </div>
                {isSleeper && selectedSeats.length > 0 && (
                  <div className="fare-row">
                    <span>Seat Prices:</span>
                    <span>
                      {selectedSeats.map(seat => {
                        const deck = seat <= 18 ? 1 : 2;
                        return `₹${getSeatPrice(seat, deck)}`;
                      }).join(', ')}
                    </span>
                  </div>
                )}
                <div className="fare-row total">
                  <span>Total Fare:</span>
                  <span className="fare-amount">
                    <FaRupeeSign />
                    {totalFare}
                  </span>
                </div>
              </div>

              <button
                onClick={handleBooking}
                className="btn btn-primary btn-large"
                disabled={booking || selectedSeats.length === 0}
              >
                {booking ? 'Processing...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;


