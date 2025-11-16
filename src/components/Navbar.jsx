import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaBus, FaUser } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            <FaBus className="brand-icon" />
            <span>Travel Buddy</span>
          </Link>
          
          <div className="navbar-links">
            {currentUser ? (
              <>
                <Link to="/profile" className="nav-link">
                  <FaUser />
                  <span>{currentUser.displayName || currentUser.email}</span>
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="nav-link">
                    Admin
                  </Link>
                )}
                <button onClick={handleLogout} className="btn btn-secondary">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary">Login</Link>
                <Link to="/signup" className="btn btn-primary">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

