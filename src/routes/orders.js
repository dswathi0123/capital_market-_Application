// src/routes/orders.js
//
// REST endpoints for stage 1 (Order Entry) and for reading back order
// state as it progresses through the rest of the lifecycle.

const express = require("express");
const store = require("../data/store");
const { newOrder } = require("../models/Order");
const { startLifecycle } = require("../services/orderLifecycle");

const router = express.Router();

// GET /api/orders  — today's blotter
router.get("/", (req, res) => {
  res.json(store.getAllOrders());
});

// GET /api/orders/:id — single order with full history
router.get("/:id", (req, res) => {
  const order = store.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

// POST /api/orders — stage 1: order entry
router.post("/", (req, res) => {
  const { clientAccount, symbol, side, quantity, price, orderType } = req.body;

  if (!clientAccount || !symbol || !side || !quantity || !price) {
    return res.status(400).json({ error: "Missing required order fields" });
  }
  if (!["BUY", "SELL"].includes(side)) {
    return res.status(400).json({ error: "side must be BUY or SELL" });
  }

  const order = store.createOrder(
    newOrder({ clientAccount, symbol, side, quantity, price, orderType })
  );

  startLifecycle(order.id); // async — moves through validation -> ... -> settlement
  res.status(201).json(order);
});

module.exports = router;
