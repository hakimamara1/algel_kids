import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initPixel, trackPageView } from './utils/FacebookPixel';

// Lazy load all page components for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminOrders = lazy(() => import('./pages/AdminOrders'));
const AdminProductEdit = lazy(() => import('./pages/AdminProductEdit'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto mb-4"></div>
      <p className="text-gray-600">جاري التحميل...</p>
    </div>
  </div>
);

// Helper to track page views on route change
const PageViewTracker = () => {
  // In a real app we'd use useLocation to track generic page views
  // But since we only have one main page for now, we rely on individual components or track here
  return null;
};

function App() {
  useEffect(() => {
    // Initialize Pixel with your ID (Replace with env variable or real ID)
    initPixel('1190930022111249');
    trackPageView(); // Initial load
  }, []);

  return (
    <Router>
      <div className="font-sans antialiased text-gray-900">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/product/:id" element={<ProductDetails />} />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            } />
            <Route path="/admin/orders" element={
              <AdminLayout>
                <AdminOrders />
              </AdminLayout>
            } />
            <Route path="/admin/product/new" element={<AdminProductEdit />} />
            <Route path="/admin/product/:id/edit" element={<AdminProductEdit />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

// Simple Layout for Admin Navigation
const AdminLayout = ({ children }) => {
  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex space-x-6 sticky top-0 z-30">
        <a href="/admin" className="font-bold text-gray-900 hover:text-pink-500">Products</a>
        <a href="/admin/orders" className="font-bold text-gray-900 hover:text-pink-500">Orders</a>
        <a href="/" className="ml-auto text-sm text-gray-500 hover:text-gray-900">View Shop</a>
      </div>
      {children}
    </div>
  );
};


export default App;
