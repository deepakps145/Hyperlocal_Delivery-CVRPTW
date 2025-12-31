import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { RiderDashboard } from './pages/RiderDashboard';
import { AdminLogin } from './pages/AdminLogin';
import { RiderLogin } from './pages/RiderLogin';
import { AdminSignup } from './pages/AdminSignup';
import { RiderSignup } from './pages/RiderSignup';

// Protected Route Component
function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  if (!user || !token) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Wrapper components to handle navigation
function LandingPageWrapper() {
  const navigate = useNavigate();
  
  const handleNavigate = (view: string) => {
    navigate(`/${view}`);
  };

  return <LandingPage onNavigate={handleNavigate} />;
}

function AdminLoginWrapper() {
  const navigate = useNavigate();
  
  const handleLoginSuccess = (userData: any) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userData.access_token);
    navigate('/admin-dashboard');
  };

  const handleNavigateToSignup = () => {
    navigate('/admin-signup');
  };

  return <AdminLogin onLoginSuccess={handleLoginSuccess} onNavigateToSignup={handleNavigateToSignup} />;
}

function AdminSignupWrapper() {
  const navigate = useNavigate();
  
  const handleSignupSuccess = (userData: any) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userData.access_token);
    navigate('/admin-dashboard');
  };

  const handleNavigateToLogin = () => {
    navigate('/admin-login');
  };

  return <AdminSignup onSignupSuccess={handleSignupSuccess} onNavigateToLogin={handleNavigateToLogin} />;
}

function RiderLoginWrapper() {
  const navigate = useNavigate();
  
  const handleLoginSuccess = (userData: any) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userData.access_token);
    navigate('/rider-dashboard');
  };

  const handleNavigateToSignup = () => {
    navigate('/rider-signup');
  };

  return <RiderLogin onLoginSuccess={handleLoginSuccess} onNavigateToSignup={handleNavigateToSignup} />;
}

function RiderSignupWrapper() {
  const navigate = useNavigate();
  
  const handleSignupSuccess = (userData: any) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userData.access_token);
    navigate('/rider-dashboard');
  };

  const handleNavigateToLogin = () => {
    navigate('/rider-login');
  };

  return <RiderSignup onSignupSuccess={handleSignupSuccess} onNavigateToLogin={handleNavigateToLogin} />;
}

function AdminDashboardWrapper() {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return <AdminDashboard onBack={handleLogout} />;
}

function RiderDashboardWrapper() {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return <RiderDashboard onBack={handleLogout} />;
}

export default function App() {
  return (
    <Router>
      <div className="size-full">
        <Routes>
          <Route path="/" element={<LandingPageWrapper />} />
          <Route path="/admin-login" element={<AdminLoginWrapper />} />
          <Route path="/admin-signup" element={<AdminSignupWrapper />} />
          <Route path="/rider-login" element={<RiderLoginWrapper />} />
          <Route path="/rider-signup" element={<RiderSignupWrapper />} />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboardWrapper />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rider-dashboard"
            element={
              <ProtectedRoute requiredRole="rider">
                <RiderDashboardWrapper />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}
