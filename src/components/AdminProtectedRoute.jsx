import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/AdminAccessDenied.css';

const AdminProtectedRoute = ({ children }) => {
  const { currentUser, isAdmin } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="admin-access-denied">
        <div className="container">
          <div className="access-denied-card">
            <h2>Access Denied</h2>
            <p>You do not have permission to access the admin panel.</p>
            <p className="admin-note">
              Only administrators can access this page. If you believe you should have access, 
              please contact the system administrator.
            </p>
            <a href="/" className="btn btn-primary">
              Go to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminProtectedRoute;

