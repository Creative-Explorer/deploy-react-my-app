import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext'; // Adjust path if needed
import LoginPage from './components/Login/LoginPage';
import DashboardComponent from './components/Dashboard/DashboardComponent';
import PaymentComponent from './components/Payment/PaymentComponent';
import PrivateRoute from './PrivateRoute'; // Ensure this path is correct
import SessionExpired from './SessionExpired';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route 
            path="/login" 
            element={
              <PrivateRoute element={<LoginPage />} isProtected={false} /> // Allow access if not authenticated
            } 
          />
          <Route path="/dashboard" element={<PrivateRoute element={<DashboardComponent />} />} />
          <Route path="/payment" element={<PrivateRoute element={<PaymentComponent />} />} />
          <Route path="/session-expired" element={<PrivateRoute element={<SessionExpired />} />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
