import { useState, useEffect } from 'react';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { FaBus, FaUsers, FaPlus, FaEdit, FaTrash, FaRupeeSign, FaSearch, FaTimes, FaRoute } from 'react-icons/fa';
import { INDIAN_CITIES } from '../utils/constants';
import './AdminPanel.css';
import '../styles/AdminAccessDenied.css';

const AdminPanel = () => {
  const { currentUser, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('buses');
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBusForm, setShowBusForm] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [searchRoute, setSearchRoute] = useState({ from: '', to: '' });
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [routeSearchFilter, setRouteSearchFilter] = useState({ from: '', to: '' });
  
  // Bus form state
  const [busForm, setBusForm] = useState({
    name: '',
    operator: '',
    from: '',
    to: '',
    type: 'sleeper',
    fare: '',
    departureTime: '',
    arrivalTime: '',
    duration: '',
    rating: 4.0,
    reviews: 0,
    availableSeats: 40,
    amenities: [],
    busPhotos: [],
    interiorPhotos: []
  });

  // Route form state (for adding new route with bus)
  const [routeForm, setRouteForm] = useState({
    from: '',
    to: '',
    name: '',
    operator: '',
    type: 'sleeper',
    fare: '',
    departureTime: '',
    arrivalTime: '',
    duration: '',
    rating: 4.0,
    reviews: 0,
    availableSeats: 40,
    amenities: [],
    busPhotos: [],
    interiorPhotos: []
  });

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'buses') {
        const busesRef = collection(db, 'buses');
        const q = query(busesRef, orderBy('name'));
        const snapshot = await getDocs(q);
        const busesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBuses(busesData);
        setFilteredBuses(busesData);
      } else if (activeTab === 'users') {
        // Note: Firebase Auth users need to be fetched via Admin SDK
        // For now, we'll show users from bookings
        const bookingsRef = collection(db, 'bookings');
        const snapshot = await getDocs(bookingsRef);
        const userIds = new Set();
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.userId) userIds.add(data.userId);
        });
        setUsers(Array.from(userIds).map(uid => ({ id: uid })));
      } else if (activeTab === 'bookings') {
        const bookingsRef = collection(db, 'bookings');
        const q = query(bookingsRef, orderBy('bookingDate', 'desc'));
        const snapshot = await getDocs(q);
        setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else if (activeTab === 'routes') {
        const busesRef = collection(db, 'buses');
        const snapshot = await getDocs(busesRef);
        const busesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Group buses by route
        const routesMap = new Map();
        busesData.forEach(bus => {
          const routeKey = `${bus.from} → ${bus.to}`;
          if (!routesMap.has(routeKey)) {
            routesMap.set(routeKey, {
              from: bus.from,
              to: bus.to,
              buses: []
            });
          }
          routesMap.get(routeKey).buses.push(bus);
        });
        
        // Convert to array and sort
        const routesArray = Array.from(routesMap.values()).sort((a, b) => {
          if (a.from !== b.from) return a.from.localeCompare(b.from);
          return a.to.localeCompare(b.to);
        });
        
        setRoutes(routesArray);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBusSubmit = async (e) => {
    e.preventDefault();
    try {
      const busData = {
        ...busForm,
        fare: parseInt(busForm.fare),
        rating: parseFloat(busForm.rating),
        reviews: parseInt(busForm.reviews),
        availableSeats: parseInt(busForm.availableSeats),
        busPhotos: Array.isArray(busForm.busPhotos) ? busForm.busPhotos : [],
        interiorPhotos: Array.isArray(busForm.interiorPhotos) ? busForm.interiorPhotos : []
      };

      if (editingBus) {
        await updateDoc(doc(db, 'buses', editingBus.id), busData);
        alert('Bus updated successfully!');
      } else {
        await addDoc(collection(db, 'buses'), busData);
        alert('Bus added successfully!');
      }
      
      setShowBusForm(false);
      setEditingBus(null);
      setBusForm({
        name: '',
        operator: '',
        from: '',
        to: '',
        type: 'sleeper',
        fare: '',
        departureTime: '',
        arrivalTime: '',
        duration: '',
        rating: 4.0,
        reviews: 0,
        availableSeats: 40,
        amenities: [],
        busPhotos: [],
        interiorPhotos: []
      });
      await fetchData();
    } catch (error) {
      console.error('Error saving bus:', error);
      alert('Failed to save bus. Please try again.');
    }
  };

  const handleEditBus = (bus) => {
    setEditingBus(bus);
    setBusForm({
      name: bus.name || '',
      operator: bus.operator || '',
      from: bus.from || '',
      to: bus.to || '',
      type: bus.type || 'sleeper',
      fare: bus.fare || '',
      departureTime: bus.departureTime || '',
      arrivalTime: bus.arrivalTime || '',
      duration: bus.duration || '',
      rating: bus.rating || 4.0,
      reviews: bus.reviews || 0,
      availableSeats: bus.availableSeats || 40,
      amenities: bus.amenities || [],
      busPhotos: bus.busPhotos || [],
      interiorPhotos: bus.interiorPhotos || []
    });
    setShowBusForm(true);
  };

  const handleRouteSubmit = async (e) => {
    e.preventDefault();
    try {
      const busData = {
        name: routeForm.name,
        operator: routeForm.operator,
        from: routeForm.from,
        to: routeForm.to,
        type: routeForm.type,
        fare: parseInt(routeForm.fare),
        departureTime: routeForm.departureTime,
        arrivalTime: routeForm.arrivalTime,
        duration: routeForm.duration,
        rating: parseFloat(routeForm.rating),
        reviews: parseInt(routeForm.reviews),
        availableSeats: parseInt(routeForm.availableSeats),
        amenities: routeForm.amenities || [],
        busPhotos: Array.isArray(routeForm.busPhotos) ? routeForm.busPhotos : [],
        interiorPhotos: Array.isArray(routeForm.interiorPhotos) ? routeForm.interiorPhotos : []
      };

      await addDoc(collection(db, 'buses'), busData);
      alert(`Route ${routeForm.from} → ${routeForm.to} with bus added successfully!`);
      
      setShowRouteForm(false);
      setRouteForm({
        from: '',
        to: '',
        name: '',
        operator: '',
        type: 'sleeper',
        fare: '',
        departureTime: '',
        arrivalTime: '',
        duration: '',
        rating: 4.0,
        reviews: 0,
        availableSeats: 40,
        amenities: [],
        busPhotos: [],
        interiorPhotos: []
      });
      await fetchData();
    } catch (error) {
      console.error('Error adding route:', error);
      alert('Failed to add route. Please try again.');
    }
  };

  const handleDeleteBus = async (busId) => {
    if (!busId) {
      console.error('Bus ID is missing');
      alert('Error: Bus ID is missing. Cannot delete bus.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this bus? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('Attempting to delete bus with ID:', busId);
      const busRef = doc(db, 'buses', busId);
      await deleteDoc(busRef);
      console.log('Bus deleted successfully from Firestore');
      
      // Update both buses and filteredBuses
      setBuses(prevBuses => {
        const updated = prevBuses.filter(bus => bus.id !== busId);
        console.log('Updated buses list, remaining:', updated.length);
        return updated;
      });
      setFilteredBuses(prevBuses => {
        const updated = prevBuses.filter(bus => bus.id !== busId);
        console.log('Updated filtered buses list, remaining:', updated.length);
        return updated;
      });
      
      alert('Bus deleted successfully!');
      
      // Refresh data to ensure consistency
      await fetchData();
    } catch (error) {
      console.error('Error deleting bus:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Failed to delete bus. ';
      if (error.code === 'permission-denied') {
        errorMessage += 'You do not have permission to delete buses. Please check Firestore security rules.';
      } else if (error.code === 'not-found') {
        errorMessage += 'Bus not found in database.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }
      
      alert(errorMessage);
    }
  };

  const clearSearch = () => {
    setSearchRoute({ from: '', to: '' });
  };

  useEffect(() => {
    if (!searchRoute.from && !searchRoute.to) {
      setFilteredBuses(buses);
      return;
    }

    const filtered = buses.filter(bus => {
      const fromMatch = !searchRoute.from || 
        bus.from.toLowerCase().includes(searchRoute.from.toLowerCase());
      const toMatch = !searchRoute.to || 
        bus.to.toLowerCase().includes(searchRoute.to.toLowerCase());
      return fromMatch && toMatch;
    });

    setFilteredBuses(filtered);
  }, [searchRoute.from, searchRoute.to, buses]);

  // Double check admin status (in case route protection fails)
  if (!isAdmin) {
    return (
      <div className="admin-access-denied">
        <div className="container">
          <div className="access-denied-card">
            <h2>Access Denied</h2>
            <p>You do not have permission to access the admin panel.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="container">
        <div className="admin-header">
          <h1>Admin Panel</h1>
          <p>Manage buses, users, and bookings</p>
        </div>

        <div className="admin-tabs">
          <button
            className={`tab-btn ${activeTab === 'buses' ? 'active' : ''}`}
            onClick={() => setActiveTab('buses')}
          >
            <FaBus />
            Buses ({buses.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FaUsers />
            Users ({users.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            Bookings ({bookings.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'routes' ? 'active' : ''}`}
            onClick={() => setActiveTab('routes')}
          >
            <FaRoute />
            Routes
          </button>
        </div>

        <div className="admin-content">
          {activeTab === 'buses' && (
            <div className="buses-management">
              <div className="section-header">
                <h2>Bus Management</h2>
                <button
                  onClick={() => {
                    setShowBusForm(true);
                    setEditingBus(null);
                    setBusForm({
                      name: '',
                      operator: '',
                      from: '',
                      to: '',
                      type: 'sleeper',
                      fare: '',
                      departureTime: '',
                      arrivalTime: '',
                      duration: '',
                      rating: 4.0,
                      reviews: 0,
                      availableSeats: 40,
                      amenities: [],
                      busPhotos: [],
                      interiorPhotos: []
                    });
                  }}
                  className="btn btn-primary"
                >
                  <FaPlus />
                  Add New Bus
                </button>
              </div>

              {/* Search Route Section */}
              <div className="search-route-section">
                <div className="search-route-header">
                  <FaSearch />
                  <h3>Search Buses by Route</h3>
                </div>
                <div className="search-route-inputs">
                  <div className="input-group">
                    <label>From City</label>
                    <input
                      type="text"
                      placeholder="Enter source city..."
                      value={searchRoute.from}
                      onChange={(e) => setSearchRoute({ ...searchRoute, from: e.target.value })}
                      list="from-cities"
                    />
                    <datalist id="from-cities">
                      {INDIAN_CITIES.map(city => (
                        <option key={city} value={city} />
                      ))}
                    </datalist>
                  </div>
                  <div className="input-group">
                    <label>To City</label>
                    <input
                      type="text"
                      placeholder="Enter destination city..."
                      value={searchRoute.to}
                      onChange={(e) => setSearchRoute({ ...searchRoute, to: e.target.value })}
                      list="to-cities"
                    />
                    <datalist id="to-cities">
                      {INDIAN_CITIES.map(city => (
                        <option key={city} value={city} />
                      ))}
                    </datalist>
                  </div>
                  {(searchRoute.from || searchRoute.to) && (
                    <button
                      onClick={clearSearch}
                      className="btn btn-secondary clear-search-btn"
                      title="Clear search"
                    >
                      <FaTimes />
                      Clear
                    </button>
                  )}
                </div>
                {filteredBuses.length !== buses.length && (
                  <div className="search-results-info">
                    Showing {filteredBuses.length} of {buses.length} buses
                  </div>
                )}
              </div>

              {showBusForm && (
                <div className="bus-form-modal">
                  <div className="modal-content">
                    <h3>{editingBus ? 'Edit Bus' : 'Add New Bus'}</h3>
                    <form onSubmit={handleBusSubmit}>
                      <div className="form-grid">
                        <div className="input-group">
                          <label>Bus Name</label>
                          <input
                            type="text"
                            value={busForm.name}
                            onChange={(e) => setBusForm({ ...busForm, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="input-group">
                          <label>Operator</label>
                          <input
                            type="text"
                            value={busForm.operator}
                            onChange={(e) => setBusForm({ ...busForm, operator: e.target.value })}
                            required
                          />
                        </div>
                        <div className="input-group">
                          <label>From</label>
                          <select
                            value={busForm.from}
                            onChange={(e) => setBusForm({ ...busForm, from: e.target.value })}
                            required
                          >
                            <option value="">Select City</option>
                            {INDIAN_CITIES.map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>
                        <div className="input-group">
                          <label>To</label>
                          <select
                            value={busForm.to}
                            onChange={(e) => setBusForm({ ...busForm, to: e.target.value })}
                            required
                          >
                            <option value="">Select City</option>
                            {INDIAN_CITIES.map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>
                        <div className="input-group">
                          <label>Bus Type</label>
                          <select
                            value={busForm.type}
                            onChange={(e) => setBusForm({ ...busForm, type: e.target.value })}
                            required
                          >
                            <option value="sleeper">Sleeper</option>
                            <option value="semi-sleeper">Semi Sleeper</option>
                            <option value="seater">Seater</option>
                          </select>
                        </div>
                        <div className="input-group">
                          <label>Fare (₹)</label>
                          <input
                            type="number"
                            value={busForm.fare}
                            onChange={(e) => setBusForm({ ...busForm, fare: e.target.value })}
                            required
                            min="0"
                          />
                        </div>
                        <div className="input-group">
                          <label>Departure Time</label>
                          <input
                            type="time"
                            value={busForm.departureTime}
                            onChange={(e) => setBusForm({ ...busForm, departureTime: e.target.value })}
                            required
                          />
                        </div>
                        <div className="input-group">
                          <label>Arrival Time</label>
                          <input
                            type="time"
                            value={busForm.arrivalTime}
                            onChange={(e) => setBusForm({ ...busForm, arrivalTime: e.target.value })}
                            required
                          />
                        </div>
                        <div className="input-group">
                          <label>Duration</label>
                          <input
                            type="text"
                            value={busForm.duration}
                            onChange={(e) => setBusForm({ ...busForm, duration: e.target.value })}
                            placeholder="e.g., 6h 30m"
                            required
                          />
                        </div>
                        <div className="input-group">
                          <label>Rating</label>
                          <input
                            type="number"
                            value={busForm.rating}
                            onChange={(e) => setBusForm({ ...busForm, rating: e.target.value })}
                            min="0"
                            max="5"
                            step="0.1"
                            required
                          />
                        </div>
                        <div className="input-group">
                          <label>Available Seats</label>
                          <input
                            type="number"
                            value={busForm.availableSeats}
                            onChange={(e) => setBusForm({ ...busForm, availableSeats: e.target.value })}
                            min="1"
                            max="50"
                            required
                          />
                        </div>
                        <div className="input-group full-width">
                          <label>Bus Photos (URLs - one per line)</label>
                          <textarea
                            value={Array.isArray(busForm.busPhotos) ? busForm.busPhotos.join('\n') : ''}
                            onChange={(e) => {
                              const urls = e.target.value.split('\n').filter(url => url.trim() !== '');
                              setBusForm({ ...busForm, busPhotos: urls });
                            }}
                            placeholder="Enter photo URLs, one per line:&#10;https://example.com/bus1.jpg&#10;https://example.com/bus2.jpg"
                            rows="3"
                            style={{ fontFamily: 'monospace', fontSize: '12px' }}
                          />
                          <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                            Add multiple bus exterior photos (one URL per line)
                          </small>
                        </div>
                        <div className="input-group full-width">
                          <label>Interior Photos (URLs - one per line)</label>
                          <textarea
                            value={Array.isArray(busForm.interiorPhotos) ? busForm.interiorPhotos.join('\n') : ''}
                            onChange={(e) => {
                              const urls = e.target.value.split('\n').filter(url => url.trim() !== '');
                              setBusForm({ ...busForm, interiorPhotos: urls });
                            }}
                            placeholder="Enter photo URLs, one per line:&#10;https://example.com/interior1.jpg&#10;https://example.com/interior2.jpg"
                            rows="3"
                            style={{ fontFamily: 'monospace', fontSize: '12px' }}
                          />
                          <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                            Add multiple interior photos (one URL per line)
                          </small>
                        </div>
                      </div>
                      <div className="form-actions">
                        <button type="submit" className="btn btn-primary">
                          {editingBus ? 'Update Bus' : 'Add Bus'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowBusForm(false);
                            setEditingBus(null);
                          }}
                          className="btn btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="buses-list">
                {filteredBuses.length === 0 ? (
                  <div className="no-results">
                    <p>No buses found matching your search criteria.</p>
                    {(searchRoute.from || searchRoute.to) && (
                      <button onClick={clearSearch} className="btn btn-primary">
                        Clear Search
                      </button>
                    )}
                  </div>
                ) : (
                  filteredBuses.map(bus => (
                    <div key={bus.id} className="bus-card">
                      <div className="bus-card-header">
                        <div>
                          <h3>{bus.name}</h3>
                          <p>{bus.operator}</p>
                        </div>
                        <div className="bus-actions">
                          <button
                            onClick={() => handleEditBus(bus)}
                            className="btn-icon"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteBus(bus.id)}
                            className="btn-icon btn-danger"
                            title="Delete"
                            type="button"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    <div className="bus-card-details">
                      <div className="detail-row">
                        <span>Route:</span>
                        <span>{bus.from} → {bus.to}</span>
                      </div>
                      <div className="detail-row">
                        <span>Type:</span>
                        <span>{bus.type}</span>
                      </div>
                      <div className="detail-row">
                        <span>Fare:</span>
                        <span><FaRupeeSign />{bus.fare}</span>
                      </div>
                      <div className="detail-row">
                        <span>Timing:</span>
                        <span>{bus.departureTime} - {bus.arrivalTime}</span>
                      </div>
                      <div className="detail-row">
                        <span>Seats:</span>
                        <span>{bus.availableSeats} available</span>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="users-management">
              <h2>User Management</h2>
              <p className="info-text">
                Note: Full user details require Firebase Admin SDK. Currently showing user IDs from bookings.
              </p>
              <div className="users-list">
                {users.map(user => (
                  <div key={user.id} className="user-card">
                    <div className="user-id">
                      <strong>User ID:</strong> {user.id}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="bookings-management">
              <h2>All Bookings</h2>
              <div className="bookings-list">
                {bookings.map(booking => (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-header">
                      <div>
                        <strong>Booking ID:</strong> {booking.id}
                      </div>
                      <span className={`status-badge ${booking.status}`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="booking-details">
                      <p><strong>Route:</strong> {booking.from} → {booking.to}</p>
                      <p><strong>Date:</strong> {booking.date}</p>
                      <p><strong>Passenger:</strong> {booking.passengerName || (booking.passengers?.[0]?.name || 'N/A')}</p>
                      <p><strong>Seats:</strong> {booking.seatLabels?.join(', ') || 'N/A'}</p>
                      <p><strong>Fare:</strong> <FaRupeeSign />{booking.fare}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'routes' && (
            <div className="routes-management">
              <div className="section-header">
                <h2>Route Management</h2>
                <button
                  onClick={() => {
                    setShowRouteForm(true);
                    setRouteForm({
                      from: '',
                      to: '',
                      name: '',
                      operator: '',
                      type: 'sleeper',
                      fare: '',
                      departureTime: '',
                      arrivalTime: '',
                      duration: '',
                      rating: 4.0,
                      reviews: 0,
                      availableSeats: 40,
                      amenities: [],
                      busPhotos: [],
                      interiorPhotos: []
                    });
                  }}
                  className="btn btn-primary"
                >
                  <FaPlus />
                  Add New Route
                </button>
              </div>

              {/* View Existing Routes */}
              <div className="routes-view-section">
                <div className="section-header">
                  <h3>Existing Routes & Buses</h3>
                  <div className="route-search-filters">
                    <input
                      type="text"
                      placeholder="Filter by From city..."
                      value={routeSearchFilter.from}
                      onChange={(e) => setRouteSearchFilter({ ...routeSearchFilter, from: e.target.value })}
                      className="route-filter-input"
                    />
                    <input
                      type="text"
                      placeholder="Filter by To city..."
                      value={routeSearchFilter.to}
                      onChange={(e) => setRouteSearchFilter({ ...routeSearchFilter, to: e.target.value })}
                      className="route-filter-input"
                    />
                    {(routeSearchFilter.from || routeSearchFilter.to) && (
                      <button
                        onClick={() => setRouteSearchFilter({ from: '', to: '' })}
                        className="btn btn-secondary"
                        style={{ padding: '8px 16px' }}
                      >
                        <FaTimes /> Clear
                      </button>
                    )}
                  </div>
                </div>

                {loading ? (
                  <div className="loading">Loading routes...</div>
                ) : routes.length === 0 ? (
                  <div className="no-results">
                    <p>No routes found. Add a new route to get started!</p>
                  </div>
                ) : (
                  <div className="routes-list">
                    {routes
                      .filter(route => {
                        const fromMatch = !routeSearchFilter.from || 
                          route.from.toLowerCase().includes(routeSearchFilter.from.toLowerCase());
                        const toMatch = !routeSearchFilter.to || 
                          route.to.toLowerCase().includes(routeSearchFilter.to.toLowerCase());
                        return fromMatch && toMatch;
                      })
                      .map((route, index) => (
                        <div key={`${route.from}-${route.to}`} className="route-card">
                          <div className="route-card-header">
                            <div className="route-title">
                              <FaRoute className="route-icon" />
                              <h3>{route.from} → {route.to}</h3>
                              <span className="bus-count-badge">{route.buses.length} {route.buses.length === 1 ? 'Bus' : 'Buses'}</span>
                            </div>
                          </div>
                          <div className="route-buses-list">
                            {route.buses.map(bus => (
                              <div key={bus.id} className="route-bus-item">
                                <div className="route-bus-info">
                                  <div className="route-bus-name">
                                    <FaBus />
                                    <strong>{bus.name}</strong>
                                    <span className="bus-operator">{bus.operator}</span>
                                  </div>
                                  <div className="route-bus-details">
                                    <span className="bus-type">{bus.type}</span>
                                    <span className="bus-timing">
                                      {bus.departureTime} → {bus.arrivalTime}
                                    </span>
                                    <span className="bus-duration">{bus.duration}</span>
                                    <span className="bus-fare">
                                      <FaRupeeSign />{bus.fare}
                                    </span>
                                    <span className="bus-seats">
                                      {bus.availableSeats || 40} seats
                                    </span>
                                  </div>
                                </div>
                                <div className="route-bus-actions">
                                  <button
                                    onClick={() => handleEditBus(bus)}
                                    className="btn-icon"
                                    title="Edit Bus"
                                  >
                                    <FaEdit />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBus(bus.id)}
                                    className="btn-icon btn-danger"
                                    title="Delete Bus"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {showRouteForm && (
                <div className="bus-form-modal">
                  <div className="modal-content">
                    <h3>Add New Route with Bus</h3>
                    <form onSubmit={handleRouteSubmit}>
                      <div className="form-grid">
                        <div className="input-group">
                          <label>From City *</label>
                          <select
                            value={routeForm.from}
                            onChange={(e) => setRouteForm({ ...routeForm, from: e.target.value })}
                            required
                          >
                            <option value="">Select City</option>
                            {INDIAN_CITIES.map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>
                        <div className="input-group">
                          <label>To City *</label>
                          <select
                            value={routeForm.to}
                            onChange={(e) => setRouteForm({ ...routeForm, to: e.target.value })}
                            required
                          >
                            <option value="">Select City</option>
                            {INDIAN_CITIES.filter(city => city !== routeForm.from).map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>
                        <div className="input-group">
                          <label>Bus Name *</label>
                          <input
                            type="text"
                            value={routeForm.name}
                            onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                            placeholder="e.g., Volvo Multi-Axle"
                            required
                          />
                        </div>
                        <div className="input-group">
                          <label>Operator *</label>
                          <input
                            type="text"
                            value={routeForm.operator}
                            onChange={(e) => setRouteForm({ ...routeForm, operator: e.target.value })}
                            placeholder="e.g., VRL Travels"
                            required
                          />
                        </div>
                        <div className="input-group">
                          <label>Bus Type *</label>
                          <select
                            value={routeForm.type}
                            onChange={(e) => setRouteForm({ ...routeForm, type: e.target.value })}
                            required
                          >
                            <option value="sleeper">Sleeper</option>
                            <option value="semi-sleeper">Semi Sleeper</option>
                            <option value="seater">Seater</option>
                          </select>
                        </div>
                        <div className="input-group">
                          <label>Fare (₹) *</label>
                          <input
                            type="number"
                            value={routeForm.fare}
                            onChange={(e) => setRouteForm({ ...routeForm, fare: e.target.value })}
                            required
                            min="0"
                          />
                        </div>
                        <div className="input-group">
                          <label>Departure Time *</label>
                          <input
                            type="time"
                            value={routeForm.departureTime}
                            onChange={(e) => setRouteForm({ ...routeForm, departureTime: e.target.value })}
                            required
                          />
                        </div>
                        <div className="input-group">
                          <label>Arrival Time *</label>
                          <input
                            type="time"
                            value={routeForm.arrivalTime}
                            onChange={(e) => setRouteForm({ ...routeForm, arrivalTime: e.target.value })}
                            required
                          />
                        </div>
                        <div className="input-group">
                          <label>Duration *</label>
                          <input
                            type="text"
                            value={routeForm.duration}
                            onChange={(e) => setRouteForm({ ...routeForm, duration: e.target.value })}
                            placeholder="e.g., 6h 30m"
                            required
                          />
                        </div>
                        <div className="input-group">
                          <label>Rating</label>
                          <input
                            type="number"
                            value={routeForm.rating}
                            onChange={(e) => setRouteForm({ ...routeForm, rating: e.target.value })}
                            min="0"
                            max="5"
                            step="0.1"
                            required
                          />
                        </div>
                        <div className="input-group">
                          <label>Available Seats *</label>
                          <input
                            type="number"
                            value={routeForm.availableSeats}
                            onChange={(e) => setRouteForm({ ...routeForm, availableSeats: e.target.value })}
                            min="1"
                            max="50"
                            required
                          />
                        </div>
                        <div className="input-group full-width">
                          <label>Bus Photos (URLs - one per line)</label>
                          <textarea
                            value={Array.isArray(routeForm.busPhotos) ? routeForm.busPhotos.join('\n') : ''}
                            onChange={(e) => {
                              const urls = e.target.value.split('\n').filter(url => url.trim() !== '');
                              setRouteForm({ ...routeForm, busPhotos: urls });
                            }}
                            placeholder="Enter photo URLs, one per line"
                            rows="3"
                            style={{ fontFamily: 'monospace', fontSize: '12px' }}
                          />
                        </div>
                        <div className="input-group full-width">
                          <label>Interior Photos (URLs - one per line)</label>
                          <textarea
                            value={Array.isArray(routeForm.interiorPhotos) ? routeForm.interiorPhotos.join('\n') : ''}
                            onChange={(e) => {
                              const urls = e.target.value.split('\n').filter(url => url.trim() !== '');
                              setRouteForm({ ...routeForm, interiorPhotos: urls });
                            }}
                            placeholder="Enter photo URLs, one per line"
                            rows="3"
                            style={{ fontFamily: 'monospace', fontSize: '12px' }}
                          />
                        </div>
                      </div>
                      <div className="form-actions">
                        <button type="submit" className="btn btn-primary">
                          Add Route & Bus
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowRouteForm(false);
                            setRouteForm({
                              from: '',
                              to: '',
                              name: '',
                              operator: '',
                              type: 'sleeper',
                              fare: '',
                              departureTime: '',
                              arrivalTime: '',
                              duration: '',
                              rating: 4.0,
                              reviews: 0,
                              availableSeats: 40,
                              amenities: [],
                              busPhotos: [],
                              interiorPhotos: []
                            });
                          }}
                          className="btn btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="info-box">
                <h3>📋 How to Add a New Route</h3>
                <ol>
                  <li>Click <strong>"Add New Route"</strong> button above</li>
                  <li>Select <strong>From</strong> and <strong>To</strong> cities</li>
                  <li>Fill in the bus details (name, operator, type, fare, etc.)</li>
                  <li>Add bus photos and interior photos (optional)</li>
                  <li>Click <strong>"Add Route & Bus"</strong> to save</li>
                </ol>
                <p className="info-text">
                  The route will be created with the bus, and users will be able to search and book tickets for this route.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

