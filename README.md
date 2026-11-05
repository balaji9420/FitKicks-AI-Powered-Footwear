# 👟 FitKicks — AI-Powered Footwear Shopping Platform

> A full-stack footwear storefront and admin dashboard with local AI style matching,
> catalog recommendations, and a source-grounded support assistant.

![FitKicks Banner](https://img.shields.io/badge/FitKicks-AI--Powered%20Footwear-FF6B35?style=for-the-badge&logo=data:image/svg+xml;base64,)

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-Build-646CFF?logo=vite)](https://vite.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)](https://mongodb.com)

---

## ✨ Key Features

### 🤖 AI Style Match (Core Feature)
- Outfit colors are extracted in the browser; style, occasion, and fit are user-selected
- Local RAG retrieves catalog evidence and ranks every in-stock matching shoe
- Transparent match scores and direct catalog-based style reviews (not fabricated buyer reviews)
- Hybrid ranking combines catalog relevance with similar-shoppers' cart/purchase patterns
- Optional per-user ranking adapts to helpfulness feedback, cart additions, and purchases
- Runs without OpenAI credits or sending outfit images to an external AI service
- Premium / mid / budget tier filtering
- Recommendation history & feedback loop
- Store assistant retrieves product and published store information and shows its sources
- Assistant declines questions it cannot answer from the available information

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
├── frontend/               # React storefront, account pages, and admin dashboard
│   └── src/
│       ├── components/     # Shared product, layout, and support chat components
│       ├── layouts/
│       ├── pages/          # Customer, authentication, and admin pages
│       └── redux/
├── backend/
│   └── src/
│       ├── config/          # DB, Cloudinary configuration
│       ├── controllers/     # Auth, Product, Order, AI, Cart...
│       ├── middlewares/     # Auth, Error Handler, Validation
│       ├── models/          # 15+ Mongoose models
│       ├── routes/          # RESTful API routes
│       ├── services/        # AI service, Email service
│       └── utils/           # Logger, Helpers
├── app.py                  # Streamlit storefront, recommendations, support, and admin
├── requirements.txt        # Streamlit runtime dependencies
└── shoes-data/             # Local catalog and product images
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB to enable live catalog, sign-in, and personalized recommendations
- Python 3.9+ for the Streamlit app

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/fitkicks.git
cd fitkicks

# Install the React frontend and Node.js API
npm run install:all
```

### 2. Configure Environment

**Backend:**
```bash
# Copy backend/.env.example to backend/.env
# Configure MONGODB_URI and separate JWT secrets.
# Configure SMTP if you want email verification and password reset.
```

The React app uses `/api/v1` through the Vite proxy. The proxy reads the API
port from `backend/.env` (`PORT`); set `VITE_API_URL` only when using a
separately hosted API.

### 3. Run Development

```bash
# Terminal 1 — backend
cd backend
npm run dev

# Terminal 2 — React storefront and admin dashboard
cd frontend
npm run dev
```

Open the React website at `http://localhost:5173`. The API listens on the
`PORT` configured in `backend/.env` (5000 in the example file).

### Streamlit app

```bash
python -m pip install -r requirements.txt
python -m streamlit run app.py
```

The Streamlit app opens at `http://localhost:8501`. It includes the catalog,
local shoe ranking, source-grounded support, and API-backed account/admin pages.
The bag and saved list are session-only. Checkout, payments, and the complete
React customer experience remain in `frontend/`; live login, inventory, and
admin data require a separately hosted API and configured database.

---

## 📡 API Reference

Base URL: `http://localhost:<PORT>/api/v1` (`PORT` is read from `backend/.env`)

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
| POST | `/ai/analyze` | Rank catalog shoes from a locally extracted outfit palette and selected style |
| POST | `/ai/chat` | Retrieve grounded answers from the shoe catalog and store information |
| GET | `/ai/recommendations` | Catalog shoe recommendations |
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

The recommendation flow is local and does not call a paid model:

1. The React app samples the selected outfit image for a coarse color palette; only the palette is sent to the backend.
2. The shopper chooses style, occasion, and fit preference.
3. A BM25-style lexical retriever searches product names, catalog descriptions, materials, tags, and colors.
4. A hybrid ranker combines retrieved evidence, outfit/style fit, ratings, saved preferences, and item-level nearest-neighbor signals from similar shoppers' cart and purchase histories.
5. The API returns every eligible in-stock product with its retrieved catalog evidence and an explicitly labeled catalog-based style review.

The support chat retrieves relevant shoe or store-information passages and displays
the evidence used. It abstains when it cannot retrieve a reliable answer; it does
not send messages to a paid LLM. The hybrid recommender combines catalog retrieval
with similar shoppers' cart/purchase item patterns and the signed-in user's saved
preferences and feedback. These local ranking signals are not neural-network
training or a full ADK integration. No buyer review is invented, and no OpenAI
credits or external vector database are required.

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

### Vercel (React frontend)

Import the repository in Vercel and set the project root to `frontend`. Configure
`VITE_API_URL` to the deployed backend URL ending in `/api/v1`, then deploy. Set
the backend `CLIENT_URL` to the Vercel site origin for account email links and
allow that origin in the backend CORS configuration.

### Render (Backend)

1. Connect GitHub repo to Render
2. Build command: `cd backend && npm install`
3. Start command: `cd backend && npm start`
4. Set all env variables from `.env.example`

### Streamlit Community Cloud

Deploy the GitHub branch containing `app.py` with `app.py` as the app file. Streamlit
Cloud installs the root `requirements.txt`. Add the following under the app's
**Settings → Secrets** only after deploying the Node API on Render:

```toml
FITKICKS_API_URL = "https://your-api.onrender.com/api/v1"
```

The app can display the bundled catalog without the API, but sign-in, email
verification, real stock, and admin data need the hosted API and production
database. Populate the database with the catalog and actual stock counts; the
bundled catalog does not invent inventory. Do not paste credentials into source
control or chat. Streamlit's server-side API requests do not require adding the
Streamlit URL to browser CORS settings.

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
| AI | Local catalog RAG + feedback-adaptive ranking |
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
