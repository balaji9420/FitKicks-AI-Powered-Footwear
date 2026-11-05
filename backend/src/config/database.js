
const mongoose = require("mongoose");
const { logger } = require("../utils/logger");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI?.trim();

    if (!mongoUri || !/^mongodb(\+srv)?:\/\//.test(mongoUri)) {
      throw new Error("MONGODB_URI must start with mongodb:// or mongodb+srv://.");
    }
    if (mongoUri.includes("MONGODB_URI=") || /<[^>]+>/.test(mongoUri)) {
      throw new Error("MONGODB_URI still contains a copied placeholder or repeated key. Replace the whole line with the real Atlas driver URI.");
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
    });

    logger.info(
      `MongoDB Connected: ${conn.connection.host}`
    );

    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

  } catch (error) {
    logger.error(
      "MongoDB connection failed:",
      error.message
    );

    throw error;
  }
};

module.exports = { connectDB };
