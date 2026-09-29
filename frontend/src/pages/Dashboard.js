import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/food/stats/summary'),
      axios.get('/api/food?limit=4'),
    ]).then(([s, p]) => {
      setStats(s.data.stats);
      setRecentPosts(p.data.posts);
    }).finally(() => setLoading(false));
  }, []);

  const BADGES = { 'Saver':'🌱', 'Hero':'🦸', 'Hunger Warrior':'⚔️' };

  const trustColor = t => t >= 70 ? 'var(--green)' : t >= 40 ? 'var(--amber)' : 'var(--red)';

  return (
    <div className="page-wrapper">
      {/* Welcome */}
      <div className="welcome-row">
        <div>
          <div className="page-title">Hey, {user?.name?.split(' ')[0]} 👋</div>
          <p className="page-sub">Here's what's happening on FoodBridge today.</p>
        </div>
        {user?.role === 'donor' && (
          <Link to="/post-food" className="btn btn-primary">➕ Donate Food</Link>
        )}
      </div>

      {/* User profile mini */}
      <div className="card profile-card">
        <div className="profile-left">
          <div className="profile-avatar">{user?.name?.[0]}</div>
          <div>
            <div className="profile-name">{user?.name}</div>
            <div className="profile-role">{user?.role} {user?.isVerified ? '✅ Verified' : ''}</div>
          </div>
        </div>
        <div className="profile-stats">
          <div className="p-stat">
            <div className="p-stat-val" style={{ color: trustColor(user?.trustScore) }}>
              {user?.trustScore}
            </div>
            <div className="p-stat-label">Trust Score</div>
          </div>
          <div className="p-stat">
            <div className="p-stat-val" style={{ color:'var(--green)' }}>{user?.mealsSaved}</div>
            <div className="p-stat-label">Meals Saved</div>
          </div>
          <div className="p-stat">
            <div className="p-stat-val">{user?.successfulPickups}</div>
            <div className="p-stat-label">Pickups</div>
          </div>
        </div>
        {user?.badges?.length > 0 && (
          <div className="profile-badges">
            {user.badges.map(b => (
              <span key={b} className="badge badge-green">{BADGES[b]} {b}</span>
            ))}
          </div>
        )}
      </div>

      {/* Global Stats */}
      {loading ? <div className="spinner" /> : (
        <>
          <div className="stats-row">
            {[
              { label:'Total Posts',    value: stats?.total,     icon:'📦', color:'var(--blue)'  },
              { label:'Available',      value: stats?.available, icon:'✅', color:'var(--green)' },
              { label:'Picked Up',      value: stats?.pickedUp,  icon:'🚐', color:'var(--purple)'},
              { label:'Meals Saved',    value: stats?.mealsSaved,icon:'🍽️', color:'var(--amber)' },
            ].map(s => (
              <div key={s.label} className="stat-box">
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-val" style={{ color: s.color }}>{s.value?.toLocaleString() ?? '—'}</div>
                <div className="stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Recent Posts */}
          <div className="section-row">
            <h2 className="section-title">Recent Donations</h2>
            <Link to="/food" className="btn btn-outline btn-sm">View All →</Link>
          </div>
          <div className="recent-grid">
            {recentPosts.map(p => <MiniPostCard key={p._id} post={p} />)}
          </div>
        </>
      )}
    </div>
  );
};

const STATUS_COLOR = { available:'var(--green)', assigned:'var(--amber)', picked_up:'var(--blue)', expired:'var(--red)', cancelled:'var(--muted)' };

const MiniPostCard = ({ post }) => (
  <Link to={`/food/${post._id}`} className="mini-card">
    <div className="mini-top">
      <span className="mini-title">{post.title}</span>
      <span className="badge" style={{ background:'#1a2e1a', color: STATUS_COLOR[post.status] }}>
        {post.status}
      </span>
    </div>
    <div className="mini-meta">
      <span>🍱 {post.foodType}</span>
      <span>🍽️ ~{post.quantity?.estimatedServings} meals</span>
      <span className={`freshness-${post.freshnessStatus}`}>
        {post.freshnessStatus === 'safe' ? '✅' : post.freshnessStatus === 'warning' ? '⚠️' : '🚫'} {post.freshnessStatus}
      </span>
    </div>
    {post.isEmergency && <span className="badge badge-red mt-1">🚨 Emergency</span>}
  </Link>
);

export default Dashboard;
