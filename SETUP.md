# FitKicks – Quick Setup Guide

## Prerequisites
- Node.js 18+
- MongoDB Atlas account (free)
- Cloudinary account (free)
- OpenAI API key (GPT-4 access)

---

## Step 1: Install Dependencies

```bash
# From the fitkicks/ root folder:
npm install          # installs concurrently

cd backend
npm install

cd ../frontend
npm install
```

---

## Step 2: Configure Environment

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env and fill in your values (MongoDB, Cloudinary, OpenAI, etc.)
```

### Frontend
```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api/v1 (default is fine for local dev)
```

---

## Step 3: Run Development

```bash
# From fitkicks/ root:
npm run dev
```

This starts:
- **Backend** on http://localhost:5000
- **Frontend** on http://localhost:5173

Health check: http://localhost:5000/health

---

## Step 4: Test the App

1. Open http://localhost:5173
2. Click **Register** to create an account
3. Verify email with OTP (check terminal for email preview in dev mode)
4. Browse products, try AI Style Match

---

## Folder Structure

```
fitkicks/
├── backend/           Node.js + Express API
│   ├── src/
│   │   ├── config/    Database, Cloudinary
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/    Mongoose schemas
│   │   ├── routes/    API routes
│   │   ├── services/  AI, Email
│   │   └── utils/
│   └── .env.example
├── frontend/          React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── customer/
│   │   │   └── admin/
│   │   ├── redux/slices/
│   │   └── services/
│   └── .env.example
└── package.json       Root with concurrently
```

---

## Common Issues

| Error | Fix |
|-------|-----|
| `CloudinaryStorage is not a constructor` | Check `multer-storage-cloudinary` version. Run `npm install multer-storage-cloudinary@4` in backend |
| `main.jsx not found` | Ensure you're running `npm run dev` from the `frontend/` folder or root |
| White screen | Open browser console (F12) → check for import errors |
| MongoDB connection failed | Check MONGODB_URI in backend/.env, whitelist your IP in Atlas |
| Emails not sending | Use Gmail App Password (not account password) for SMTP_PASS |
