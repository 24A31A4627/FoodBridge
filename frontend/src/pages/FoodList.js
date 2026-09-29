import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './FoodList.css';

const TYPES = ['all','rice','curry','bread','snacks','fruits','vegetables','sweets','beverages','other'];
const STATUS_OPTIONS = ['all','available','assigned','picked_up','expired'];
const STATUS_COLOR = { available:'badge-green', assigned:'badge-amber', picked_up:'badge-blue', expired:'badge-red', cancelled:'badge-red' };
const FRESHNESS_COLOR = { safe:'var(--green)', warning:'var(--amber)', unsafe:'var(--red)' };

const FoodList = () => {
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status:'available', foodType:'all', priority:'all' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const LIMIT = 9;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: LIMIT });
    if (filters.status   !== 'all') params.set('status',   filters.status);
    if (filters.foodType !== 'all') params.set('foodType', filters.foodType);
    if (filters.priority !== 'all') params.set('priority', filters.priority);

    axios.get(`/api/food?${params}`).then(({ data }) => {
      setPosts(data.posts);
      setTotal(data.total);
    }).finally(() => setLoading(false));
  }, [filters, page]);

  const setFilter = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };

  return (
    <div className="page-wrapper">
      <div className="page-title">🍱 Food Posts</div>
      <p className="page-sub">Browse available food donations near you</p>

      {/* Filters */}
      <div className="filter-bar">
        <div className="filter-group">
          <label className="filter-label">Status</label>
          <div className="filter-chips">
            {STATUS_OPTIONS.map(s => (
              <button key={s}
                className={`chip ${filters.status === s ? 'active' : ''}`}
                onClick={() => setFilter('status', s)}>
                {s === 'all' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <label className="filter-label">Type</label>
          <div className="filter-chips">
            {TYPES.map(t => (
              <button key={t}
                className={`chip ${filters.foodType === t ? 'active' : ''}`}
                onClick={() => setFilter('foodType', t)}>
                {t === 'all' ? 'All' : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? <div className="spinner" /> : (
        <>
          <div className="food-count">{total} post{total !== 1 ? 's' : ''} found</div>
          {posts.length === 0
            ? <div className="empty-state">😔 No food posts found for these filters</div>
            : (
              <div className="food-grid">
                {posts.map(p => <FoodCard key={p._id} post={p} />)}
              </div>
            )
          }

          {/* Pagination */}
          {total > LIMIT && (
            <div className="pagination">
              <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p-1)}>← Prev</button>
              <span className="page-info">Page {page} of {Math.ceil(total / LIMIT)}</span>
              <button className="btn btn-outline btn-sm" disabled={page >= Math.ceil(total/LIMIT)} onClick={() => setPage(p => p+1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const FoodCard = ({ post }) => {
  const timeAgo = (d) => {
    const diff = (Date.now() - new Date(d)) / 60000;
    if (diff < 60)   return `${Math.round(diff)}m ago`;
    if (diff < 1440) return `${Math.round(diff/60)}h ago`;
    return `${Math.round(diff/1440)}d ago`;
  };

  return (
    <Link to={`/food/${post._id}`} className="food-card">
      {post.images?.[0] && (
        <div className="food-card-img" style={{ backgroundImage:`url(${post.images[0]})` }}>
          {post.isEmergency && <span className="emergency-tag">🚨 EMERGENCY</span>}
        </div>
      )}
      {!post.images?.[0] && post.isEmergency && (
        <div className="food-card-img food-card-img-placeholder">
          <span className="emergency-tag">🚨 EMERGENCY</span>
          <span style={{fontSize:48}}>🍱</span>
        </div>
      )}
      <div className="food-card-body">
        <div className="food-card-top">
          <h3 className="food-card-title">{post.title}</h3>
          <span className={`badge ${STATUS_COLOR[post.status] || ''}`}>{post.status?.replace('_',' ')}</span>
        </div>
        <div className="food-card-meta">
          <span>🍽️ {post.foodType}</span>
          <span>👥 ~{post.quantity?.estimatedServings} meals</span>
          <span>{post.isVegetarian ? '🌿 Veg' : '🍗 Non-veg'}</span>
        </div>
        <div className="food-card-freshness">
          <div className="freshness-dot" style={{ background: FRESHNESS_COLOR[post.freshnessStatus] }} />
          <span style={{ color: FRESHNESS_COLOR[post.freshnessStatus], fontSize:12 }}>
            {post.freshnessStatus}
          </span>
          <span className="food-card-time">{timeAgo(post.createdAt)}</span>
        </div>
        {post.donor && (
          <div className="food-card-donor">
            By {post.donor.name}
            {post.donor.isVerified && ' ✅'}
            <span className="trust-pill" style={{
              color: post.donor.trustScore >= 70 ? 'var(--green)' : post.donor.trustScore >= 40 ? 'var(--amber)' : 'var(--red)'
            }}>
              ★ {post.donor.trustScore}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default FoodList;
