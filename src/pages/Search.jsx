import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { FaStar, FaClock, FaRupeeSign, FaBus, FaExchangeAlt, FaCalendarAlt, FaSearch, FaImages } from 'react-icons/fa';
import { format, addDays } from 'date-fns';
import './Search.css';

const Search = () => {
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const date = searchParams.get('date') || '';
  
  const navigate = useNavigate();
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('price-asc');
  const [selectedBusId, setSelectedBusId] = useState(null);

  useEffect(() => {
    fetchBuses();
  }, [from, to, date]);

  const fetchBuses = async () => {
    try {
      setLoading(true);
      
      if (!from || !to) {
        setBuses([]);
        setLoading(false);
        return;
      }
      
      // Get all buses to determine available routes
      const busesRef = collection(db, 'buses');
      const allBusesSnapshot = await getDocs(busesRef);
      const allBuses = allBusesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Group buses by route to identify available routes
      const routesMap = new Map();
      allBuses.forEach(bus => {
        if (bus.from && bus.to) {
          const routeKey = `${bus.from} → ${bus.to}`;
          if (!routesMap.has(routeKey)) {
            routesMap.set(routeKey, {
              from: bus.from,
              to: bus.to,
              busCount: 0
            });
          }
          routesMap.get(routeKey).busCount++;
        }
      });
      
      // Get available routes (routes that have at least one bus)
      const availableRoutes = Array.from(routesMap.values());
      
      // Filter buses: only show buses that match search AND are part of available routes
      const matchingBuses = allBuses.filter(bus => {
        // Must match search criteria
        if (bus.from !== from || bus.to !== to) {
          return false;
        }
        
        // Must be part of an available route (route exists in routesMap)
        const routeKey = `${bus.from} → ${bus.to}`;
        return routesMap.has(routeKey);
      });
      
      setBuses(matchingBuses);
    } catch (error) {
      console.error('Error fetching buses:', error);
      setBuses([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortBuses = () => {
    let filtered = [...buses];

    // Sort buses
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.fare - b.fare;
        case 'price-desc':
          return b.fare - a.fare;
        case 'departure-asc':
          return a.departureTime.localeCompare(b.departureTime);
        case 'departure-desc':
          return b.departureTime.localeCompare(a.departureTime);
        case 'rating-desc':
          return (b.rating || 4.0) - (a.rating || 4.0);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const handleDateChange = (newDate) => {
    navigate(`/search?from=${from}&to=${to}&date=${newDate}`);
  };

  const swapCities = () => {
    navigate(`/search?from=${to}&to=${from}&date=${date}`);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading buses...</p>
      </div>
    );
  }

  const filteredBuses = filterAndSortBuses();
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = addDays(new Date(), 1).toISOString().split('T')[0];

  return (
    <div className="search-page">
      {/* Top Header Bar */}
      <div className="search-top-bar">
        <div className="container">
          <div className="top-bar-content">
            <div className="route-info">
              <div className="route-item">
                <FaBus className="route-icon" />
                <span className="route-label">From</span>
                <span className="route-city">{from}</span>
              </div>
              <button className="swap-btn" onClick={swapCities} title="Swap cities">
                <FaExchangeAlt />
              </button>
              <div className="route-item">
                <FaBus className="route-icon" />
                <span className="route-label">To</span>
                <span className="route-city">{to}</span>
              </div>
            </div>
            <div className="date-actions">
              <div className="date-info">
                <FaCalendarAlt />
                <span>Date of journey {date && format(new Date(date), 'dd MMM, yyyy')}</span>
              </div>
              <button 
                className="quick-date-btn"
                onClick={() => handleDateChange(today)}
              >
                Today
              </button>
              <button 
                className="quick-date-btn"
                onClick={() => handleDateChange(tomorrow)}
              >
                Tomorrow
              </button>
              <button className="search-icon-btn">
                <FaSearch />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="search-content">
          {/* Main Content Area */}
          <div className="buses-content">
            {/* Green Banner */}
            <div className="search-banner">
              <div className="banner-wave"></div>
              <p>50000+ searches on this route last month</p>
            </div>

            {/* Buses List */}
            <div className="buses-list">
              {filteredBuses.length === 0 ? (
                <div className="no-results">
                  <p>No buses found for this route.</p>
                </div>
              ) : (
                filteredBuses.map(bus => {
                  const rating = bus.rating || 4.0;
                  const reviews = bus.reviews || Math.floor(Math.random() * 500) + 100;
                  const availableSeats = bus.availableSeats || 40;
                  const singleSeats = Math.floor(availableSeats * 0.3);
                  const hasDiscount = Math.random() > 0.5;
                  const discount = hasDiscount ? Math.floor(bus.fare * 0.1) : 0;
                  const finalPrice = bus.fare - discount;
                  
                  const isSelected = selectedBusId === bus.id;
                  const showImages = isSelected && bus.busPhotos && bus.busPhotos.length > 0;
                  
                  return (
                    <div key={bus.id} className={`bus-card ${isSelected ? 'selected' : ''}`}>
                      <div className="bus-card-content">
                        <div className="bus-card-left">
                        <div className="bus-name-section">
                          <FaBus className="bus-name-icon" />
                          <div>
                            <h3 className="bus-name">{bus.name}</h3>
                            <p className="bus-type-text">{bus.operator} • {bus.type} • {bus.type === 'sleeper' ? '2+1' : '2+2'}</p>
                          </div>
                          {bus.busPhotos && bus.busPhotos.length > 0 && (
                            <button 
                              className="view-photos-btn"
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedBusId(isSelected ? null : bus.id);
                              }}
                              title={isSelected ? 'Hide photos' : 'View photos'}
                            >
                              <FaImages />
                              <span>{isSelected ? 'Hide' : 'View'} Photos ({bus.busPhotos.length})</span>
                            </button>
                          )}
                        </div>
                        <div className="bus-rating-box">
                          <FaStar className="rating-star" />
                          <span className="rating-value">{rating}</span>
                          <span className="rating-reviews">({reviews})</span>
                        </div>
                        <div className="bus-timing-section">
                          <div className="timing-item">
                            <span className="timing-time">{bus.departureTime}</span>
                          </div>
                          <div className="timing-duration">
                            <span>{bus.duration || '6h 30m'}</span>
                          </div>
                          <div className="timing-item">
                            <span className="timing-time">{bus.arrivalTime}</span>
                          </div>
                        </div>
                        <div className="bus-seats-info">
                          <span>{availableSeats} Seats ({singleSeats} Single)</span>
                        </div>
                      </div>
                      <div className="bus-card-right">
                        {hasDiscount && (
                          <div className="discount-tag">
                            Exclusive ₹{discount} OFF
                          </div>
                        )}
                        <div className="bus-price-section">
                          {hasDiscount && (
                            <span className="original-price">
                              <FaRupeeSign />{bus.fare}
                            </span>
                          )}
                          <span className="final-price">
                            <FaRupeeSign />{finalPrice}
                          </span>
                          <span className="price-onwards">Onwards</span>
                        </div>
                        <Link
                          to={`/bus/${bus.id}?date=${date}`}
                          className="view-seats-btn"
                        >
                          View seats
                        </Link>
                        {Math.random() > 0.7 && (
                          <div className="bus-features">
                            <span className="feature-tag new-bus">New Bus</span>
                            {Math.random() > 0.5 && (
                              <span className="feature-tag toilet">Toilet</span>
                            )}
                          </div>
                        )}
                      </div>
                      </div>
                      
                      {/* Bus Photos Section - Shown when selected */}
                      {showImages && (
                        <div className="bus-photos-expanded">
                          <div className="photos-header-expanded">
                            <h4>Bus Photos</h4>
                            <button 
                              className="close-photos-btn"
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedBusId(null);
                              }}
                            >
                              ×
                            </button>
                          </div>
                          <div className="photos-grid">
                            {bus.busPhotos.map((photo, idx) => (
                              <div key={idx} className="photo-item">
                                <img 
                                  src={photo} 
                                  alt={`${bus.name} - Photo ${idx + 1}`}
                                  onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=250&fit=crop&q=80';
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;

