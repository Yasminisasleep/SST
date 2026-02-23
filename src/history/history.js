const CHART_COLORS = [
  "#6c5ce7", "#00b894", "#fdcb6e", "#e74c3c", "#0984e3",
  "#e84393", "#00cec9", "#fd79a8", "#55efc4", "#fab1a0",
];

let allPurchases = [];

document.addEventListener("DOMContentLoaded", async () => {
  allPurchases = await Storage.getPurchases();
  await populateFilters();
  applyFilters();
  await renderWeeklyTrend();
  setupEventListeners();
});

async function populateFilters() {
  const categories = await Storage.getCategories();
  const categorySelect = document.getElementById("filter-category");

  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });

  const platforms = [...new Set(allPurchases.map((p) => p.platform).filter(Boolean))];
  const platformSelect = document.getElementById("filter-platform");

  platforms.forEach((plat) => {
    const option = document.createElement("option");
    option.value = plat;
    option.textContent = plat;
    platformSelect.appendChild(option);
  });
}

function getFilteredPurchases() {
  const period = document.getElementById("filter-period").value;
  const category = document.getElementById("filter-category").value;
  const platform = document.getElementById("filter-platform").value;
  const search = document.getElementById("search-input").value.toLowerCase().trim();

  let filtered = [...allPurchases];

  if (period !== "all") {
    const now = new Date();
    let startDate;

    switch (period) {
      case "weekly":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    filtered = filtered.filter((p) => new Date(p.date) >= startDate);
  }

  if (category !== "all") {
    filtered = filtered.filter((p) => p.category === category);
  }

  if (platform !== "all") {
    filtered = filtered.filter((p) => p.platform === platform);
  }

  if (search) {
    filtered = filtered.filter(
      (p) =>
        (p.description || "").toLowerCase().includes(search) ||
        (p.platform || "").toLowerCase().includes(search) ||
        (p.category || "").toLowerCase().includes(search)
    );
  }

  return filtered;
}

function applyFilters() {
  const filtered = getFilteredPurchases();
  renderSummary(filtered);
  renderChart(filtered);
  renderTable(filtered);
}

function renderSummary(purchases) {
  const total = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
  const count = purchases.length;
  const avg = count > 0 ? total / count : 0;

  const byCategory = {};
  purchases.forEach((p) => {
    const cat = p.category || "Other";
    byCategory[cat] = (byCategory[cat] || 0) + (p.amount || 0);
  });

  let topCat = "-";
  let topAmount = 0;
  for (const [cat, amount] of Object.entries(byCategory)) {
    if (amount > topAmount) {
      topAmount = amount;
      topCat = cat;
    }
  }

  document.getElementById("total-spent").textContent = "€" + total.toFixed(2);
  document.getElementById("total-count").textContent = count;
  document.getElementById("avg-amount").textContent = "€" + avg.toFixed(2);
  document.getElementById("top-category").textContent = topCat;
  document.getElementById("summary-text").textContent =
    count + " purchase" + (count !== 1 ? "s" : "") + " totalling €" + total.toFixed(2);
}

function renderChart(purchases) {
  const container = document.getElementById("chart-container");
  container.innerHTML = "";

  const byCategory = {};
  purchases.forEach((p) => {
    const cat = p.category || "Other";
    byCategory[cat] = (byCategory[cat] || 0) + (p.amount || 0);
  });

  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const maxVal = sorted.length > 0 ? sorted[0][1] : 0;

  if (sorted.length === 0) {
    container.innerHTML = '<p class="empty-state">No data to chart.</p>';
    return;
  }

  sorted.forEach(([cat, amount], i) => {
    const pct = maxVal > 0 ? (amount / maxVal) * 100 : 0;
    const color = CHART_COLORS[i % CHART_COLORS.length];

    const row = document.createElement("div");
    row.className = "chart-bar-row";
    row.innerHTML =
      '<span class="chart-label">' + escapeHtml(cat) + "</span>" +
      '<div class="chart-bar-wrapper">' +
        '<div class="chart-bar" style="width:' + pct + "%;background:" + color + '"></div>' +
      "</div>" +
      '<span class="chart-value">€' + amount.toFixed(2) + "</span>";

    container.appendChild(row);
  });
}

function renderTable(purchases) {
  const tbody = document.getElementById("purchases-body");
  const noResults = document.getElementById("no-results");
  tbody.innerHTML = "";

  if (purchases.length === 0) {
    noResults.style.display = "block";
    return;
  }

  noResults.style.display = "none";

  purchases.forEach((p) => {
    const date = new Date(p.date);
    const dateStr = date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const tr = document.createElement("tr");
    tr.innerHTML =
      '<td class="date-cell">' + dateStr + "</td>" +
      "<td>" + escapeHtml(p.description || "-") + "</td>" +
      '<td class="platform-cell">' + escapeHtml(p.platform || "-") + "</td>" +
      "<td>" + '<span class="category-badge">' + escapeHtml(p.category || "Other") + "</span></td>" +
      '<td class="amount-cell">-€' + (p.amount || 0).toFixed(2) + "</td>" +
      '<td><button class="btn-delete" data-id="' + p.id + '" title="Delete">&times;</button></td>';

    tbody.appendChild(tr);
  });

  tbody.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      await Storage.deletePurchase(id);
      allPurchases = await Storage.getPurchases();
      applyFilters();
    });
  });
}

function setupEventListeners() {
  document.getElementById("filter-period").addEventListener("change", applyFilters);
  document.getElementById("filter-category").addEventListener("change", applyFilters);
  document.getElementById("filter-platform").addEventListener("change", applyFilters);

  let searchTimeout;
  document.getElementById("search-input").addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, 300);
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function renderWeeklyTrend() {
  const weeks = await Storage.getWeeklyComparison();
  const container = document.getElementById("weekly-chart");
  container.innerHTML = "";

  if (weeks.length === 0) {
    container.innerHTML = '<p class="empty-state">No weekly data yet.</p>';
    return;
  }

  const maxTotal = Math.max(...weeks.map((w) => w.total), 1);

  weeks.forEach((week, i) => {
    const heightPct = (week.total / maxTotal) * 100;
    const isCurrent = i === weeks.length - 1;

    const group = document.createElement("div");
    group.className = "weekly-bar-group";
    group.innerHTML =
      '<span class="weekly-bar-amount">€' + week.total.toFixed(0) + "</span>" +
      '<div class="weekly-bar' + (isCurrent ? " current" : "") + '" style="height:' + Math.max(heightPct, 3) + '%"></div>' +
      '<span class="weekly-bar-label">' + week.label + "</span>";

    container.appendChild(group);
  });
}
