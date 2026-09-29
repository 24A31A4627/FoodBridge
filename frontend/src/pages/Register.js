import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const ROLES = [
  { value: 'donor',     label: '🍽️  Donor',     desc: 'I have surplus food to share' },
  { value: 'ngo',       label: '🏥  NGO',        desc: 'We distribute food to those in need' },
  { value: 'volunteer', label: '🚴  Volunteer',  desc: 'I help with pickup & delivery' },
];

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'donor', phone: '', address: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to FoodBridge 🌿');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-logo">🌿 FoodBridge</div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Join the food rescue mission</p>

        <form onSubmit={handleSubmit}>
          {/* Role selector */}
          <div className="form-group">
            <label className="form-label">I am a...</label>
            <div className="role-grid">
              {ROLES.map(r => (
                <div
                  key={r.value}
                  className={`role-card ${form.role === r.value ? 'selected' : ''}`}
                  onClick={() => setForm(f => ({ ...f, role: r.value }))}
                >
                  <div className="role-label">{r.label}</div>
                  <div className="role-desc">{r.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" name="name" placeholder="John Doe"
                value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" name="email" placeholder="you@example.com"
                value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" name="password" placeholder="Min 6 characters"
                value={form.password} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-control" type="password" name="confirmPassword" placeholder="Repeat password"
                value={form.confirmPassword} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone (optional)</label>
              <input className="form-control" name="phone" placeholder="+91 98765 43210"
                value={form.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Address (optional)</label>
              <input className="form-control" name="address" placeholder="City, State"
                value={form.address} onChange={handleChange} />
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
