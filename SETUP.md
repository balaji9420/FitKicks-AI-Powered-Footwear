# FitKicks – Quick Setup Guide

## Prerequisites
- Node.js 18+
- MongoDB Atlas account (free)
- Cloudinary account (free)

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
# Edit .env and fill in your values (MongoDB, Cloudinary, email, etc.)
```

For MongoDB Atlas, create a cluster, add a database user under **Database Access**, and allow your development IP under **Network Access**. Copy the cluster connection string and set `MONGODB_URI` in `backend/.env`:

```env
MONGODB_URI=mongodb+srv://<database-user>:<database-password>@<cluster-host>/fitkicks?retryWrites=true&w=majority&appName=FitKicks
```

Use the database user's credentials, not your Atlas website login. URL-encode special characters in the database password, then restart the backend. Never commit `.env` or paste its connection string into chat.

### Frontend
```bash
cd frontend
cp .env.example .env
# The relative /api/v1 URL uses Vite's proxy to reach the port configured in backend/.env.
```

---

## Step 3: Run Development

### Import the provided shoe catalog

Run once after configuring the backend database:

```bash
npm --prefix backend run import:catalog
```

This imports 44 shoes and their image galleries. The supplied image files are placeholders; replace files in `shoes-data/shoes-data/images/` with shoe photos you are authorized to use, keeping the existing filenames. The catalog starts with zero stock, so update inventory before accepting orders.

After signing in as an admin, open **Inventory**, select the edit-stock button for a shoe, enter the actual quantities for each color and size, and save. Products become purchasable only for variants with stock above zero.

```bash
# From fitkicks/ root:
npm run dev
```

This starts:
- **Backend** on http://localhost:5000
- **Frontend** on http://localhost:5173

Health check: http://localhost:5000/health

If the website opens but API requests or login fail, check the backend terminal and
open the health endpoint at the configured backend port. The backend must connect
to MongoDB before it starts listening; replace the MongoDB placeholders in
`backend/.env` with a valid Atlas URI. Keep `.env` files private and never paste
their values into chat.

## AI Style Matching

AI Style Match runs locally and does not require an OpenAI API key or Google ADK.
The browser extracts a coarse color palette from the chosen image without
uploading the image. Shoppers choose style, occasion, and fit preference; the
backend retrieves relevant catalog details and ranks every in-stock shoe.
Authenticated users can rate the suggestions; future rankings adapt to this
feedback and to cart/purchase interactions. This is lightweight preference
learning, not training a neural network. Style reviews are generated from catalog
facts and are not represented as customer reviews.

## Deploy without a terminal

FitKicks is a React/Vite frontend with an Express API; it is not a Streamlit app.
The deployment files in this repository target Vercel (frontend) and Render
(backend). Deploying requires a GitHub repository connected to both services.

1. In GitHub, create or open the repository and use **Add file → Upload files**
   to upload the project files. Do not upload `.env` files, `node_modules`,
   `dist`, or files containing credentials. Include the backend catalog-import
   script and only product data/images you have permission to publish.
2. In Render, choose **New → Blueprint**, select the GitHub repository, and
   apply its root `render.yaml`. Set the prompted secret values in the Render
   dashboard: `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`,
   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
   `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`, and `CLIENT_URL`.
   Generate two different strong JWT secrets. Set `CLIENT_URL` to the final
   Vercel site origin (for example, `https://your-site.vercel.app`).
3. Wait for the Render service to finish deploying. Its public API URL is shown
   in the Render dashboard; verify `<API-URL>/health` returns a healthy status.
4. In Vercel, choose **Add New → Project**, import the same GitHub repository,
   and set **Root Directory** to `frontend`. Keep the build command `npm run
   build` and output directory `dist`.
5. In the Vercel project settings, add the build environment variable
   `VITE_API_URL` with the full Render API URL ending in `/api/v1`, for example
   `https://your-api.onrender.com/api/v1`. Redeploy after saving the variable.
6. Copy the final Vercel site origin into Render's `CLIENT_URL` setting, then
   redeploy the API. This allows browser requests and password-reset links to
   use the production website.

The public site will not have products until its MongoDB database is populated.
The current local demo inventory and local user accounts are not copied to
MongoDB Atlas. Import the authorized shoe catalog into the production database
and enter verified stock counts before enabling sales. Configure email delivery
before expecting registration verification or password-reset email to work.
Razorpay credentials are only needed if enabling online payments.

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
