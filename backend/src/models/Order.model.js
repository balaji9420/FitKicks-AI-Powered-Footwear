const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: String, image: String,
  price: { type: Number, required: true },
  size: { type: String, required: true }, color: String,
  quantity: { type: Number, required: true, min: 1 },
  sku: String, subtotal: { type: Number, required: true },
}, { _id: true });

const shippingAddressSchema = new mongoose.Schema({
  fullName: String, phone: String, street: String,
  city: String, state: String, pincode: String, country: { type: String, default: "India" }
}, { _id: false });

const trackingEventSchema = new mongoose.Schema({
  status: String, message: String, location: String,
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber:     { type: String, unique: true, required: true },
  user:            { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  items:           [orderItemSchema],
  shippingAddress: shippingAddressSchema,
  subtotal:        { type: Number, required: true },
  shippingCost:    { type: Number, default: 0 },
  taxAmount:       { type: Number, default: 0 },
  taxRate:         { type: Number, default: 0.18 },
  discountAmount:  { type: Number, default: 0 },
  couponDiscount:  { type: Number, default: 0 },
  loyaltyPointsDiscount: { type: Number, default: 0 },
  totalAmount:     { type: Number, required: true },
  couponCode: String, couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
  loyaltyPointsUsed:   { type: Number, default: 0 },
  loyaltyPointsEarned: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["pending","confirmed","processing","packed","shipped","out_for_delivery","delivered","cancelled","return_requested","return_approved","return_picked","refund_initiated","refunded"],
    default: "pending", index: true
  },
  paymentMethod: { type: String, enum: ["cod","stripe","razorpay","wallet"], required: true },
  paymentStatus: { type: String, enum: ["pending","paid","failed","refunded","partially_refunded"], default: "pending" },
  paymentId: String, paymentOrderId: String,
  trackingNumber: String, trackingUrl: String, shippingPartner: String,
  estimatedDelivery: Date, actualDelivery: Date,
  trackingHistory: [trackingEventSchema],
  returnReason: String, returnRequestedAt: Date,
  refundAmount: { type: Number, default: 0 }, refundedAt: Date,
  invoiceNumber: String, invoiceUrl: String,
  notes: String,
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, cancelReason: String,
}, { timestamps: true });

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

orderSchema.pre("validate", async function (next) {
  if (!this.orderNumber) {
    const ts = Date.now().toString(36).toUpperCase();
    const rnd = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    this.orderNumber = `FK-${ts}-${rnd}`;
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
