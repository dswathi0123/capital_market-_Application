// src/models/Order.js
//
// Defines the shape of an order and the finite set of states it can be
// in. Keeping the status list in one place means every service and the
// frontend agree on the same vocabulary.

const OrderStatus = Object.freeze({
  PENDING_VALIDATION: "PENDING_VALIDATION",
  REJECTED: "REJECTED",
  VALIDATED: "VALIDATED",
  ROUTED: "ROUTED",
  PARTIALLY_FILLED: "PARTIALLY_FILLED",
  FILLED: "FILLED",
  CONFIRMED: "CONFIRMED",
  CLEARING: "CLEARING",
  SETTLED: "SETTLED",
  FAILED: "FAILED",
});

// The "happy path" the lifecycle engine walks an order through.
// (PARTIALLY_FILLED can loop back into itself before reaching FILLED —
// handled in the lifecycle service, not encoded here.)
const HAPPY_PATH = [
  OrderStatus.PENDING_VALIDATION,
  OrderStatus.VALIDATED,
  OrderStatus.ROUTED,
  OrderStatus.FILLED,
  OrderStatus.CONFIRMED,
  OrderStatus.CLEARING,
  OrderStatus.SETTLED,
];

/**
 * Builds a new order record from the fields the client submits.
 * @param {{clientAccount:string, symbol:string, side:string, quantity:number, price:number, orderType:string}} input
 */
function newOrder(input) {
  return {
    clientAccount: input.clientAccount,
    symbol: input.symbol,
    side: input.side,           // "BUY" | "SELL"
    quantity: Number(input.quantity),
    filledQuantity: 0,
    price: Number(input.price),
    orderType: input.orderType || "LIMIT",
    status: OrderStatus.PENDING_VALIDATION,
    createdAt: Date.now(),
    history: [
      { status: OrderStatus.PENDING_VALIDATION, at: Date.now(), note: "Order submitted" },
    ],
  };
}

module.exports = { OrderStatus, HAPPY_PATH, newOrder };
