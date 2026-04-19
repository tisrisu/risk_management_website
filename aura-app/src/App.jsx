import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AmbientBackground from './components/AmbientBackground';
import './index.css';

const WelcomePage = lazy(() => import('./pages/WelcomePage'));
const GuestLogin = lazy(() => import('./pages/GuestLogin'));
const StaffLogin = lazy(() => import('./pages/StaffLogin'));
const HotelRegistration = lazy(() => import('./pages/HotelRegistration'));
const GuestPage = lazy(() => import('./pages/GuestPage'));
const StaffPage = lazy(() => import('./pages/StaffPage'));

// A tiny wrapper component to protect routes
function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  
  if (loading) return null; // Wait for local storage to load
  
  if (!user) {
    // Not logged in at all
    return <Navigate to={`/${role}/login`} replace />;
  }
  
  if (user.role !== role) {
    // Logged in, but wrong role
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <AmbientBackground />
      <BrowserRouter>
        <Suspense fallback={<div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', color: 'var(--text-primary)' }}>Loading...</div>}>
          <main style={{ minHeight: '100vh' }}>
            <Routes>
              {/* Public Welcome & Login */}
              <Route path="/" element={<WelcomePage />} />
              <Route path="/register" element={<HotelRegistration />} />
              <Route path="/guest/login" element={<GuestLogin />} />
              <Route path="/staff/login" element={<StaffLogin />} />

              {/* Protected Routes */}
              <Route 
                path="/guest" 
                element={
                  <ProtectedRoute role="guest">
                    <GuestPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/staff" 
                element={
                  <ProtectedRoute role="staff">
                    <StaffPage />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;