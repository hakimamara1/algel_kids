import React, { useEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { trackPageView } from './utils/FacebookPixel';
import { getAdminToken, setAdminToken } from './lib/adminToken';
// Ads land on product pages, so this page ships in the main bundle (saves a round trip)
import ProductDetails from './pages/ProductDetails';

// Lazy load the other pages
const HomePage = lazy(() => import('./pages/HomePage'));
const ThankYou = lazy(() => import('./pages/ThankYou'));
const Privacy = lazy(() => import('./pages/Privacy'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
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

// The first PageView is sent by the Pixel snippet in index.html; this tracks later in-app navigations
const RouteChangeTracker = () => {
  const { pathname } = useLocation();
  const lastPath = useRef(pathname);

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    trackPageView();
  }, [pathname]);

  return null;
};

// Admin pages need a login token; an expired one is caught by adminApi (401)
const RequireAdmin = ({ children }) => {
  const { pathname } = useLocation();
  if (!getAdminToken()) {
    return <Navigate to={`/admin/login?next=${encodeURIComponent(pathname)}`} replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <RouteChangeTracker />
      <div className="font-sans antialiased text-gray-900">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/merci" element={<ThankYou />} />
            <Route path="/confidentialite" element={<Privacy />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={
              <RequireAdmin>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </RequireAdmin>
            } />
            <Route path="/admin/orders" element={
              <RequireAdmin>
                <AdminLayout>
                  <AdminOrders />
                </AdminLayout>
              </RequireAdmin>
            } />
            <Route path="/admin/product/new" element={<RequireAdmin><AdminProductEdit /></RequireAdmin>} />
            <Route path="/admin/product/:id/edit" element={<RequireAdmin><AdminProductEdit /></RequireAdmin>} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

// Simple Layout for Admin Navigation
const AdminLayout = ({ children }) => {
  const navigate = useNavigate();

  const logout = () => {
    setAdminToken(null);
    navigate('/admin/login', { replace: true });
  };

  return (
    <div dir="ltr">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-6 sticky top-0 z-30">
        <a href="/admin" className="font-bold text-gray-900 hover:text-pink-500">Products</a>
        <a href="/admin/orders" className="font-bold text-gray-900 hover:text-pink-500">Orders</a>
        <a href="/" className="ml-auto text-sm text-gray-500 hover:text-gray-900">View Shop</a>
        <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-900">Log out</button>
      </div>
      {children}
    </div>
  );
};


export default App;
