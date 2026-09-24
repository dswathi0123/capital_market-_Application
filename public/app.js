// public/app.js
//
// Small vanilla-JS frontend: handles view switching, submitting new
// orders, and polling the API so the blotter/settlement/reports views
// reflect the lifecycle as it progresses server-side.

const state = { view: "blotter" };

// --- view switching -----------------------------------------------------
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((i) => i.classList.remove("active"));
    item.classList.add("active");
    state.view = item.dataset.view;
    document.querySelectorAll(".view").forEach((v) => (v.hidden = true));
    document.getElementById(`view-${state.view}`).hidden = false;
    document.getElementById("view-title").textContent = {
      blotter: "Equity trade management",
      settlement: "Clearing & settlement",
      reports: "Reports",
    }[state.view];
    refresh();
  });
});

// --- order submission -----------------------------------------------------
const form = document.getElementById("order-form");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const side = e.submitter.dataset.side;
  const data = Object.fromEntries(new FormData(form).entries());
  const errorEl = document.getElementById("form-error");
  errorEl.textContent = "";

  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, side }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || "Failed to submit order");
    form.reset();
    refresh();
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

// --- rendering -----------------------------------------------------
async function renderBlotter() {
  const orders = await fetch("/api/orders").then((r) => r.json());
  document.getElementById("order-count").textContent = `${orders.length} orders`;
  document.getElementById("orders-body").innerHTML = orders
    .map(
      (o) => `
      <tr>
        <td>${o.id}</td>
        <td>${o.clientAccount}</td>
        <td>${o.symbol}</td>
        <td class="side-${o.side}">${o.side === "BUY" ? "Buy" : "Sell"}</td>
        <td>${o.quantity.toLocaleString()}</td>
        <td>${o.price.toFixed(2)}</td>
        <td><span class="status status-${o.status}">${o.status.replace(/_/g, " ")}</span></td>
      </tr>`
    )
    .join("");
}

async function renderSettlement() {
  const queue = await fetch("/api/settlement").then((r) => r.json());
  document.getElementById("settlement-body").innerHTML = queue
    .map(
      (t) => `
      <tr>
        <td>${t.id}</td>
        <td>${t.counterparty || "—"}</td>
        <td>${t.symbol}</td>
        <td>${t.netValue.toLocaleString()}</td>
        <td>${t.settlementDate || "—"}</td>
        <td><div class="progress-bar"><div class="progress-fill" style="width:${t.progress}%"></div></div></td>
        <td><span class="status status-${t.status}">${t.status}</span></td>
      </tr>`
    )
    .join("");
}

async function renderReports() {
  const s = await fetch("/api/reports/summary").then((r) => r.json());
  const stats = [
    ["Total orders", s.totalOrders],
    ["Settled today", s.settledToday],
    ["Pending settlement", s.pendingSettlement],
    ["Exceptions", s.exceptions],
    ["Settlement value", s.settlementValue.toLocaleString()],
    ["Straight-through rate", `${s.straightThroughRate}%`],
  ];
  document.getElementById("stat-row").innerHTML = stats
    .map(([label, value]) => `<div class="stat"><div class="label">${label}</div><div class="value">${value}</div></div>`)
    .join("");
}

function refresh() {
  if (state.view === "blotter") renderBlotter();
  if (state.view === "settlement") renderSettlement();
  if (state.view === "reports") renderReports();
}

refresh();
setInterval(refresh, 1500); // simple polling — a real UI would use websockets
