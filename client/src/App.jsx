import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from './context/AuthContext'
import Login from './pages/Login'
import Home from './pages/Home'
import AdminDashboard from './pages/AdminDashboard'
import CommuteLogger from './pages/CommuteLogger'
import CommuteHistory from './pages/CommuteHistory'

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const getDefaultRoute = () => {
    if (!user) return '/login';
    return user.role === 'admin' ? '/admin' : '/home';
  };

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
    </Router>
  )
}

export default App
