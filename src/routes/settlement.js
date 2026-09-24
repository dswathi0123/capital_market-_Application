// src/routes/settlement.js
//
// Read-only view over orders that have reached clearing or beyond —
// backs the "Clearing & Settlement" screen.

const express = require("express");
const store = require("../data/store");
const { OrderStatus } = require("../models/Order");

const router = express.Router();

router.get("/", (req, res) => {
  const relevant = [
    OrderStatus.CLEARING,
    OrderStatus.SETTLED,
    OrderStatus.FAILED,
  ];
  const queue = store
    .getAllOrders()
    .filter((o) => relevant.includes(o.status))
    .map((o) => ({
      id: o.id,
      counterparty: o.counterparty,
      symbol: o.symbol,
      netValue: o.price * o.quantity,
      settlementDate: o.settlementDate,
      progress: o.settlementProgress || 0,
      status: o.status,
    }));

  res.json(queue);
});

module.exports = router;
