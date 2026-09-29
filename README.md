# 🌿 FoodBridge — AI-Powered Smart Food Rescue Platform

## Project Structure
```
foodbridge/
├── backend/                  # Node.js + Express API
│   ├── config/db.js          # MongoDB connection
│   ├── controllers/          # Business logic
│   │   ├── authController.js # Register, login, profile
│   │   └── foodController.js # CRUD, matching, stats
│   ├── middleware/auth.js    # JWT protect + role guard
│   ├── models/
│   │   ├── User.js           # User + trust score + badges
│   │   └── FoodPost.js       # Food post + freshness logic
│   ├── routes/               # auth, food, users
│   ├── server.js             # Express entry point
│   └── .env.example          # Copy to .env and fill in
│
└── frontend/                 # React app
    └── src/
        ├── context/AuthContext.js  # Global auth state
        ├── styles/global.css       # Design tokens + utilities
        ├── components/layout/      # Navbar
        └── pages/
            ├── Login.js        # Sign in
            ├── Register.js     # Sign up with role select
            ├── Dashboard.js    # Stats + recent posts
            ├── FoodList.js     # Browse + filter posts
            └── PostFood.js     # Donate food form + live freshness
```

---

## 🚀 Setup Instructions

### 1. Backend

```bash
cd backend
cp .env.example .env
# Fill in MONGO_URI and JWT_SECRET in .env

npm install
mkdir uploads        # for image uploads
npm run dev          # starts on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm start            # starts on http://localhost:3000
```

> The frontend proxies `/api/*` to `http://localhost:5000` (set in package.json)

---

## 🌐 API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login → JWT token |
| GET  | `/api/auth/me` | Get current user |
| PUT  | `/api/auth/updateprofile` | Update name/phone |

### Food Posts
| Method | Route | Description |
|--------|-------|-------------|
| GET  | `/api/food` | List posts (filter: status, foodType, priority) |
| GET  | `/api/food/stats/summary` | Global stats |
| GET  | `/api/food/:id` | Single post |
| POST | `/api/food` | Create post (donor only) |
| PUT  | `/api/food/:id` | Update post |
| DELETE | `/api/food/:id` | Delete post |
| GET  | `/api/food/:id/nearby-ngos` | Ranked NGOs by distance + trust |
| PUT  | `/api/food/:id/assign/:ngoId` | Assign NGO |
| PUT  | `/api/food/:id/pickup` | Confirm pickup |

---

## 🔑 User Roles
- **donor** — Can post food, view dashboard
- **ngo** — Can browse posts, confirm pickups
- **volunteer** — Can confirm pickups
- **admin** — Full access

## 📊 Trust Score Formula
- +10 per successful pickup
- -5 per failed pickup
- +5 for account verification
- ≥3 failed pickups → account restricted

## 🏆 Badges
- 🌱 **Saver** — 10+ meals saved
- 🦸 **Hero** — 100+ meals saved
- ⚔️ **Hunger Warrior** — 500+ meals saved

---

## ✅ Week 1 — DONE
- [x] Backend scaffold (Express + MongoDB)
- [x] User model (roles, trust score, badges)
- [x] FoodPost model (freshness, priority, servings calc)
- [x] JWT authentication (register, login, protect)
- [x] Food CRUD API + smart matching endpoints
- [x] React frontend scaffold
- [x] Auth Context (global state)
- [x] Login + Register pages
- [x] Dashboard (stats + recent posts)
- [x] Food listing with filters
- [x] Post Food form with live freshness timer

## 🔜 Week 2 — Next
- [ ] Google Maps integration
- [ ] Interactive heatmap
- [ ] Pickup workflow UI
- [ ] NGO dashboard view
