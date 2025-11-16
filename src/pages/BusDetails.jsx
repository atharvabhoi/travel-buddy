import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { FaStar, FaClock, FaRupeeSign, FaBus, FaImages, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { format } from 'date-fns';
import './BusDetails.css';

const BusDetails = () => {
  const { busId } = useParams();
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date') || '';
  
  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [photoType, setPhotoType] = useState('bus'); // 'bus' or 'interior'

  useEffect(() => {
    fetchBusDetails();
  }, [busId]);

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

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading bus details...</p>
      </div>
    );
  }

  if (!bus) {
    return <div className="error">Bus not found</div>;
  }

  return (
    <div className="bus-details-page">
      <div className="container">
        <div className="bus-details-card">
          <div className="bus-details-header">
            <div className="bus-main-info">
              <h2>{bus.name}</h2>
              <div className="bus-meta">
                <div className="rating">
                  <FaStar className="star-icon" />
                  <span>{bus.rating || 4.0}</span>
                  <span className="rating-text">({bus.reviews || 120} reviews)</span>
                </div>
                <span className="operator">{bus.operator}</span>
              </div>
            </div>
            <div className="bus-price-large">
              <FaRupeeSign />
              <span>{bus.fare}</span>
            </div>
          </div>

          <div className="route-info">
            <div className="route-points">
              <div className="route-point">
                <div className="point-details">
                  <span className="point-time">{bus.departureTime}</span>
                  <span className="point-city">{bus.from}</span>
                </div>
              </div>
              <div className="route-duration">
                <FaBus />
                <span>{bus.duration || '6h 30m'}</span>
              </div>
              <div className="route-point">
                <div className="point-details">
                  <span className="point-time">{bus.arrivalTime}</span>
                  <span className="point-city">{bus.to}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bus Photos Gallery */}
          <div className="bus-photos-section">
            <div className="photos-header">
              <h3>Bus Photos</h3>
              <div className="photo-type-tabs">
                <button 
                  className={`photo-tab ${photoType === 'bus' ? 'active' : ''}`}
                  onClick={() => {
                    setPhotoType('bus');
                    setSelectedPhotoIndex(0);
                  }}
                >
                  <FaBus /> Bus Photos
                  {bus.busPhotos && bus.busPhotos.length > 0 && (
                    <span className="photo-count">({bus.busPhotos.length})</span>
                  )}
                </button>
                <button 
                  className={`photo-tab ${photoType === 'interior' ? 'active' : ''}`}
                  onClick={() => {
                    setPhotoType('interior');
                    setSelectedPhotoIndex(0);
                  }}
                >
                  <FaImages /> Interior Photos
                  {bus.interiorPhotos && bus.interiorPhotos.length > 0 && (
                    <span className="photo-count">({bus.interiorPhotos.length})</span>
                  )}
                </button>
              </div>
            </div>

            <div className="photo-gallery">
              {(() => {
                const photos = photoType === 'bus' 
                  ? (bus.busPhotos || []) 
                  : (bus.interiorPhotos || []);
                
                if (photos.length === 0) {
                  return (
                    <div className="no-photos">
                      <FaImages className="no-photos-icon" />
                      <p>No {photoType} photos available</p>
                    </div>
                  );
                }

                return (
                  <>
                    <div className="main-photo-container">
                      <img 
                        src={photos[selectedPhotoIndex] || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=500&fit=crop&q=80'} 
                        alt={`${bus.name} ${photoType} view ${selectedPhotoIndex + 1}`}
                        className="main-photo"
                        onError={(e) => {
                          e.target.src = photoType === 'bus' 
                            ? 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=500&fit=crop&q=80'
                            : 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=800&h=500&fit=crop&q=80';
                        }}
                      />
                      {photos.length > 1 && (
                        <>
                          <button 
                            className="photo-nav-btn prev-btn"
                            onClick={() => setSelectedPhotoIndex((prev) => 
                              prev === 0 ? photos.length - 1 : prev - 1
                            )}
                          >
                            <FaChevronLeft />
                          </button>
                          <button 
                            className="photo-nav-btn next-btn"
                            onClick={() => setSelectedPhotoIndex((prev) => 
                              prev === photos.length - 1 ? 0 : prev + 1
                            )}
                          >
                            <FaChevronRight />
                          </button>
                        </>
                      )}
                      <div className="photo-counter">
                        {selectedPhotoIndex + 1} / {photos.length}
                      </div>
                    </div>
                    {photos.length > 1 && (
                      <div className="photo-thumbnails">
                        {photos.map((photo, index) => (
                          <div 
                            key={index}
                            className={`photo-thumbnail ${index === selectedPhotoIndex ? 'active' : ''}`}
                            onClick={() => setSelectedPhotoIndex(index)}
                          >
                            <img 
                              src={photo} 
                              alt={`Thumbnail ${index + 1}`}
                              onError={(e) => {
                                e.target.src = photoType === 'bus' 
                                  ? 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100&h=100&fit=crop&q=80'
                                  : 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?w=100&h=100&fit=crop&q=80';
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          <div className="bus-features">
            <h3>Bus Features</h3>
            <div className="features-list">
              <div className="feature-item">
                <span className="feature-label">Bus Type:</span>
                <span className="feature-value">{bus.type}</span>
              </div>
              <div className="feature-item">
                <span className="feature-label">Available Seats:</span>
                <span className="feature-value">{bus.availableSeats || 40}</span>
              </div>
              <div className="feature-item">
                <span className="feature-label">Amenities:</span>
                <span className="feature-value">
                  {bus.amenities?.join(', ') || 'AC, Charging Point, Reading Light'}
                </span>
              </div>
            </div>
          </div>

          <div className="booking-section">
            <div className="travel-date">
              <span className="date-label">Travel Date:</span>
              <span className="date-value">
                {date && format(new Date(date), 'EEEE, MMMM dd, yyyy')}
              </span>
            </div>
            <Link
              to={`/bus/${busId}/select-seats?date=${date}`}
              className="btn btn-primary btn-large"
            >
              Select Seats
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusDetails;

