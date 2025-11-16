import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaMapMarkerAlt, FaHistory, FaTimes } from 'react-icons/fa';
import { HOME_PAGE_CITIES } from '../utils/constants';
import { useSearchHistory } from '../context/SearchHistoryContext';
import './Home.css';

const Home = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();
  const { searchHistory, addToSearchHistory, clearSearchHistory } = useSearchHistory();

  const handleSearch = (e) => {
    e.preventDefault();
    if (from && to && date) {
      addToSearchHistory(from, to, date);
      navigate(`/search?from=${from}&to=${to}&date=${date}`);
    }
  };

  const handleHistoryClick = (historyItem) => {
    setFrom(historyItem.from);
    setTo(historyItem.to);
    setDate(historyItem.date);
    navigate(`/search?from=${historyItem.from}&to=${historyItem.to}&date=${historyItem.date}`);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="home">
      <div className="hero-section bus-background">
        <div className="bus-overlay"></div>
        <div className="container">
          <div className="hero-content">
            <h1>Bookings At Your Fingertips</h1>
            <p>We handle the road, you enjoy the ride</p>
            
            <form className="search-form" onSubmit={handleSearch}>
              <div className="search-input-group">
                <FaMapMarkerAlt className="input-icon" />
                <select
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  onFocus={() => setShowHistory(true)}
                  required
                  className="search-input"
                >
                  <option value="">From</option>
                  {HOME_PAGE_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              
              <div className="search-input-group">
                <FaMapMarkerAlt className="input-icon" />
                <select
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  onFocus={() => setShowHistory(true)}
                  required
                  className="search-input"
                >
                  <option value="">To</option>
                  {HOME_PAGE_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              
              <div className="search-input-group">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onFocus={() => setShowHistory(true)}
                  min={today}
                  required
                  className="search-input"
                />
              </div>
              
              <button type="submit" className="btn btn-primary search-btn">
                <FaSearch />
                Search Buses
              </button>
            </form>
            
            {searchHistory.length > 0 && (
              <div className="search-history">
                <div className="history-header">
                  <FaHistory />
                  <span>Recent Searches</span>
                  <button 
                    onClick={clearSearchHistory} 
                    className="clear-history-btn"
                    title="Clear history"
                  >
                    <FaTimes />
                  </button>
                </div>
                <div className="history-list">
                  {searchHistory.slice(0, 5).map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleHistoryClick(item)}
                      className="history-item"
                    >
                      <FaMapMarkerAlt />
                      <span>{item.from} → {item.to}</span>
                      <span className="history-date">
                        {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="features-section">
        <div className="container">
          <h2>Why Choose Travel Buddy?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-card-icon">🚌</span>
              <h3>Easy Booking</h3>
              <p>Book your bus tickets in just a few clicks with our intuitive interface</p>
            </div>
            <div className="feature-card">
              <span className="feature-card-icon">💰</span>
              <h3>Best Prices</h3>
              <p>Compare prices from multiple operators and get the best deals available</p>
            </div>
            <div className="feature-card">
              <span className="feature-card-icon">🛡️</span>
              <h3>24/7 Support</h3>
              <p>Round-the-clock customer support to assist you anytime, anywhere</p>
            </div>
            <div className="feature-card">
              <span className="feature-card-icon">✅</span>
              <h3>Safe Travel</h3>
              <p>Travel with trusted operators ensuring your safety and comfort</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

