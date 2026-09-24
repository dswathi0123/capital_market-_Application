# ETMS — Equity Trade Management System (sample app)

A runnable, medium-complexity sample implementing the trade lifecycle:
Order Entry → Validation → Routing → Execution → Confirmation → Clearing
→ Settlement → Reporting.

Data is stored in memory (resets on restart) so the project runs with
zero external setup — no database to install.

## Run it

```bash
npm install
npm start
```

Then open **http://localhost:3000**.

## Structure

```
capital-market-app/
├── server.js                  # entry point: middleware, routes, static files
├── src/
│   ├── models/Order.js        # order shape + status enum
│   ├── data/store.js          # in-memory "database"
│   ├── services/
│   │   ├── orderLifecycle.js  # stages 2–5: validate, route, execute, confirm
│   │   ├── clearingService.js # stages 6–7: clearing, settlement
│   │   └── reportingService.js# stage 8: aggregate stats
│   └── routes/
│       ├── orders.js          # POST/GET /api/orders
│       ├── settlement.js      # GET /api/settlement
│       └── reports.js         # GET /api/reports/summary
└── public/                    # frontend (vanilla HTML/CSS/JS)
    ├── index.html
    ├── style.css
    └── app.js
```

## How it maps to the workflow

| Stage | Where it lives |
|---|---|
| 1. Order entry | `POST /api/orders` in `routes/orders.js` |
| 2. Validation | `validate()` in `services/orderLifecycle.js` |
| 3. Routing | `route()` in `services/orderLifecycle.js` |
| 4. Execution | `execute()` in `services/orderLifecycle.js` |
| 5. Confirmation | `confirm()` in `services/orderLifecycle.js` |
| 6. Clearing | `sendToClearing()` in `services/clearingService.js` |
| 7. Settlement | `settle()` in `services/clearingService.js` |
| 8. Reporting | `getSummary()` in `services/reportingService.js` |

An order created via the API is handed to `startLifecycle()`, which
walks it through every stage asynchronously (short delays simulate
compliance checks, an exchange round-trip, etc.), appending to the
order's `history` array at each step — giving a full audit trail.

## Swapping in real infrastructure

Everything is layered so the in-memory pieces can be replaced without
touching the routes:
- `data/store.js` → swap for a Postgres/MySQL repository
- `services/orderLifecycle.js` → replace simulated delays with real
  FIX/exchange integration
- `services/clearingService.js` → replace with a clearing-house API
  client (e.g. NSCC/DTCC connectivity)
