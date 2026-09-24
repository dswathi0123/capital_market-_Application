// server.js
//
// Application entry point. Wires up middleware, mounts the route
// modules under /api/*, and serves the static frontend from /public.

const express = require("express");
const cors = require("cors");
const path = require("path");

const ordersRouter = require("./src/routes/orders");
const settlementRouter = require("./src/routes/settlement");
const reportsRouter = require("./src/routes/reports");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/orders", ordersRouter);
app.use("/api/settlement", settlementRouter);
app.use("/api/reports", reportsRouter);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`ETMS server running at http://localhost:${PORT}`);
});
