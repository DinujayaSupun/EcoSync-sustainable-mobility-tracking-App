import './App.css'
import { AuthContext } from './context/AuthContext'
import Login from './pages/Login'
import Home from './pages/Home'
import AdminDashboard from './pages/AdminDashboard'
import CommuteLogger from './pages/CommuteLogger'
import CommuteHistory from './pages/CommuteHistory'
import { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import UserManagement from './pages/UserManagement'; 


 //🛡️ Admin Guard Component
const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div className="flex justify-center items-center h-screen">Verifying Admin...</div>;
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

//🛡️ User Guard Component

const UserProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div className="flex justify-center items-center h-screen">Loading Profile...</div>;
  
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function AppRoutes() {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect logic after login
  useEffect(() => {
    if (!loading && user && location.pathname === '/login') {
      const destination = user.role === 'admin' ? '/admin' : '/home';
      navigate(destination, { replace: true });
    }
  }, [user, loading, navigate, location]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'admin' ? '/admin' : '/home'} replace />} />

      {/* 🏠 Student Routes */}
      <Route path="/home" element={
        <UserProtectedRoute>
          <Home />
        </UserProtectedRoute>
      } />

      {/* 🏛️ Admin Routes (Your Primary Work) */}
      <Route path="/admin" element={
        <AdminProtectedRoute>
          <AdminDashboard />
        </AdminProtectedRoute>
      } />
      
      {/* New Route for User Management Table */}
      <Route path="/admin/users" element={
        <AdminProtectedRoute>
          <UserManagement />
        </AdminProtectedRoute>
      } />

      {/* Default Redirects */}
      <Route path="/" element={<Navigate to={!user ? "/login" : (user.role === 'admin' ? "/admin" : "/home")} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to={getDefaultRoute()} />} 
        />
        <Route 
          path="/home" 
          element={user && user.role === 'user' ? <Home /> : <Navigate to={getDefaultRoute()} />} 
        />
        <Route 
          path="/commute-logger" 
          element={user ? <CommuteLogger /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/commute-history" 
          element={user ? <CommuteHistory /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/admin" 
          element={user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to={getDefaultRoute()} />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={getDefaultRoute()} />} 
        />
      </Routes>
      <AppRoutes />
    </Router>
  );
}

export default App;