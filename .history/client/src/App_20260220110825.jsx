import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useContext, useEffect } from 'react'
import { AuthContext } from './context/AuthContext'
import Login from './pages/login'
import Home from './pages/Home'
import AdminDashboard from './pages/AdminDashboard'

function AppRoutes() {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && user && location.pathname === '/login') {
      // After successful login, redirect based on role
      const destination = user.role === 'admin' ? '/admin' : '/home';
      navigate(destination, { replace: true });
    }
  }, [user, loading, navigate, location]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }
  const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div>Loading Security...</div>;
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" />;
  }
  return children;
};

  const getDefaultRoute = () => {
    if (!user) return '/login';
    return user.role === 'admin' ? '/admin' : '/home';
  };

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!user ? <Login /> : <Navigate to={getDefaultRoute()} replace />} 
      />
      <Route 
        path="/home" 
        element={user && user.role === 'user' ? <Home /> : <Navigate to={getDefaultRoute()} replace />} 
      />
      <Route 
        path="/admin" 
        element={user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to={getDefaultRoute()} replace />} 
      />
      <Route 
        path="/" 
        element={<Navigate to={getDefaultRoute()} replace />} 
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}

export default App
