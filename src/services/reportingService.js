// src/services/reportingService.js
//
// Stage 8: Reporting. Aggregates the current order book into the
// summary numbers a dashboard or regulator feed would need. Pure
// function of the store's current state — no side effects.

const store = require("../data/store");
const { OrderStatus } = require("../models/Order");

function getSummary() {
  const all = store.getAllOrders();

  const settled = all.filter((o) => o.status === OrderStatus.SETTLED);
  const pending = all.filter((o) =>
    [OrderStatus.CLEARING, OrderStatus.CONFIRMED].includes(o.status)
  );
  const failed = all.filter((o) => o.status === OrderStatus.FAILED);

  const settlementValue = settled.reduce((sum, o) => sum + o.price * o.quantity, 0);

  return {
    totalOrders: all.length,
    settledToday: settled.length,
    pendingSettlement: pending.length,
    exceptions: failed.length,
    settlementValue: Math.round(settlementValue),
    straightThroughRate: all.length
      ? Math.round((settled.length / all.length) * 1000) / 10
      : 0,
  };
}

module.exports = { getSummary };
