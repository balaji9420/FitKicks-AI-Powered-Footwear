require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");

const { connectDB } = require("./config/database");
const { logger } = require("./utils/logger");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(mongoSanitize());
app.use(cors({ origin: [process.env.CLIENT_URL, "http://localhost:5173"], credentials: true, methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type", "Authorization", "x-refresh-token", "x-session-id"] }));

const globalLimiter = rateLimit({ windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, max: parseInt(process.env.RATE_LIMIT_MAX) || 100, message: { success: false, message: "Too many requests" } });
const authLimiter = rateLimit({ windowMs: 900000, max: 10, message: { success: false, message: "Too many auth attempts" } });
const aiLimiter = rateLimit({ windowMs: 60000, max: 5, message: { success: false, message: "AI limit reached" } });

app.use("/api/", globalLimiter);
app.use("/api/v1/auth", authLimiter);
app.use("/api/v1/ai", aiLimiter);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(compression());
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ status: "healthy", service: "FitKicks API", version: "1.0.0", timestamp: new Date().toISOString() }));

const API = "/api/v1";
app.use(`${API}/auth`, require("./routes/auth.routes"));
app.use(`${API}/users`, require("./routes/user.routes"));
app.use(`${API}/products`, require("./routes/product.routes"));
app.use(`${API}/categories`, require("./routes/category.routes"));
app.use(`${API}/brands`, require("./routes/brand.routes"));
app.use(`${API}/cart`, require("./routes/cart.routes"));
app.use(`${API}/wishlist`, require("./routes/wishlist.routes"));
app.use(`${API}/orders`, require("./routes/order.routes"));
app.use(`${API}/reviews`, require("./routes/review.routes"));
app.use(`${API}/coupons`, require("./routes/coupon.routes"));
app.use(`${API}/payments`, require("./routes/payment.routes"));
app.use(`${API}/ai`, require("./routes/ai.routes"));
app.use(`${API}/admin`, require("./routes/admin.routes"));
app.use(`${API}/upload`, require("./routes/upload.routes"));
app.use(`${API}/notifications`, require("./routes/notification.routes"));
app.use(`${API}/analytics`, require("./routes/analytics.routes"));

app.use("*", (req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));
app.use(errorHandler);

const startServer = async () => {
  try {
    console.log("Starting FitKicks Backend...");
    console.log("Connecting MongoDB...");

    await connectDB();

    console.log("MongoDB Connected Successfully");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
  }
};

startServer();

process.on("SIGTERM", async () => {
  logger.info("Shutting down...");
  await mongoose.connection.close();
  process.exit(0);
});

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled rejection:", err);
  process.exit(1);
});

module.exports = app;
