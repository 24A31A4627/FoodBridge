import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/global.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar    from './components/layout/Navbar';
import Login     from './pages/Login';
import Register  from './pages/Register';
import Dashboard from './pages/Dashboard';
import FoodList  from './pages/FoodList';
import PostFood  from './pages/PostFood';

// Protected route wrapper
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" />;
  return user ? children : <Navigate to="/login" replace />;
};

// Layout with navbar
const Layout = ({ children }) => (
  <>
    <Navbar />
    <main>{children}</main>
  </>
);

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login"    element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

      <Route path="/dashboard" element={
        <PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>
      }/>
      <Route path="/food" element={
        <PrivateRoute><Layout><FoodList /></Layout></PrivateRoute>
      }/>
      <Route path="/post-food" element={
        <PrivateRoute><Layout><PostFood /></Layout></PrivateRoute>
      }/>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
      <ToastContainer
        position="top-right" autoClose={3000}
        theme="dark"
        toastStyle={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
