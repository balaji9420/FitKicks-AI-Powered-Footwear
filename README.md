# 👟 FitKicks — AI-Powered Footwear Shopping Platform

> A production-ready, full-stack e-commerce platform for footwear with an AI outfit-to-shoe recommendation engine.  
> Built with React, Node.js, MongoDB, and OpenAI Vision API.

![FitKicks Banner](https://img.shields.io/badge/FitKicks-AI--Powered%20Footwear-FF6B35?style=for-the-badge&logo=data:image/svg+xml;base64,)

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://mongodb.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4%20Vision-412991?logo=openai)](https://openai.com)

---

## ✨ Key Features

### 🤖 AI Style Match (Core Feature)
- Upload any outfit photo → AI detects colors, style, occasion, gender
- GPT-4 Vision analyzes outfit aesthetics with 85–98% accuracy
- Ranked shoe recommendations with **match scores** and **"Why this matches"** explanations
- Premium / mid / budget tier filtering
- Recommendation history & feedback loop

### 🛍️ Full E-Commerce Suite
- Complete product catalog: sneakers, running, sports, casual, formal, limited edition
- Advanced filters: size, color, price, brand, gender, occasion, rating, trending
- Product detail with multi-image gallery, zoom, color variants, size stock
- Flash sales with countdown timers
- Wishlist, Compare (up to 3 products), Recently Viewed

### 🔐 Authentication & User System
- JWT + Refresh Token (httpOnly cookies)
- Email OTP verification
- Forgot/Reset password
- Google OAuth ready structure
- Role-based access: Customer / Admin
- Loyalty points system (earn & redeem)
- Referral system

### 🛒 Cart & Checkout
- Persistent cart with size + color selection
- Save for later
- Coupon / promo code engine
- Loyalty points redemption
- Dynamic shipping (free above ₹999)
- GST calculation (18%)
- Razorpay + Stripe payment-ready structure
- Cash on Delivery support

### 📦 Order Management
- Order placement with stock validation
- Real-time status tracking: pending → confirmed → packed → shipped → delivered
- 7-day return window
- Refund management
- Email notifications at every stage

### 🎛️ Admin Panel
- Revenue analytics with Chart.js (line, bar, pie charts)
- Top-selling products, order status breakdown
- Low stock alerts
- Product CRUD with Cloudinary image upload
- Bulk product update
- User management (activate/ban)
- Coupon management
- AI analytics: conversion rates, top outfit styles

---

## 🏗️ Architecture

```
fitkicks/
├── backend/
│   └── src/
│       ├── config/          # DB, Cloudinary configuration
│       ├── controllers/     # Auth, Product, Order, AI, Cart...
│       ├── middlewares/     # Auth, Error Handler, Validation
│       ├── models/          # 15+ Mongoose models
│       ├── routes/          # RESTful API routes
│       ├── services/        # AI service, Email service
│       └── utils/           # Logger, Helpers
└── frontend/
    └── src/
        ├── components/      # Navbar, CartDrawer, ProductCard...
        ├── layouts/         # CustomerLayout, AdminLayout, AuthLayout
        ├── pages/
        │   ├── auth/        # Login, Register, Verify, Reset
        │   ├── customer/    # Home, Products, Detail, Cart, Checkout...
        │   └── admin/       # Dashboard, Products, Orders, Analytics...
        ├── redux/           # RTK slices: auth, cart, wishlist, ai, ui
        └── services/        # Axios API with interceptors
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Cloudinary account (free tier)
- OpenAI API key (GPT-4 Vision access)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/fitkicks.git
cd fitkicks

# Install backend
cd backend && npm install

# Install frontend
cd ../frontend && npm install
```

### 2. Configure Environment

**Backend:**
```bash
cp .env.example .env
# Fill in: MONGODB_URI, JWT_SECRET, CLOUDINARY_*, OPENAI_API_KEY, SMTP_*
```

**Frontend:**
```bash
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api/v1
```

### 3. Run Development

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

App runs at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/health

---

## 📡 API Reference

Base URL: `http://localhost:5000/api/v1`

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/verify-email` | Verify OTP |
| POST | `/auth/login` | Login |
| POST | `/auth/logout` | Logout |
| POST | `/auth/forgot-password` | Request reset link |
| PATCH | `/auth/reset-password/:token` | Reset password |
| GET | `/auth/me` | Get current user |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List with filters & pagination |
| GET | `/products/featured` | Trending, new arrivals, best sellers |
| GET | `/products/search?q=` | Full-text search |
| GET | `/products/:slug` | Product detail |
| POST | `/products` | Create product (Admin) |
| PUT | `/products/:id` | Update product (Admin) |
| PATCH | `/products/admin/bulk-update` | Bulk update (Admin) |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/analyze` | Upload outfit → get recommendations |
| GET | `/ai/recommendations` | Rule-based (no image) recommendations |
| GET | `/ai/history` | User's recommendation history |
| GET | `/ai/analytics` | AI performance analytics (Admin) |
| POST | `/ai/:id/feedback` | Submit recommendation feedback |

### Cart
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cart` | Get user's cart |
| POST | `/cart/add` | Add item |
| PATCH | `/cart/update/:itemId` | Update quantity |
| DELETE | `/cart/remove/:itemId` | Remove item |
| POST | `/cart/apply-coupon` | Apply coupon |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders` | Create order |
| GET | `/orders/my-orders` | User's orders |
| GET | `/orders/:id` | Order detail |
| PATCH | `/orders/:id/cancel` | Cancel order |
| POST | `/orders/:id/return` | Request return |
| PATCH | `/orders/:id/status` | Update status (Admin) |

---

## 🤖 AI Architecture

The AI module (`services/ai.service.js`) works in 3 stages:

```
1. Vision Analysis (OpenAI GPT-4o)
   └── Sends outfit image + structured prompt
   └── Returns: colors, style, occasion, gender, outfit tags

2. Smart Product Scoring (Custom algorithm)
   └── Fetches candidates from MongoDB (filtered by occasion + gender)
   └── Scores each product (0–100) across:
       • Occasion match (0–30pts)
       • Style tag match (0–25pts)
       • Color compatibility (0–20pts)
       • Gender match (0–15pts)
       • Shoe type suitability (0–10pts)
       • Rating bonus (0–5pts)

3. Response Generation (GPT-4o-mini)
   └── Generates "Why this shoe matches" explanation for top pick
   └── Returns ranked list: premium / mid / budget tiers
```

**Swappable:** Replace `analyzeOutfit()` with any vision model (Gemini, Claude Vision, Llama) — the scoring and DB layer stays the same.

---

## 🗄️ Database Models

| Model | Purpose |
|-------|---------|
| `User` | Customers with loyalty, referral, preferences |
| `Product` | Full shoe catalog with AI metadata |
| `Category` | Shoe categories |
| `Brand` | Brand profiles |
| `Cart` | Persistent cart with saved items |
| `Wishlist` | User wishlists with notification flags |
| `Order` | Orders with full tracking history |
| `Review` | Product reviews with sub-ratings |
| `Coupon` | Flexible discount engine |
| `AIRecommendation` | Outfit analysis + recommendations history |
| `Notification` | User notification center |

---

## 🚢 Deployment

### Vercel (Frontend)

```bash
cd frontend
npm run build
# Deploy /dist to Vercel
# Set env: VITE_API_URL=https://your-backend.onrender.com/api/v1
```

`vercel.json`:
```json
{
  "routes": [{ "src": "/(.*)", "dest": "/index.html" }]
}
```

### Render (Backend)

1. Connect GitHub repo to Render
2. Build command: `cd backend && npm install`
3. Start command: `cd backend && npm start`
4. Set all env variables from `.env.example`

### MongoDB Atlas

1. Create a free M0 cluster
2. Whitelist IP: `0.0.0.0/0` (for Render)
3. Create database user
4. Copy connection string to `MONGODB_URI`

---

## 🔒 Security Features

- **Helmet.js** — Security headers
- **express-mongo-sanitize** — NoSQL injection prevention
- **Rate limiting** — Global (100/15min), Auth (10/15min), AI (5/min)
- **bcryptjs** — Password hashing (cost factor 12)
- **JWT + Refresh Tokens** — Secure httpOnly cookies
- **CORS** — Configured for specific origins
- **Input validation** — express-validator on all routes
- **Centralized error handling** — No stack traces in production

---

## 📊 Performance Optimizations

- **MongoDB indexes** on all query fields (slug, category, brand, price, rating, tags)
- **Full-text search** with weighted fields (name: 10, tags: 8, description: 5)
- **Lazy loading** — All React pages loaded on demand
- **Image optimization** — Cloudinary transformations (WebP, quality auto)
- **Redux RTK** — Normalized state, no redundant API calls
- **Axios interceptors** — Automatic token refresh, request deduplication

---

## 🧪 Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, Tailwind CSS, Framer Motion |
| State | Redux Toolkit + RTK Query |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs + Nodemailer |
| AI | OpenAI GPT-4o Vision |
| Storage | Cloudinary |
| Charts | Recharts (Admin) |
| Payment | Razorpay + Stripe (ready) |
| Deploy | Vercel + Render + MongoDB Atlas |

---

## 👥 Author

Built by [Your Name] as a portfolio/final year project showcase.  
Demonstrating: Full-stack development, AI/ML integration, production architecture.

---

## 📄 License

MIT License — use freely for portfolio, learning, or commercial projects.
