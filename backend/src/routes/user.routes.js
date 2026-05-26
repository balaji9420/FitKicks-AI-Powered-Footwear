const express = require("express");
const r = express.Router();
const { protect, adminOnly } = require("../middlewares/auth.middleware");
const { asyncHandler, AppError } = require("../utils/helpers");
const User = require("../models/User.model");

r.get("/profile", protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: { user: user.toSafeObject() } });
}));

r.put("/profile", protect, asyncHandler(async (req, res) => {
  const allowed = ["firstName","lastName","phone","gender","dateOfBirth","preferredSize","shoePreferences"];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, data: { user: user.toSafeObject() } });
}));

r.post("/addresses", protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.isDefault) user.addresses.forEach(a => a.isDefault = false);
  user.addresses.push(req.body);
  await user.save();
  res.status(201).json({ success: true, data: { addresses: user.addresses } });
}));

r.put("/addresses/:addressId", protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const addr = user.addresses.id(req.params.addressId);
  if (!addr) throw new AppError("Address not found", 404);
  if (req.body.isDefault) user.addresses.forEach(a => a.isDefault = false);
  Object.assign(addr, req.body);
  await user.save();
  res.json({ success: true, data: { addresses: user.addresses } });
}));

r.delete("/addresses/:addressId", protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses.pull(req.params.addressId);
  await user.save();
  res.json({ success: true, message: "Address deleted" });
}));

r.get("/admin/users", protect, adminOnly, asyncHandler(async (req, res) => {
  const { page=1, limit=20, search, isActive } = req.query;
  const q = {};
  if (isActive !== undefined) q.isActive = isActive === "true";
  if (search) q.$or = [{ firstName: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
  const [users, total] = await Promise.all([
    User.find(q).sort({ createdAt: -1 }).skip((page-1)*limit).limit(+limit).lean(),
    User.countDocuments(q),
  ]);
  res.json({ success: true, data: { users, pagination: { total, page: +page, pages: Math.ceil(total/limit) } } });
}));

r.patch("/admin/:id/toggle-status", protect, adminOnly, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError("User not found", 404);
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, message: `User ${user.isActive ? "activated" : "deactivated"}` });
}));

module.exports = r;
