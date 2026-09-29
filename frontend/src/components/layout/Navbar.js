import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navLinks = [
    { to: '/dashboard', label: '🏠 Dashboard' },
    { to: '/food',      label: '🍱 Food Posts' },
    { to: '/post-food', label: '➕ Donate Food', roles: ['donor', 'admin'] },
    { to: '/map',       label: '🗺️ Map' },
    { to: '/impact',    label: '📊 Impact' },
  ];

  const visible = navLinks.filter(l => !l.roles || l.roles.includes(user?.role));

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/dashboard" className="navbar-brand">
          🌿 Food<span>Bridge</span>
        </Link>

        <button className="nav-toggle" onClick={() => setMenuOpen(o => !o)}>
          {menuOpen ? '✕' : '☰'}
        </button>

        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {visible.map(l => (
            <Link
              key={l.to} to={l.to}
              className={`nav-link ${location.pathname === l.to ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="nav-user">
          {user && (
            <>
              <div className="nav-avatar">
                <span className="avatar-dot" />
                <span className="nav-name">{user.name}</span>
                <span className="nav-role">{user.role}</span>
              </div>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
