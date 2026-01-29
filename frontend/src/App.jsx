import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProductDetails from './pages/ProductDetails';
import AdminDashboard from './pages/AdminDashboard';
import AdminProductEdit from './pages/AdminProductEdit';
import { initPixel, trackPageView } from './utils/FacebookPixel';

// Helper to track page views on route change
const PageViewTracker = () => {
  // In a real app we'd use useLocation to track generic page views
  // But since we only have one main page for now, we rely on individual components or track here
  return null;
};

function App() {
  useEffect(() => {
    // Initialize Pixel with your ID (Replace with env variable or real ID)
    initPixel('YOUR-PIXEL-ID-HERE');
    trackPageView(); // Initial load
  }, []);

  return (
    <Router>
      <div className="font-sans antialiased text-gray-900">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductDetails />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/product/new" element={<AdminProductEdit />} />
          <Route path="/admin/product/:id/edit" element={<AdminProductEdit />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
