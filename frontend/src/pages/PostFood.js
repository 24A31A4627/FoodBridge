import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './PostFood.css';

const FOOD_TYPES = ['rice','curry','bread','snacks','fruits','vegetables','sweets','beverages','other'];
const SAFE_HOURS = { rice:6, curry:5, bread:8, snacks:12, fruits:24, vegetables:12, sweets:10, beverages:6, other:6 };
const SERVINGS   = { rice:40, curry:35, bread:20, snacks:15, fruits:25, vegetables:30, sweets:20, beverages:10, other:20 };

const PostFood = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({
    title:'', description:'', foodType:'rice', vessels:1, unit:'vessels',
    cookedAt: new Date(Date.now() - 60*60*1000).toISOString().slice(0,16), // 1hr ago default
    lat:'', lng:'', address:'', isEmergency:false, isVegetarian:true,
  });

  // Derived freshness
  const [freshness, setFreshness] = useState({ status:'safe', remaining:0, score:100, servings:40 });

  useEffect(() => {
    const safeHrs = SAFE_HOURS[form.foodType] || 6;
    const cooked  = new Date(form.cookedAt);
    const elapsed = (Date.now() - cooked.getTime()) / 3600000;
    const remaining = safeHrs - elapsed;
    const score = Math.max(0, Math.round((remaining / safeHrs) * 100));
    const servings = (SERVINGS[form.foodType] || 20) * Number(form.vessels);
    let status = 'safe';
    if (remaining <= 0)              status = 'unsafe';
    else if (remaining <= safeHrs * 0.25) status = 'warning';
    setFreshness({ status, remaining: Math.max(0, remaining), score, servings });
  }, [form.foodType, form.cookedAt, form.vessels]);

  // Auto-locate
  const getLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(
      pos => setForm(f => ({ ...f, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) })),
      ()  => toast.error('Could not get location')
    );
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImages = e => setImages([...e.target.files].slice(0, 4));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.lat || !form.lng) return toast.error('Please provide location');
    if (freshness.status === 'unsafe') return toast.error('Cannot post unsafe food');

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(img => fd.append('images', img));

      await axios.post('/api/food', fd, { headers:{ 'Content-Type':'multipart/form-data' } });
      toast.success('Food posted successfully! 🍱');
      navigate('/food');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = { safe:'var(--green)', warning:'var(--amber)', unsafe:'var(--red)' };
  const statusIcon  = { safe:'✅', warning:'⚠️', unsafe:'🚫' };

  return (
    <div className="page-wrapper">
      <div className="page-title">🍱 Donate Food</div>
      <p className="page-sub">Post your surplus food so NGOs can pick it up quickly</p>

      <form onSubmit={handleSubmit} className="post-layout">
        {/* LEFT COLUMN */}
        <div>
          <div className="card">
            <h3 className="section-heading">Food Details</h3>

            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-control" name="title" placeholder="e.g. Wedding Biryani (3 vessels)"
                value={form.title} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" name="description" rows={3}
                placeholder="Any details about the food, allergies, packaging..."
                value={form.description} onChange={handleChange} />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Food Type *</label>
                <select className="form-control" name="foodType" value={form.foodType} onChange={handleChange}>
                  {FOOD_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Quantity (vessels) *</label>
                <input className="form-control" type="number" name="vessels" min="1"
                  value={form.vessels} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Cooked At *</label>
              <input className="form-control" type="datetime-local" name="cookedAt"
                value={form.cookedAt} onChange={handleChange} required />
            </div>

            <div className="check-row">
              <label className="check-label">
                <input type="checkbox" name="isVegetarian" checked={form.isVegetarian} onChange={handleChange} />
                <span>🌿 Vegetarian</span>
              </label>
              <label className="check-label">
                <input type="checkbox" name="isEmergency" checked={form.isEmergency} onChange={handleChange} />
                <span>🚨 Emergency (urgent pickup)</span>
              </label>
            </div>
          </div>

          {/* IMAGES */}
          <div className="card mt-2">
            <h3 className="section-heading">📸 Photos</h3>
            <div className="image-drop">
              <input type="file" id="img-input" accept="image/*" multiple onChange={handleImages} style={{display:'none'}} />
              <label htmlFor="img-input" className="img-label">
                {images.length > 0
                  ? <>{images.length} image{images.length > 1 ? 's' : ''} selected ✅</>
                  : <>Click to upload photos (max 4)<br/><span style={{fontSize:12,color:'var(--muted)'}}>Helps NGOs verify food quickly</span></>
                }
              </label>
            </div>
            {images.length > 0 && (
              <div className="img-preview-row">
                {[...images].map((f,i) => (
                  <div key={i} className="img-thumb" style={{backgroundImage:`url(${URL.createObjectURL(f)})`}} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* Freshness Preview */}
          <div className="card freshness-card" style={{ borderColor: statusColor[freshness.status] }}>
            <h3 className="section-heading">🌡️ Freshness Preview</h3>
            <div className="freshness-big">
              <div className="freshness-icon">{statusIcon[freshness.status]}</div>
              <div>
                <div className="freshness-label" style={{ color: statusColor[freshness.status] }}>
                  {freshness.status.toUpperCase()}
                </div>
                <div className="freshness-time">
                  {freshness.remaining > 0
                    ? `${freshness.remaining.toFixed(1)}h remaining`
                    : 'Expired'}
                </div>
              </div>
            </div>

            <div className="score-bar-wrap">
              <div className="score-bar">
                <div className="score-fill" style={{
                  width: `${freshness.score}%`,
                  background: statusColor[freshness.status]
                }} />
              </div>
              <span className="score-text">{freshness.score}/100</span>
            </div>

            <div className="freshness-stat">
              <span>🍽️ Estimated servings</span>
              <strong style={{color:'var(--green)'}}>{freshness.servings}</strong>
            </div>
            <div className="freshness-stat">
              <span>⏱ Safe window</span>
              <strong>{SAFE_HOURS[form.foodType]}h for {form.foodType}</strong>
            </div>

            {freshness.status === 'unsafe' && (
              <div className="freshness-warn">🚫 This food is past its safe window and cannot be posted.</div>
            )}
          </div>

          {/* Location */}
          <div className="card mt-2">
            <h3 className="section-heading">📍 Pickup Location</h3>
            <button type="button" className="btn btn-outline" style={{width:'100%', marginBottom:12}} onClick={getLocation}>
              📡 Use My Current Location
            </button>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input className="form-control" name="lat" placeholder="e.g. 17.3850"
                  value={form.lat} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input className="form-control" name="lng" placeholder="e.g. 78.4867"
                  value={form.lng} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-control" name="address" placeholder="Street, Area, City"
                value={form.address} onChange={handleChange} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary mt-2"
            style={{ width:'100%', padding:'14px' }}
            disabled={loading || freshness.status === 'unsafe'}
          >
            {loading ? 'Posting...' : '🚀 Post Food Donation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostFood;
