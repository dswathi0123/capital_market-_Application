// src/services/orderLifecycle.js
//
// Drives an order through stages 1–5 of the workflow:
//   Entry -> Validation -> Routing -> Execution -> Confirmation
// Each stage is simulated with a short delay (standing in for a real
// compliance check, exchange round-trip, etc.) and appends an entry to
// the order's history so the full audit trail is visible.
//
// Stage 6–7 (Clearing, Settlement) live in clearingService.js, which
// this module hands off to once an order is CONFIRMED.

const store = require("../data/store");
const { OrderStatus } = require("../models/Order");
const { sendToClearing } = require("./clearingService");

const DELAY = {
  validate: 400,
  route: 500,
  execute: 900,
  confirm: 300,
};

function appendHistory(order, status, note) {
  order.history.push({ status, at: Date.now(), note });
  order.status = status;
}

/** Kicks off the lifecycle for a freshly created order. Fire-and-forget. */
function startLifecycle(orderId) {
  setTimeout(() => validate(orderId), DELAY.validate);
}

// --- Stage 2: Validation --------------------------------------------
function validate(orderId) {
  const order = store.getOrder(orderId);
  if (!order) return;

  // Simple compliance/limit checks — a real system would call out to a
  // KYC service, position-limit engine, restricted-list checker, etc.
  const breachesLimit = order.quantity > 50000;
  const knownAccount = /^ACC-\d+/.test(order.clientAccount);

  if (breachesLimit || !knownAccount) {
    appendHistory(
      order,
      OrderStatus.REJECTED,
      breachesLimit ? "Rejected: exceeds order size limit" : "Rejected: unrecognized account"
    );
    return;
  }

  appendHistory(order, OrderStatus.VALIDATED, "Passed compliance and limit checks");
  setTimeout(() => route(orderId), DELAY.route);
}

// --- Stage 3: Routing -------------------------------------------------
function route(orderId) {
  const order = store.getOrder(orderId);
  if (!order) return;

  appendHistory(order, OrderStatus.ROUTED, "Routed to exchange via FIX session");
  setTimeout(() => execute(orderId), DELAY.execute);
}

// --- Stage 4: Execution -----------------------------------------------
function execute(orderId) {
  const order = store.getOrder(orderId);
  if (!order) return;

  // Simulate a partial fill ~25% of the time, then complete shortly after.
  const partial = Math.random() < 0.25;
  if (partial) {
    order.filledQuantity = Math.floor(order.quantity * 0.6);
    appendHistory(
      order,
      OrderStatus.PARTIALLY_FILLED,
      `Partial fill: ${order.filledQuantity}/${order.quantity}`
    );
    setTimeout(() => {
      order.filledQuantity = order.quantity;
      appendHistory(order, OrderStatus.FILLED, "Remaining quantity filled");
      setTimeout(() => confirm(orderId), DELAY.confirm);
    }, DELAY.execute);
  } else {
    order.filledQuantity = order.quantity;
    appendHistory(order, OrderStatus.FILLED, "Order fully filled");
    setTimeout(() => confirm(orderId), DELAY.confirm);
  }
}

// --- Stage 5: Confirmation ---------------------------------------------
function confirm(orderId) {
  const order = store.getOrder(orderId);
  if (!order) return;

  appendHistory(order, OrderStatus.CONFIRMED, "Trade confirmed with counterparty");
  sendToClearing(orderId); // hand off to stages 6–7
}

module.exports = { startLifecycle };
