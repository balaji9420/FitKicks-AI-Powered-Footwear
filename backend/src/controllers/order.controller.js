const Order = require("../models/Order.model")
const Product = require("../models/product.model")

exports.createOrder = async (req, res) => {
  try {

    const {
      items,
      shippingAddress,
      paymentMethod,
      shippingCost = 0,
      taxAmount = 0
    } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No order items"
      })
    }

    const formattedItems = []

    for (const item of items) {

      const product = await Product.findById(
        item.product?._id || item.product
      )

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found"
        })
      }


      formattedItems.push({
        product: product._id,
        name: product.name,
        image: product.images?.[0]?.url || "",
        price: product.price,
        size: item.size || "Default",
        color: item.color || "Black",
        quantity: item.quantity || 1,
        subtotal: product.price * item.quantity
      })
    }
    const subtotal = formattedItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    )

    const totalAmount = subtotal + shippingCost + taxAmount
    const order = await Order.create({
      user: req.user._id,
      items: formattedItems,
      shippingAddress,
      paymentMethod,
      subtotal,
      shippingCost,
      taxAmount,
      totalAmount,
      paymentStatus:
        paymentMethod === "cod" ? "pending" : "paid"
    })

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: {
        order
      }
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      success: false,
      message: error.message
    })

  }
}

exports.getMyOrders = async (req, res) => {
  res.json({ success: true, orders: [] })
}

exports.getAllOrders = async (req, res) => {
  res.json({ success: true, orders: [] })
}

exports.getOrder = async (req, res) => {
  res.json({ success: true })
}

exports.cancelOrder = async (req, res) => {
  res.json({ success: true })
}

exports.requestReturn = async (req, res) => {
  res.json({ success: true })
}

exports.updateOrderStatus = async (req, res) => {
  res.json({ success: true })
}