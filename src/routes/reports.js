// src/routes/reports.js
//
// Stage 8: Reporting — a single summary endpoint the dashboard polls.

const express = require("express");
const { getSummary } = require("../services/reportingService");

const router = express.Router();

router.get("/summary", (req, res) => {
  res.json(getSummary());
});

module.exports = router;
