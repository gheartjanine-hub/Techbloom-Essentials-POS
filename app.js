// ─────────────────────────────────────────────────────────────────────────────
// TechBloom Essentials – POS Front-end (Phase 1 · Frontend-only preview)
//
// What works:    Demo welcome screen (not authentication), dashboard overview, product search, cart,
//                quantity adjustments, discounts, subtotal/total calculation,
//                payment method selection, cash-change preview, demo checkout,
//                receipt modal, print receipt, inventory view, sales history,
//                chart placeholder, settings (store name, threshold).
//
// Requires backend (Phase 2):
//   – Real authentication / password hashing
//   – Persistent inventory, sales & user data across devices/sessions
//   – Multi-user access control
//   – Real-time stock management
// ─────────────────────────────────────────────────────────────────────────────

"use strict";

// ── Initial data ─────────────────────────────────────────────────────────────
const initialProducts = [
  { id: 1, name: "Mini USB Fan",              price: 50, stock: null, icon: "\u2733" },
  { id: 2, name: "Sweet Night Sugar Perfume", price: 70, stock: null, icon: "\u2667" },
  { id: 3, name: "Venom Perfume",             price: 60, stock: null, icon: "\u25C8" },
];

// ── Application state ─────────────────────────────────────────────────────────
const state = {
  page: "dashboard",
  demoModeOpen: false,
  products: initialProducts,
  cart: new Map(),       // Map<productId, quantity>
  discount: 0,
  transactions: [],
  settings: { storeName: "TechBloom Essentials", currency: "PHP", threshold: 5 },
  salesFilter: "",
  salesPayment: "all",
  inventoryQuery: "",
  posQuery: "",
  reportRange: "7",
  reportTab: "overview",
};

// ── Utilities ─────────────────────────────────────────────────────────────────
const currencyFormat = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: state.settings.currency,
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[char]));

const $ = (selector) => document.querySelector(selector);
const PAGE_NAMES = {
  dashboard: "Dashboard",
  pos:       "Point of Sale",
  inventory: "Inventory",
  sales:     "Sales History",
  reports:   "Reports",
  settings:  "Settings",
};

// ── Navigation ────────────────────────────────────────────────────────────────
function setPage(page) {
  if (!state.demoModeOpen || !PAGE_NAMES[page]) return;
  state.page = page;
  document.querySelectorAll(".nav-link[data-page]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });
  $("#current-section").textContent = PAGE_NAMES[page];
  closeSidebar();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openSidebar() {
  $("#sidebar").classList.add("open");
  $("#mobile-menu").setAttribute("aria-expanded", "true");
  $("#mobile-nav-backdrop").classList.add("visible");
}

function closeSidebar() {
  $("#sidebar").classList.remove("open");
  $("#mobile-menu").setAttribute("aria-expanded", "false");
  $("#mobile-nav-backdrop").classList.remove("visible");
}

// ── Page heading helper ───────────────────────────────────────────────────────
function pageHeading(title, subtitle, action = "") {
  return `<div class="page-heading"><div><p class="eyebrow">TECHBLOOM ESSENTIALS</p><h1>${escapeHtml(title)}</h1><p class="page-subtitle">${escapeHtml(subtitle)}</p></div>${action ? `<div class="heading-actions">${action}</div>` : ""}</div>`;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function renderDashboard() {
  const sessionSales = thisSessionSales();
  const txCount = state.transactions.length;
  const lowCount = lowStockProducts().length;
  const unknownCount = unknownStockCount();

  return `${pageHeading("Good day, welcome back", "Here is your store overview. Business figures are blank until real records are connected.", `<button class="button button-primary" data-go="pos">＋ New sale</button>`)}
    <div class="notice"><span aria-hidden="true">✦</span><span><strong>Demo preview:</strong> No real sales, transactions, or stock quantities are loaded. Figures below only include activity entered during this browser session.</span></div>
    <section class="metric-grid section-gap">
      <article class="metric-card"><div class="metric-top"><span>Today's sales</span><span class="metric-icon" aria-hidden="true">₱</span></div><div class="metric-value">${currencyFormat(sessionSales)}</div><div class="metric-caption">${txCount ? "Demo session total · not a real sale" : "No sales recorded in this demo"}</div></article>
      <article class="metric-card"><div class="metric-top"><span>Transactions</span><span class="metric-icon" aria-hidden="true">↗</span></div><div class="metric-value">${txCount}</div><div class="metric-caption">Demo checkout count · this session</div></article>
      <article class="metric-card"><div class="metric-top"><span>Products</span><span class="metric-icon" aria-hidden="true">▤</span></div><div class="metric-value">${state.products.length}</div><div class="metric-caption">Prototype catalog · not synced</div></article>
      <article class="metric-card"><div class="metric-top"><span>Low-stock alerts</span><span class="metric-icon" aria-hidden="true">⌁</span></div><div class="metric-value">${lowCount}</div><div class="metric-caption">${unknownCount ? `${unknownCount} product stock${unknownCount === 1 ? "" : "s"} not entered` : `Threshold: ${state.settings.threshold} units`}</div></article>
    </section>
    <div class="dashboard-grid">
      <section class="panel"><div class="panel-heading"><div><h2>Recent transactions</h2><p>Latest activity from this demo session</p></div><button class="text-button" data-go="sales">View history →</button></div>${state.transactions.length ? transactionTable(state.transactions.slice(0, 5), false) : `<div class="empty-state"><span class="empty-icon" aria-hidden="true">↗</span><strong>No transactions yet</strong><p>Completed demo checkouts will appear here. They are not saved after this page is closed.</p></div>`}</section>
      <section class="panel"><div class="panel-heading"><div><h2>Quick actions</h2><p>Common store tasks</p></div></div><div class="quick-actions"><button class="quick-action" data-go="pos"><i aria-hidden="true">＋</i><span>New sale<small>Open point of sale</small></span></button><button class="quick-action" data-go="inventory"><i aria-hidden="true">▤</i><span>Inventory<small>View your catalog</small></span></button><button class="quick-action" data-go="inventory" data-add-product><i aria-hidden="true">⌑</i><span>Add product<small>Update your catalog</small></span></button><button class="quick-action" data-go="reports"><i aria-hidden="true">▥</i><span>View reports<small>Sales overview</small></span></button></div></section>
    </div>`;
}

// ── POS ───────────────────────────────────────────────────────────────────────
function renderPos() {
  const products = state.products.filter((p) =>
    p.name.toLowerCase().includes(state.posQuery.toLowerCase())
  );
  const subtotal = cartSubtotal();
  const discount = cartDiscount(subtotal);
  const total    = Math.max(0, subtotal - discount);

  return `${pageHeading("Point of Sale", "Build a demo cart and preview the checkout experience.", `<span class="demo-pill"><i aria-hidden="true"></i> DEMO CHECKOUT ONLY</span>`)}
    <div class="pos-layout">
      <section class="pos-panel">
        <div class="pos-products-head"><h2>Products</h2><span class="muted-count">${products.length} item${products.length === 1 ? "" : "s"}</span></div>
        <div class="search-field pos-search"><span class="search-icon" aria-hidden="true">⌕</span><input class="search-input" id="pos-search" type="search" placeholder="Search products…" value="${escapeHtml(state.posQuery)}" autocomplete="off" aria-label="Search products"></div>
        <div class="pos-product-grid">${products.length ? products.map((p) => productCard(p)).join("") : `<div class="table-empty">No products match your search.</div>`}</div>
      </section>
      <section class="pos-panel cart-panel">
        <div class="cart-title"><h2>Current order</h2><span class="cart-count" aria-label="${cartItemCount()} items in cart">${cartItemCount()}</span></div>
        <div class="cart-lines" aria-live="polite" aria-label="Cart items">${renderCartLines()}</div>
        <div class="cart-totals">
          <div class="total-line"><span>Subtotal</span><span id="cart-subtotal">${currencyFormat(subtotal)}</span></div>
          <div class="total-line"><label for="discount-input">Discount</label><label class="discount-entry">₱<input type="number" id="discount-input" min="0" max="${subtotal}" step="0.01" value="${state.cart.size ? state.discount || 0 : 0}" aria-label="Discount amount in pesos"></label></div>
          <div class="total-line total-final"><span>Total</span><strong id="cart-total">${currencyFormat(total)}</strong></div>
        </div>
        <div class="cart-fields">
          <div class="form-field"><label class="field-label" for="payment-method">Payment method</label><select class="select-field" id="payment-method"><option>Cash</option><option>GCash</option><option>Card</option></select></div>
          <div class="form-field" id="cash-field"><label class="field-label" for="cash-received">Cash received</label><input class="field" id="cash-received" type="number" min="0" step="0.01" placeholder="Enter amount received"><p class="form-help" id="change-preview">Change: ${currencyFormat(0)}</p></div>
        </div>
        <button class="button button-primary cart-checkout" id="checkout-button" ${state.cart.size ? "" : "disabled"} aria-disabled="${state.cart.size ? "false" : "true"}">Complete demo checkout · <span id="checkout-total">${currencyFormat(total)}</span></button>
        <p class="form-help" style="text-align:center;margin-top:9px">Checkout is a preview only. No transaction is saved to a server.</p>
      </section>
    </div>`;
}

// ── Cart helpers ──────────────────────────────────────────────────────────────
function cartSubtotal() {
  return [...state.cart.entries()].reduce((sum, [id, qty]) => {
    const product = state.products.find((p) => p.id === id);
    return sum + (product ? product.price * qty : 0);
  }, 0);
}
function cartDiscount(subtotal) {
  return Math.min(Math.max(0, Number(state.discount) || 0), subtotal);
}
function cartItemCount() {
  return [...state.cart.values()].reduce((sum, qty) => sum + qty, 0);
}
function renderCartLines() {
  if (!state.cart.size) {
    return `<div class="cart-empty"><span aria-hidden="true">▣</span>Your cart is empty<br>Choose a product to begin.</div>`;
  }
  return [...state.cart.entries()].map(([id, qty]) => {
    const product = state.products.find((p) => p.id === id);
    if (!product) return "";
    return `<div class="cart-row"><div><div class="cart-row-name">${escapeHtml(product.name)}</div><div class="cart-row-sub">${currencyFormat(product.price)} each</div></div><div class="cart-row-price">${currencyFormat(product.price * qty)}</div><div class="qty-control"><button data-qty="${id}" data-delta="-1" aria-label="Decrease ${escapeHtml(product.name)} quantity">−</button><span aria-label="Quantity">${qty}</span><button data-qty="${id}" data-delta="1" aria-label="Increase ${escapeHtml(product.name)} quantity">+</button></div><span></span></div>`;
  }).join("");
}

// ── Inventory ─────────────────────────────────────────────────────────────────
function renderInventory() {
  const filtered = state.products.filter((p) =>
    p.name.toLowerCase().includes(state.inventoryQuery.toLowerCase())
  );
  const addButton = `<button class="button button-primary" id="show-add-product">＋ Add product</button>`;
  return `${pageHeading("Inventory", "Manage your product catalog and keep an eye on stock.", addButton)}
    <div class="notice"><span aria-hidden="true">✦</span><span><strong>Demo catalog:</strong> Stock levels are not provided for the initial products and are shown as "Not set." Only enter quantities you want to preview. Data is not saved when the page is closed.</span></div>
    <section class="inventory-summary section-gap"><div class="small-stat"><span>Total products</span><strong>${state.products.length}</strong></div><div class="small-stat"><span>Low-stock items</span><strong>${lowStockProducts().length}</strong></div><div class="small-stat"><span>Stock not entered</span><strong>${unknownStockCount()}</strong></div></section>
    <section class="panel section-gap">
      <div class="table-actions"><div><h2 style="margin:0 0 4px;font:700 13px Manrope,sans-serif">Product list</h2><span class="muted-count">Catalog preview · ${filtered.length} shown</span></div><div class="search-field"><span class="search-icon" aria-hidden="true">⌕</span><input class="search-input" id="inventory-search" type="search" placeholder="Search inventory…" value="${escapeHtml(state.inventoryQuery)}" autocomplete="off" aria-label="Search inventory"></div></div>
      <div class="table-wrap"><table><thead><tr><th>Product</th><th>Selling price</th><th>Stock qty</th><th>Status</th></tr></thead><tbody>${filtered.length ? filtered.map((p) => `<tr><td><div class="inventory-name"><span class="mini-art" aria-hidden="true">${escapeHtml(p.icon)}</span><strong>${escapeHtml(p.name)}</strong></div></td><td><strong>${currencyFormat(p.price)}</strong></td><td>${p.stock === null ? "Not set" : p.stock}</td><td>${stockBadge(p)}</td></tr>`).join("") : `<tr><td colspan="4" class="table-empty">No products match your search.</td></tr>`}</tbody></table></div>
    </section>
    <section class="panel section-gap hidden" id="add-product-panel">
      <div class="panel-heading"><div><h2>Add a product</h2><p>Added items exist only in this browser session — not saved to a server.</p></div><button class="text-button" id="hide-add-product">Close</button></div>
      <form class="settings-form" id="add-product-form" novalidate>
        <div class="form-field"><label class="field-label" for="new-name">Product name</label><input class="field" id="new-name" name="name" required maxlength="80" placeholder="Enter product name"></div>
        <div class="form-field"><label class="field-label" for="new-price">Selling price (₱)</label><input class="field" id="new-price" name="price" required type="number" min="0.01" step="0.01" placeholder="0.00"></div>
        <div class="form-field"><label class="field-label" for="new-stock">Stock quantity (optional)</label><input class="field" id="new-stock" name="stock" type="number" min="0" step="1" placeholder="Leave blank if unknown"></div>
        <button class="button button-primary" type="submit">Add to demo catalog</button>
      </form>
    </section>`;
}

function stockBadge(product) {
  if (product.stock === null) return `<span class="stock-badge">Not entered</span>`;
  return product.stock <= state.settings.threshold
    ? `<span class="stock-badge low">● Low stock</span>`
    : `<span class="stock-badge ok">● In stock</span>`;
}

// ── Product card ──────────────────────────────────────────────────────────────
function productCard(product) {
  return `<article class="product-card"><div class="product-art"><span aria-hidden="true">${escapeHtml(product.icon)}</span></div><div class="product-info"><h3>${escapeHtml(product.name)}</h3><p>${product.stock === null ? "Stock not entered" : `${product.stock} in stock`}</p><div class="product-bottom"><span class="product-price">${currencyFormat(product.price)}</span><button class="add-to-cart" data-add-cart="${product.id}" aria-label="Add ${escapeHtml(product.name)} to cart">+</button></div></div></article>`;
}

// ── Transaction table ─────────────────────────────────────────────────────────
function transactionTable(transactions, showCustomer = true) {
  return `<div class="table-wrap"><table><thead><tr><th>Invoice</th><th>Date / time</th>${showCustomer ? "<th>Customer</th>" : ""}<th>Total</th><th>Payment</th><th></th></tr></thead><tbody>${transactions.map((tx) => `<tr><td><strong>${escapeHtml(tx.invoice)}</strong></td><td>${escapeHtml(tx.date)}</td>${showCustomer ? `<td>${escapeHtml(tx.customer)}</td>` : ""}<td><strong>${currencyFormat(tx.total)}</strong></td><td>${escapeHtml(tx.payment)}</td><td><button class="text-button" data-view-transaction="${escapeHtml(tx.invoice)}">View receipt</button></td></tr>`).join("")}</tbody></table></div>`;
}

// ── Sales history ─────────────────────────────────────────────────────────────
function renderSales() {
  const query = state.salesFilter.toLowerCase();
  const filtered = state.transactions.filter(
    (tx) =>
      `${tx.invoice} ${tx.customer} ${tx.date} ${tx.payment}`.toLowerCase().includes(query) &&
      (state.salesPayment === "all" || tx.payment.toLowerCase() === state.salesPayment.toLowerCase())
  );
  return `${pageHeading("Sales History", "Review demo checkouts created during this browser session.")}
    <div class="notice"><span aria-hidden="true">✦</span><span><strong>Demo records only:</strong> No imported sales or customer records are shown. Transactions disappear when the page is closed. A backend is required to save data across sessions.</span></div>
    <section class="panel section-gap">
      <div class="table-actions"><div><h2 style="margin:0 0 4px;font:700 13px Manrope,sans-serif">Transactions</h2><span class="muted-count">${filtered.length} demo record${filtered.length === 1 ? "" : "s"}</span></div><div class="filter-row"><div class="search-field"><span class="search-icon" aria-hidden="true">⌕</span><input class="search-input" id="sales-search" type="search" placeholder="Search invoice or date…" value="${escapeHtml(state.salesFilter)}" autocomplete="off" aria-label="Search sales"></div><select class="select-field" id="sales-payment" aria-label="Filter by payment method"><option value="all">All payments</option><option value="cash">Cash</option><option value="gcash">GCash</option><option value="card">Card</option></select></div></div>
      ${filtered.length ? transactionTable(filtered) : `<div class="empty-state"><span class="empty-icon" aria-hidden="true">↗</span><strong>No demo transactions found</strong><p>${state.transactions.length ? "Try a different search or payment filter." : "Complete a demo checkout in Point of Sale to preview this table."}</p></div>`}
    </section>`;
}

// ── Reports ───────────────────────────────────────────────────────────────────
function renderReports() {
  const labels =
    state.reportRange === "7"  ? ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] :
    state.reportRange === "30" ? ["Wk 1","Wk 2","Wk 3","Wk 4"] :
                                  ["Jan","Feb","Mar","Apr","May","Jun"];
  const noSales = state.transactions.length === 0;
  const placeholder = [24, 39, 30, 53, 35, 64, 46];

  return `${pageHeading("Reports", "A visual preview of sales reporting. No external data is connected.")}
    <div class="notice"><span aria-hidden="true">✦</span><span><strong>Demo report:</strong> Chart bars are placeholders, not measured sales. The summary updates only with demo checkouts made during this session. Real reporting requires a backend.</span></div>
    <section class="panel section-gap">
      <div class="panel-heading"><div><h2>Sales overview</h2><p>${noSales ? "No business records loaded" : "Demo checkout activity · this browser session"}</p></div><div class="filter-row"><select class="select-field" id="report-range" aria-label="Report time range"><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="6">Last 6 months</option></select></div></div>
      <div class="tabs"><button class="tab ${state.reportTab === "overview" ? "active" : ""}" data-report-tab="overview">Overview</button><button class="tab ${state.reportTab === "transactions" ? "active" : ""}" data-report-tab="transactions">Transactions</button></div>
      <div class="chart-card"><div class="chart-placeholder" aria-hidden="true">${labels.map((label, i) => `<div class="chart-column"><div class="chart-bar" style="height:${noSales ? placeholder[i % 7] : Math.max(9, Math.min(82, state.transactions.length * 12 + i * 7))}%"></div><span>${label}</span></div>`).join("")}</div><div class="chart-empty-label"><span>${noSales ? "Placeholder chart · not actual sales" : "Demo checkouts only"}</span><span>${state.reportRange === "7" ? "7 days" : state.reportRange === "30" ? "30 days" : "6 months"}</span></div></div>
      ${state.reportTab === "overview"
        ? `<div class="report-stats"><div class="report-stat"><span>Total sales ${noSales ? "(no records)" : "(demo)"}</span><strong>${currencyFormat(thisSessionSales())}</strong></div><div class="report-stat"><span>Transactions ${noSales ? "(no records)" : "(demo)"}</span><strong>${state.transactions.length}</strong></div><div class="report-stat"><span>Average order value</span><strong>${currencyFormat(state.transactions.length ? thisSessionSales() / state.transactions.length : 0)}</strong></div></div>`
        : state.transactions.length
          ? `<div class="section-gap">${transactionTable(state.transactions)}</div>`
          : `<div class="empty-state"><strong>No demo transaction details</strong><p>Completed demo checkouts will show here for this session.</p></div>`}
    </section>`;
}

// ── Settings ──────────────────────────────────────────────────────────────────
function renderSettings() {
  return `${pageHeading("Settings", "Configure store details for this frontend preview.")}
    <div class="settings-layout">
      <section class="settings-card"><h2>Store preferences</h2><p>Changes apply to this page preview only and are not saved to a server or business system.</p>
        <form class="settings-form" id="settings-form" novalidate>
          <div class="form-field"><label class="field-label" for="store-name">Store name</label><input class="field" id="store-name" name="storeName" value="${escapeHtml(state.settings.storeName)}" required maxlength="80"></div>
          <div class="form-field"><label class="field-label" for="currency">Currency</label><select class="select-field" id="currency" name="currency"><option value="PHP">PHP — Philippine Peso (₱)</option></select><p class="form-help">Currency shown throughout this prototype.</p></div>
          <div class="form-field"><label class="field-label" for="threshold">Low-stock threshold</label><input class="field" id="threshold" name="threshold" type="number" min="0" step="1" value="${state.settings.threshold}" required><p class="form-help">Products at or below this quantity show a low-stock alert. Unknown stock is not treated as low.</p></div>
          <button class="button button-primary" type="submit">Save preview settings</button>
        </form>
      </section>
      <aside class="settings-card"><h2>Store preview</h2><p>This label updates when you save your store name.</p>
        <div class="setting-preview"><img class="brand-logo-small" src="Techbloom%20Essential%20Logo.jpg" alt="TechBloom Essentials logo"><span><strong id="preview-store-name">${escapeHtml(state.settings.storeName)}</strong><small>${state.settings.currency} · ₱ Philippine Peso</small></span></div>
        <div class="threshold-tip">Low-stock threshold: <strong id="preview-threshold">${state.settings.threshold} units</strong><br>Stock values not entered remain "Not set."</div>
      </aside>
    </div>`;
}

// ── Render dispatcher ─────────────────────────────────────────────────────────
function render() {
  if (!state.demoModeOpen) return;
  const renderers = {
    dashboard: renderDashboard,
    pos:       renderPos,
    inventory: renderInventory,
    sales:     renderSales,
    reports:   renderReports,
    settings:  renderSettings,
  };
  const main = $("#main-content");
  main.innerHTML = renderers[state.page]();
  // Restore select values that can't be set from innerHTML alone
  if (state.page === "sales" && $("#sales-payment")) {
    $("#sales-payment").value = state.salesPayment;
  }
  if (state.page === "reports" && $("#report-range")) {
    $("#report-range").value = state.reportRange;
  }
  updateCashPreview();
}

// ── Toast ─────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2800);
}

// ── Cart actions ──────────────────────────────────────────────────────────────
function addToCart(id) {
  state.cart.set(id, (state.cart.get(id) || 0) + 1);
  render();
  const product = state.products.find((p) => p.id === id);
  showToast(product ? `"${product.name}" added to cart` : "Added to the demo cart");
}

function changeQuantity(id, delta) {
  const next = (state.cart.get(id) || 0) + delta;
  if (next <= 0) state.cart.delete(id);
  else state.cart.set(id, next);
  if (!state.cart.size) state.discount = 0;
  render();
}

// ── Cash preview ──────────────────────────────────────────────────────────────
function updateCashPreview() {
  const cash      = $("#cash-received");
  const method    = $("#payment-method");
  const cashField = $("#cash-field");
  if (!cash || !method || !cashField) return;
  const isCash = method.value === "Cash";
  cashField.style.display = isCash ? "block" : "none";
  if (isCash) {
    const subtotal = cartSubtotal();
    const total    = Math.max(0, subtotal - cartDiscount(subtotal));
    const received = Number(cash.value) || 0;
    const change   = Math.max(0, received - total);
    const preview  = $("#change-preview");
    if (preview) {
      preview.textContent = `Change: ${currencyFormat(change)}${received > 0 && received < total ? " · amount is short" : ""}`;
    }
  }
  // Keep checkout-total display in sync
  const subtotal    = cartSubtotal();
  const total       = Math.max(0, subtotal - cartDiscount(subtotal));
  const checkoutTot = $("#checkout-total");
  if (checkoutTot) checkoutTot.textContent = currencyFormat(total);
}

function updatePosTotals() {
  const subtotal   = cartSubtotal();
  const total      = Math.max(0, subtotal - cartDiscount(subtotal));
  if ($("#cart-subtotal")) $("#cart-subtotal").textContent = currencyFormat(subtotal);
  if ($("#cart-total"))    $("#cart-total").textContent    = currencyFormat(total);
  if ($("#checkout-total")) $("#checkout-total").textContent = currencyFormat(total);
  updateCashPreview();
}

// ── Checkout ──────────────────────────────────────────────────────────────────
function checkout() {
  if (!state.cart.size) return;
  const subtotal = cartSubtotal();
  const discount = cartDiscount(subtotal);
  const total    = subtotal - discount;
  const payment  = $("#payment-method").value;
  const received = payment === "Cash" ? Number($("#cash-received").value) || 0 : total;
  if (payment === "Cash" && received < total) {
    showToast("Cash received must cover the total");
    return;
  }
  const transaction = {
    invoice:  `DEMO-${String(state.transactions.length + 1).padStart(4, "0")}`,
    date:     new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(new Date()),
    customer: "Not provided",
    payment,
    items:    [...state.cart.entries()].map(([id, qty]) => {
      const p = state.products.find((item) => item.id === id);
      return { name: p.name, price: p.price, quantity: qty };
    }),
    subtotal, discount, total, received,
    change: Math.max(0, received - total),
  };
  state.transactions.unshift(transaction);
  state.cart.clear();
  state.discount = 0;
  render();
  openReceipt(transaction);
}

// ── Receipt modal ─────────────────────────────────────────────────────────────
function openReceipt(transaction) {
  $("#receipt-content").innerHTML = `
    <div class="receipt-head">
      <img class="receipt-logo" src="Techbloom%20Essential%20Logo.jpg" alt="TechBloom Essentials official logo">
      <h2 id="receipt-title">${escapeHtml(state.settings.storeName)}</h2>
      <p>Point of Sale · Frontend preview</p>
      <span class="receipt-demo">DEMO RECEIPT — NOT A REAL SALE</span>
    </div>
    <div class="receipt-meta">
      <span><span>Invoice</span><strong>${escapeHtml(transaction.invoice)}</strong></span>
      <span><span>Date</span><strong>${escapeHtml(transaction.date)}</strong></span>
      <span><span>Customer</span><strong>Not provided</strong></span>
      <span><span>Payment</span><strong>${escapeHtml(transaction.payment)}</strong></span>
    </div>
    <div class="receipt-items">${transaction.items.map((item) => `<div><span>${escapeHtml(item.name)} × ${item.quantity}</span><strong>${currencyFormat(item.price * item.quantity)}</strong></div>`).join("")}</div>
    <div class="receipt-total">
      <div><span>Subtotal</span><strong>${currencyFormat(transaction.subtotal)}</strong></div>
      <div><span>Discount</span><strong>− ${currencyFormat(transaction.discount)}</strong></div>
      <div class="grand"><span>Total</span><strong>${currencyFormat(transaction.total)}</strong></div>
      ${transaction.payment === "Cash" ? `<div><span>Cash received</span><strong>${currencyFormat(transaction.received)}</strong></div><div><span>Change</span><strong>${currencyFormat(transaction.change)}</strong></div>` : ""}
    </div>
    <p class="receipt-thanks">Preview only · This transaction was not saved to a server</p>`;
  $("#modal-backdrop").classList.remove("hidden");
  $("#modal-backdrop").removeAttribute("aria-hidden");
}

function closeReceipt() {
  $("#modal-backdrop").classList.add("hidden");
  $("#modal-backdrop").setAttribute("aria-hidden", "true");
}

// ── Dashboard helpers ─────────────────────────────────────────────────────────
function thisSessionSales() {
  return state.transactions.reduce((sum, tx) => sum + tx.total, 0);
}
function unknownStockCount() {
  return state.products.filter((p) => p.stock === null).length;
}
function lowStockProducts() {
  return state.products.filter((p) => p.stock !== null && p.stock <= state.settings.threshold);
}

// ── Event delegation ──────────────────────────────────────────────────────────
document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-page],[data-go],[data-add-cart],[data-qty],[data-view-transaction],[data-report-tab],[id],[data-auth-help]");
  if (!target) return;

  const id = target.id;
  if (id === "enter-demo") {
    state.demoModeOpen = true;
    $("#demo-welcome").hidden = true;
    $("#app-shell").hidden = false;
    render();
    setTimeout(() => {
      const main = $("#main-content");
      if (main) main.focus();
    }, 0);
    return;
  }
  if (id === "exit-demo")      { window.location.reload(); return; }
  if (id === "mobile-menu")    { $("#sidebar").classList.contains("open") ? closeSidebar() : openSidebar(); return; }
  if (id === "mobile-nav-backdrop") { closeSidebar(); return; }
  if (id === "brand-home")     { setPage("dashboard"); return; }
  if (id === "show-add-product") {
    $("#add-product-panel").classList.remove("hidden");
    setTimeout(() => $("#new-name") && $("#new-name").focus(), 0);
    return;
  }
  if (id === "hide-add-product") { $("#add-product-panel").classList.add("hidden"); return; }
  if (id === "checkout-button")  { checkout(); return; }
  if (id === "modal-close" || id === "done-receipt") { closeReceipt(); return; }
  if (id === "print-receipt")    { window.print(); return; }

  if (target.dataset.page)    { setPage(target.dataset.page); return; }
  if (target.dataset.go) {
    setPage(target.dataset.go);
    if (target.hasAttribute("data-add-product")) {
      setTimeout(() => {
        const panel = $("#add-product-panel");
        if (panel) { panel.classList.remove("hidden"); }
        const input = $("#new-name");
        if (input) input.focus();
      }, 50);
    }
    return;
  }
  if (target.dataset.addCart) { addToCart(Number(target.dataset.addCart)); return; }
  if (target.dataset.qty) {
    changeQuantity(Number(target.dataset.qty), Number(target.dataset.delta));
    return;
  }
  if (target.dataset.viewTransaction) {
    const tx = state.transactions.find((t) => t.invoice === target.dataset.viewTransaction);
    if (tx) openReceipt(tx);
    return;
  }
  if (target.dataset.reportTab) {
    state.reportTab = target.dataset.reportTab;
    render();
    return;
  }
});

// Close sidebar when clicking backdrop
document.addEventListener("click", (event) => {
  if (event.target.id === "modal-backdrop") closeReceipt();
  if (event.target.id === "mobile-nav-backdrop") closeSidebar();
});

// ── Input / change events ─────────────────────────────────────────────────────
document.addEventListener("input", (event) => {
  const id = event.target.id;
  // Helper: re-render and restore cursor
  function reRenderWithCursor(stateKey) {
    const cursor = event.target.selectionStart;
    state[stateKey] = event.target.value;
    render();
    const el = document.getElementById(event.target.id);
    if (el) { el.focus(); el.setSelectionRange(cursor, cursor); }
  }
  if (id === "pos-search")        { reRenderWithCursor("posQuery"); return; }
  if (id === "inventory-search")  { reRenderWithCursor("inventoryQuery"); return; }
  if (id === "sales-search")      { reRenderWithCursor("salesFilter"); return; }
  if (id === "discount-input") {
    state.discount = Math.max(0, Number(event.target.value) || 0);
    updatePosTotals();
    return;
  }
  if (id === "cash-received") { updateCashPreview(); return; }
});

document.addEventListener("change", (event) => {
  const id = event.target.id;
  if (id === "payment-method") { updateCashPreview(); return; }
  if (id === "sales-payment")  { state.salesPayment = event.target.value; render(); return; }
  if (id === "report-range")   { state.reportRange  = event.target.value; render(); return; }
});

// ── Form submissions ──────────────────────────────────────────────────────────
document.addEventListener("submit", (event) => {
  event.preventDefault();

    // Add product
  if (event.target.id === "add-product-form") {
    const form       = new FormData(event.target);
    const name       = String(form.get("name")).trim();
    const price      = Number(form.get("price"));
    const stockRaw   = String(form.get("stock")).trim();
    const stock      = stockRaw === "" ? null : Number(stockRaw);
    if (!name) { showToast("Product name is required."); return; }
    if (!Number.isFinite(price) || price <= 0) { showToast("Enter a valid positive price."); return; }
    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) { showToast("Stock quantity must be a non-negative whole number."); return; }
    state.products.push({ id: Date.now(), name, price, stock, icon: "\u25C7" });
    state.inventoryQuery = "";
    event.target.reset();
    render();
    showToast(`"${name}" added to the demo catalog.`);
    return;
  }

  // Settings
  if (event.target.id === "settings-form") {
    const form      = new FormData(event.target);
    const storeName = String(form.get("storeName")).trim();
    const threshold = Number(form.get("threshold"));
    if (!storeName) { showToast("Store name is required."); return; }
    if (!Number.isInteger(threshold) || threshold < 0) { showToast("Enter a valid threshold (0 or more)."); return; }
    state.settings = { storeName, currency: "PHP", threshold };
    render();
    showToast("Preview settings saved.");
    return;
  }
});

// ── Keyboard shortcuts ────────────────────────────────────────────────────────
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeReceipt();
    closeSidebar();
  }
});

// ── Boot ──────────────────────────────────────────────────────────────────────
// Only set the date label on boot; the app-shell remains hidden until demo entry.
(function boot() {
  const label = $("#today-label");
  if (label) {
    label.textContent = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date());
  }
})();
