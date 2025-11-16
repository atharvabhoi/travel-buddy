import './LoadingSpinner.css';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-spinner-container">
      <div className="spinner-wrapper">
        <div className="spinner"></div>
        <div className="spinner-ring"></div>
      </div>
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default LoadingSpinner;

