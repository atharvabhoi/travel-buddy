import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SearchHistoryProvider } from './context/SearchHistoryContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Search from './pages/Search';
import BusDetails from './pages/BusDetails';
import SeatSelection from './pages/SeatSelection';
import BookingConfirmation from './pages/BookingConfirmation';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminPanel from './pages/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <SearchHistoryProvider>
        <div className="app">
          <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/search" element={<Search />} />
          <Route path="/bus/:busId" element={<BusDetails />} />
          <Route
            path="/bus/:busId/select-seats"
            element={
              <ProtectedRoute>
                <SeatSelection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking-confirmation/:bookingId"
            element={
              <ProtectedRoute>
                <BookingConfirmation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
                <Route
                  path="/admin"
                  element={
                    <AdminProtectedRoute>
                      <AdminPanel />
                    </AdminProtectedRoute>
                  }
                />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </div>
      </SearchHistoryProvider>
    </AuthProvider>
  );
}

export default App;

