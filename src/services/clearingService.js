// src/services/clearingService.js
//
// Stages 6–7 of the workflow: Clearing and Settlement. In real life this
// is where the order leaves the firm's own systems and becomes a
// clearing-house-netted, T+1/T+2 obligation. Here it's simulated with
// timers, but the shape (progress %, counterparty, settlement date)
// mirrors what a clearing/settlement screen would actually show.

const store = require("../data/store");
const { OrderStatus } = require("../models/Order");

const CLEARING_DELAY = 700;
const SETTLEMENT_DELAY = 1200;
const FAILURE_RATE = 0.05; // simulates the occasional settlement exception

function sendToClearing(orderId) {
  const order = store.getOrder(orderId);
  if (!order) return;

  order.status = OrderStatus.CLEARING;
  order.counterparty = "NSCC";
  order.settlementDate = addBusinessDay(new Date());
  order.settlementProgress = 20;
  order.history.push({ status: OrderStatus.CLEARING, at: Date.now(), note: "Sent to clearing house (NSCC)" });

  const progressTimer = setInterval(() => {
    if (!store.getOrder(orderId)) return clearInterval(progressTimer);
    order.settlementProgress = Math.min(order.settlementProgress + 25, 90);
  }, CLEARING_DELAY / 3);

  setTimeout(() => {
    clearInterval(progressTimer);
    settle(orderId);
  }, SETTLEMENT_DELAY);
}

function settle(orderId) {
  const order = store.getOrder(orderId);
  if (!order) return;

  const failed = Math.random() < FAILURE_RATE;
  if (failed) {
    order.status = OrderStatus.FAILED;
    order.settlementProgress = 25;
    order.history.push({ status: OrderStatus.FAILED, at: Date.now(), note: "Settlement exception — manual review required" });
    return;
  }

  order.status = OrderStatus.SETTLED;
  order.settlementProgress = 100;
  order.history.push({ status: OrderStatus.SETTLED, at: Date.now(), note: "Securities and funds exchanged" });
}

function addBusinessDay(date) {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  if (d.getDay() === 6) d.setDate(d.getDate() + 2); // Sat -> Mon
  if (d.getDay() === 0) d.setDate(d.getDate() + 1); // Sun -> Mon
  return d.toISOString().slice(0, 10);
}

module.exports = { sendToClearing };
