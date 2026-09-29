import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 🌿');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🌿 FoodBridge</div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to continue rescuing food</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-control"
              type="email" name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-control"
              type="password" name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>

        {/* Demo credentials */}
        <div className="auth-demo">
          <p className="demo-title">Demo Accounts</p>
          <div className="demo-chips">
            <span onClick={() => setForm({ email:'donor@demo.com',  password:'demo123' })} className="demo-chip">Donor</span>
            <span onClick={() => setForm({ email:'ngo@demo.com',    password:'demo123' })} className="demo-chip">NGO</span>
            <span onClick={() => setForm({ email:'admin@demo.com',  password:'demo123' })} className="demo-chip">Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
