import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SpecialOffersProvider } from './contexts/SpecialOffersContext';
import Header from './components/Header/Header';
import Hero from './components/Hero/Hero';
import SpecialOffers from './components/SpecialOffers/SpecialOffers';
import Accommodation from './components/Accommodation/Accommodation';
import Amenities from './components/Amenities/Amenities';
import Location from './components/Location/Location';
import Contact from './components/Contact/Contact';
import Footer from './components/Footer/Footer';
import LoginPage from './components/Auth/LoginPage';
import AdminDashboard from './components/Admin/AdminDashboard';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AuthCallback from './components/Auth/AuthCallback';

function HomePage() {
  return (
    <SpecialOffersProvider>
      <Header />
      <SpecialOffers />
      <Hero />
      <Accommodation />
      <Amenities />
      <Location />
      <Contact />
      <Footer />
    </SpecialOffersProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/silent-check-sso.html" element={<div>SSO Check</div>} />
            <Route path="/silent-check-sso.html/*" element={<div>SSO Check</div>} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;