# FitKicks – Quick Setup Guide

## Prerequisites
- Node.js 18+
- MongoDB (required for live catalog and account features)
- Python 3.9+ for the Streamlit app

---

## Step 1: Install Dependencies

```bash
# From the fitkicks/ root folder:
npm run install:all
```

For Streamlit, also run `python -m pip install -r requirements.txt`.

---

## Step 2: Configure Environment

### Backend
```bash
cd backend
# Copy .env.example to .env, then edit .env
# Edit .env and fill in your values (MongoDB, Cloudinary, email, etc.)
```

For MongoDB Atlas, create a cluster, add a database user under **Database Access**, and allow your development IP under **Network Access**. Copy the cluster connection string and set `MONGODB_URI` in `backend/.env`:

```env
MONGODB_URI=mongodb+srv://<database-user>:<database-password>@<cluster-host>/fitkicks?retryWrites=true&w=majority&appName=FitKicks
```

Use the database user's credentials, not your Atlas website login. URL-encode special characters in the database password, then restart the backend. Never commit `.env` or paste its connection string into chat.

The React app uses `/api/v1` through the Vite development proxy. The proxy reads
the API port from `backend/.env` (`PORT`, 5000 in the example). Set `VITE_API_URL`
only when using a separately hosted API. Streamlit reads `FITKICKS_API_URL`
from its environment or Streamlit Cloud Secrets; the value must end in `/api/v1`.

---

## Step 3: Run Development

### Import the provided shoe catalog

Run once after configuring the backend database:

```bash
npm --prefix backend run import:catalog
```

This imports 44 shoes and their image galleries. The supplied image files are placeholders; replace files in `shoes-data/shoes-data/images/` with shoe photos you are authorized to use, keeping the existing filenames. The catalog starts with zero stock, so update inventory before accepting orders.

After signing in as an admin, open **Inventory**, select the edit-stock button for a shoe, enter the actual quantities for each color and size, and save. Products become purchasable only for variants with stock above zero.

Start the backend in one terminal after configuring MongoDB:

```bash
cd backend
npm run dev
```

In another terminal, start the React frontend:

```bash
cd frontend
npm run dev
```

Open the React website at http://localhost:5173. The backend listens on the
`PORT` configured in `backend/.env`.

Health check: http://localhost:5000/health (change the port if `PORT` differs).

If live products or sign-in are unavailable, check the backend terminal and open
the health endpoint at the configured backend port. The backend must connect to
MongoDB before it starts listening.

### Streamlit app

From the project root, run `python -m streamlit run app.py`; the app opens at
http://localhost:8501. It includes a session-only bag and saved list, local
catalog ranking, source-grounded support, and API-backed account/admin pages.
Checkout, payment, and the complete customer storefront remain in React. Login,
email verification, live inventory, and admin data require a separately hosted
Node API connected to a production database.

## AI Style Matching

AI Style Match does not require an OpenAI API key. The React app extracts a
coarse color palette in the browser and sends only that palette to the backend.
The backend retrieves catalog evidence and ranks in-stock shoes using style,
occasion, color, quality, and available shopper-feedback signals. The support
chat retrieves catalog or published store information, shows its sources, and
abstains when it cannot find relevant evidence. It does not send questions or
outfit images to a paid AI service. The hybrid recommender combines catalog
relevance with similar shoppers' cart and purchase patterns and the signed-in
shopper's saved preferences and feedback. Authenticated feedback can adjust future
rankings; this is lightweight preference learning, not neural-network training.
Style reviews are based on catalog facts and are not customer reviews. Google
ADK is not integrated in this local, no-paid-service configuration.

## Deploy without a terminal

The React website can be deployed to Vercel and the Node API to Render. Deploying
requires a GitHub repository connected to those services.

1. In GitHub, create or open the repository and use **Add file → Upload files**
   to upload the project files. Do not upload `.env` files, `node_modules`,
   `dist`, or files containing credentials. Include the backend catalog-import
   script and only product data/images you have permission to publish.
2. In Render, choose **New → Blueprint**, select the GitHub repository, and
   apply its root `render.yaml`. Set the prompted secret values in the Render
   dashboard: `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`,
   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
   `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`, and `CLIENT_URL`.
   Generate two different strong JWT secrets. Set `CLIENT_URL` to the frontend
   origin for password-reset links.
3. Wait for the Render service to finish deploying. Its public API URL is shown
   in the Render dashboard; verify `<API-URL>/health` returns a healthy status.
4. In Vercel, import the repository, set the project root to `frontend`, and set
   `VITE_API_URL` to the Render API URL ending in `/api/v1`, for example
   `https://your-api.onrender.com/api/v1`. Set Render's `CLIENT_URL` to the
   deployed Vercel origin.

To deploy on Streamlit Community Cloud, select the GitHub branch containing
`app.py` and set `app.py` as the app file. Cloud installs the root `requirements.txt`.
In the deployed app's **Settings → Secrets**, set:

```toml
FITKICKS_API_URL = "https://your-api.onrender.com/api/v1"
```

Deploy the Render API and populate its MongoDB database before expecting account
features or live products. Add production secrets in the hosting dashboards,
never in source files or chat. The bundled catalog is only an offline fallback
and does not include invented stock.

The public site will not have products until its MongoDB database is populated.
The current local demo inventory and local user accounts are not copied to
MongoDB Atlas. Import the authorized shoe catalog into the production database
and enter verified stock counts before enabling sales. Configure email delivery
before expecting registration verification or password-reset email to work.
Razorpay credentials are only needed if enabling online payments.

---

## Step 4: Test the App

1. Open http://localhost:5173
2. Click **Sign up** to create an account
3. Verify email with OTP (check terminal for email preview in dev mode)
4. Browse products, try AI Style Match, and ask the support assistant a catalog question

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
