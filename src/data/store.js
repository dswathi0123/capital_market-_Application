// src/data/store.js
//
// A minimal in-memory "database". In a production system this would be
// replaced by a real datastore (e.g. Postgres for orders, Redis for
// low-latency lookups) — but the interface below is intentionally the
// same shape a real repository layer would expose, so swapping the
// implementation later does not require touching the services.

let orders = [];
let nextOrderId = 88231;

const store = {
  // --- orders -------------------------------------------------------
  createOrder(order) {
    const id = `ORD-${nextOrderId++}`;
    const record = { id, ...order };
    orders.push(record);
    return record;
  },

  getOrder(id) {
    return orders.find((o) => o.id === id);
  },

  getAllOrders() {
    // newest first
    return [...orders].sort((a, b) => b.createdAt - a.createdAt);
  },

  updateOrder(id, changes) {
    const order = store.getOrder(id);
    if (!order) return null;
    Object.assign(order, changes);
    return order;
  },

  // --- helpers used by reporting / settlement views ------------------
  getOrdersByStatus(status) {
    return orders.filter((o) => o.status === status);
  },

  reset() {
    orders = [];
    nextOrderId = 88231;
  },
};

module.exports = store;
