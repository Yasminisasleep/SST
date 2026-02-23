document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
  await loadCategories();
  setupEventListeners();
});

async function loadSettings() {
  const settings = await Storage.getSettings();

  document.getElementById("budget-amount").value = settings.budgetAmount;
  document.getElementById("budget-period").value = settings.budgetPeriod;
  document.getElementById("alert-threshold").value = settings.alertThreshold;
  document.getElementById("threshold-value").textContent = settings.alertThreshold + "%";
  document.getElementById("notifications-enabled").checked = settings.notificationsEnabled;
  document.getElementById("tracking-enabled").checked = settings.trackingEnabled;
}

async function loadCategories() {
  const categories = await Storage.getCategories();
  const container = document.getElementById("categories-list");
  container.innerHTML = "";

  categories.forEach((cat) => {
    const tag = document.createElement("span");
    tag.className = "category-tag";
    tag.innerHTML =
      escapeHtml(cat) +
      '<button class="remove-cat" data-category="' + escapeHtml(cat) + '">&times;</button>';
    container.appendChild(tag);
  });

  container.querySelectorAll(".remove-cat").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const catName = btn.getAttribute("data-category");
      const categories = await Storage.getCategories();
      const filtered = categories.filter((c) => c !== catName);
      await Storage.set(Storage.KEYS.CATEGORIES, filtered);
      await loadCategories();
    });
  });
}

function setupEventListeners() {
  document.getElementById("alert-threshold").addEventListener("input", (e) => {
    document.getElementById("threshold-value").textContent = e.target.value + "%";
  });

  document.getElementById("btn-save").addEventListener("click", async () => {
    const settings = {
      budgetAmount: parseFloat(document.getElementById("budget-amount").value) || 500,
      budgetPeriod: document.getElementById("budget-period").value,
      alertThreshold: parseInt(document.getElementById("alert-threshold").value, 10),
      notificationsEnabled: document.getElementById("notifications-enabled").checked,
      trackingEnabled: document.getElementById("tracking-enabled").checked,
      currency: "EUR",
    };

    await Storage.saveSettings(settings);
    showSaveStatus("Settings saved");
  });

  document.getElementById("btn-add-category").addEventListener("click", async () => {
    const input = document.getElementById("new-category");
    const name = input.value.trim();
    if (!name) return;

    const categories = await Storage.getCategories();
    if (categories.includes(name)) {
      showSaveStatus("Category already exists");
      return;
    }

    categories.push(name);
    await Storage.set(Storage.KEYS.CATEGORIES, categories);
    input.value = "";
    await loadCategories();
  });

  document.getElementById("new-category").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("btn-add-category").click();
    }
  });

  document.getElementById("btn-export").addEventListener("click", async () => {
    const data = await Storage.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sst-export-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
    showSaveStatus("Data exported");
  });

  document.getElementById("btn-import").addEventListener("click", () => {
    document.getElementById("import-file").click();
  });

  document.getElementById("import-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        await Storage.importData(data);
        await loadSettings();
        await loadCategories();
        showSaveStatus("Data imported");
      } catch (err) {
        showSaveStatus("Invalid file format");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  document.getElementById("btn-clear").addEventListener("click", async () => {
    if (confirm("This will delete all your data. Are you sure?")) {
      await Storage.clearAll();
      await loadSettings();
      await loadCategories();
      showSaveStatus("All data cleared");
    }
  });
}

function showSaveStatus(message) {
  const status = document.getElementById("save-status");
  status.textContent = message;
  status.classList.add("visible");
  setTimeout(() => {
    status.classList.remove("visible");
  }, 2000);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
