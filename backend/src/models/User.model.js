const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const addressSchema = new mongoose.Schema({
  label: { type: String, default: "Home" },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, default: "India" },
  isDefault: { type: Boolean, default: false },
}, { _id: true });

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, minlength: 8, select: false },
  phone:     { type: String, trim: true },
  avatar:    { url: { type: String, default: "" }, publicId: { type: String, default: "" } },
  gender:    { type: String, enum: ["male","female","other","prefer_not_to_say"] },
  role:      { type: String, enum: ["customer","admin"], default: "customer" },
  isActive:  { type: Boolean, default: true },
  isVerified:{ type: Boolean, default: false },
  googleId:  { type: String },
  addresses: [addressSchema],
  emailOTP:           { type: String, select: false },
  emailOTPExpiry:     { type: Date,   select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpiry:{ type: Date,   select: false },
  preferredSize: { type: String },
  shoePreferences: {
    style:  [String],
    brands: [String],
    priceRange: { min: { type: Number, default: 0 }, max: { type: Number, default: 50000 } },
  },
  loyaltyPoints:  { type: Number, default: 0 },
  referralCode:   { type: String, unique: true, sparse: true },
  referredBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  totalOrders:    { type: Number, default: 0 },
  totalSpent:     { type: Number, default: 0 },
  lastLogin:      { type: Date },
}, { timestamps: true });

userSchema.index({ email: 1 });
userSchema.index({ referralCode: 1 });

userSchema.virtual("fullName").get(function () { return `${this.firstName} ${this.lastName}`; });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.pre("save", function (next) {
  if (!this.referralCode) this.referralCode = crypto.randomBytes(4).toString("hex").toUpperCase();
  next();
});

userSchema.methods.comparePassword = async function (pwd) { return bcrypt.compare(pwd, this.password); };

userSchema.methods.generateEmailOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.emailOTP = otp;
  this.emailOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
  return otp;
};

userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");
  this.passwordResetExpiry = new Date(Date.now() + 30 * 60 * 1000);
  return token;
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.password; delete obj.emailOTP; delete obj.emailOTPExpiry;
  delete obj.passwordResetToken; delete obj.passwordResetExpiry;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
