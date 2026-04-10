import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RequestForm from './pages/RequestForm';
import RequestList from './pages/RequestList';
import Approvals from './pages/Approvals';
import Achievements from './pages/Achievements';
import Portfolio from './pages/Portfolio';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Login from './pages/Login';

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { user, profile, loading, needsProfile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B4513]"></div>
      </div>
    );
  }

  if (!user || needsProfile) {
    return <Navigate to="/login" />;
  }

  if (roles && profile && !roles.includes(profile.role)) {
    return <Navigate to="/" />;
  }

  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/request/new" element={
            <ProtectedRoute roles={['student']}>
              <RequestForm />
            </ProtectedRoute>
          } />

          <Route path="/requests" element={
            <ProtectedRoute roles={['student']}>
              <RequestList />
            </ProtectedRoute>
          } />

          <Route path="/approvals" element={
            <ProtectedRoute roles={['faculty', 'hod']}>
              <Approvals />
            </ProtectedRoute>
          } />

          <Route path="/achievements" element={
            <ProtectedRoute roles={['student']}>
              <Achievements />
            </ProtectedRoute>
          } />

          <Route path="/portfolio" element={
            <ProtectedRoute roles={['student']}>
              <Portfolio />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
