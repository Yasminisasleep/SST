document.addEventListener("DOMContentLoaded", async () => {
  await loadBudgetStatus();
  await loadRecentPurchases();
  await loadCategories();
  setupEventListeners();
});

async function loadBudgetStatus() {
  const settings = await Storage.getSettings();
  const spending = await Storage.getSpendingForPeriod(settings.budgetPeriod);

  const budget = settings.budgetAmount;
  const spent = spending.total;
  const remaining = Math.max(0, budget - spent);
  const percentage = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;

  const symbol = settings.currency === "EUR" ? "€" : "$";

  document.getElementById("spent-amount").textContent = symbol + spent.toFixed(2);
  document.getElementById("remaining-amount").textContent = symbol + remaining.toFixed(2);
  document.getElementById("budget-amount").textContent = symbol + budget.toFixed(2);
  document.getElementById("budget-period").textContent =
    settings.budgetPeriod.charAt(0).toUpperCase() + settings.budgetPeriod.slice(1);
  document.getElementById("budget-percent").textContent = percentage + "%";

  const ringFill = document.getElementById("ring-fill");
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (percentage / 100) * circumference;
  ringFill.style.strokeDasharray = circumference;
  ringFill.style.strokeDashoffset = offset;

  ringFill.classList.remove("warning", "danger");
  if (percentage >= 100) {
    ringFill.classList.add("danger");
  } else if (percentage >= settings.alertThreshold) {
    ringFill.classList.add("warning");
  }

  const trackingStatus = document.getElementById("tracking-status");
  if (settings.trackingEnabled) {
    trackingStatus.textContent = "Tracking Active";
    trackingStatus.classList.remove("disabled");
  } else {
    trackingStatus.textContent = "Tracking Paused";
    trackingStatus.classList.add("disabled");
  }
}

async function loadRecentPurchases() {
  const settings = await Storage.getSettings();
  const purchases = await Storage.getPurchases();
  const recent = purchases.slice(0, 5);
  const listEl = document.getElementById("recent-list");
  const emptyEl = document.getElementById("no-purchases");
  const symbol = settings.currency === "EUR" ? "€" : "$";

  listEl.innerHTML = "";

  if (recent.length === 0) {
    emptyEl.style.display = "block";
    listEl.style.display = "none";
    return;
  }

  emptyEl.style.display = "none";
  listEl.style.display = "block";

  recent.forEach((purchase) => {
    const item = document.createElement("div");
    item.className = "purchase-item";

    const date = new Date(purchase.date);
    const dateStr = date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });

    item.innerHTML =
      '<div class="purchase-info">' +
        '<div class="purchase-desc">' + escapeHtml(purchase.description) + "</div>" +
        '<div class="purchase-meta">' + escapeHtml(purchase.platform || "Manual") + " &middot; " + dateStr + "</div>" +
      "</div>" +
      '<div class="purchase-amount">-' + symbol + purchase.amount.toFixed(2) + "</div>";

    listEl.appendChild(item);
  });
}

async function loadCategories() {
  const categories = await Storage.getCategories();
  const select = document.getElementById("add-category");
  select.innerHTML = "";

  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}

function setupEventListeners() {
  document.getElementById("quick-add-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const description = document.getElementById("add-description").value.trim();
    const amount = parseFloat(document.getElementById("add-amount").value);
    const category = document.getElementById("add-category").value;

    if (!description || isNaN(amount) || amount <= 0) return;

    await Storage.addPurchase({
      description,
      amount: Math.round(amount * 100) / 100,
      category,
      platform: "Manual",
      currency: "EUR",
      url: "",
      pageTitle: "",
    });

    document.getElementById("add-description").value = "";
    document.getElementById("add-amount").value = "";

    await loadBudgetStatus();
    await loadRecentPurchases();
  });

  document.getElementById("btn-settings").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("src/settings/settings.html") });
  });

  document.getElementById("btn-history").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("src/history/history.html") });
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
