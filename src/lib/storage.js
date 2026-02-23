const Storage = {
  KEYS: {
    PURCHASES: "sst_purchases",
    BUDGET: "sst_budget",
    SETTINGS: "sst_settings",
    CATEGORIES: "sst_categories",
  },

  DEFAULT_SETTINGS: {
    budgetAmount: 500,
    budgetPeriod: "monthly",
    alertThreshold: 80,
    notificationsEnabled: true,
    currency: "EUR",
    trackingEnabled: true,
  },

  DEFAULT_CATEGORIES: [
    "Electronics",
    "Clothing",
    "Home & Garden",
    "Books",
    "Food & Grocery",
    "Health & Beauty",
    "Sports & Outdoors",
    "Toys & Games",
    "Auto & Parts",
    "Other",
  ],

  async get(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => {
        resolve(result[key] ?? null);
      });
    });
  },

  async set(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  },

  async getPurchases() {
    const purchases = await this.get(this.KEYS.PURCHASES);
    return purchases || [];
  },

  async addPurchase(purchase) {
    if (!purchase || typeof purchase !== "object") return null;

    const amount = parseFloat(purchase.amount);
    if (isNaN(amount) || amount <= 0 || amount > 999999) return null;

    const sanitized = {
      amount: Math.round(amount * 100) / 100,
      description: String(purchase.description || "").substring(0, 200).trim(),
      category: String(purchase.category || "Other").substring(0, 50),
      platform: String(purchase.platform || "Manual").substring(0, 50),
      currency: String(purchase.currency || "EUR").substring(0, 3),
      url: String(purchase.url || "").substring(0, 500),
      pageTitle: String(purchase.pageTitle || "").substring(0, 200),
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      timestamp: Date.now(),
      date: new Date().toISOString(),
    };

    if (!sanitized.description) sanitized.description = "Unnamed purchase";

    const purchases = await this.getPurchases();
    purchases.unshift(sanitized);
    await this.set(this.KEYS.PURCHASES, purchases);
    return sanitized;
  },

  async deletePurchase(id) {
    const purchases = await this.getPurchases();
    const filtered = purchases.filter((p) => p.id !== id);
    await this.set(this.KEYS.PURCHASES, filtered);
    return filtered;
  },

  async getSettings() {
    const settings = await this.get(this.KEYS.SETTINGS);
    return settings || { ...this.DEFAULT_SETTINGS };
  },

  async saveSettings(settings) {
    if (!settings || typeof settings !== "object") return;

    const validated = {
      budgetAmount: Math.max(0, Math.min(parseFloat(settings.budgetAmount) || 500, 9999999)),
      budgetPeriod: ["weekly", "monthly", "yearly"].includes(settings.budgetPeriod)
        ? settings.budgetPeriod
        : "monthly",
      alertThreshold: Math.max(50, Math.min(parseInt(settings.alertThreshold, 10) || 80, 100)),
      notificationsEnabled: Boolean(settings.notificationsEnabled),
      currency: String(settings.currency || "EUR").substring(0, 3),
      trackingEnabled: Boolean(settings.trackingEnabled),
    };

    await this.set(this.KEYS.SETTINGS, validated);
  },

  async getCategories() {
    const categories = await this.get(this.KEYS.CATEGORIES);
    return categories || [...this.DEFAULT_CATEGORIES];
  },

  async getSpendingForPeriod(period) {
    const purchases = await this.getPurchases();
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
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const periodPurchases = purchases.filter(
      (p) => new Date(p.date) >= startDate
    );
    const total = periodPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);

    return { total, count: periodPurchases.length, purchases: periodPurchases };
  },

  async getSpendingByCategory(period) {
    const { purchases } = await this.getSpendingForPeriod(period);
    const byCategory = {};

    purchases.forEach((p) => {
      const cat = p.category || "Other";
      if (!byCategory[cat]) {
        byCategory[cat] = { total: 0, count: 0 };
      }
      byCategory[cat].total += p.amount || 0;
      byCategory[cat].count += 1;
    });

    return byCategory;
  },

  async getWeeklyComparison() {
    const purchases = await this.getPurchases();
    const now = new Date();
    const weeks = [];

    for (let i = 0; i < 4; i++) {
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - i * 7);
      weekEnd.setHours(23, 59, 59, 999);

      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const weekPurchases = purchases.filter((p) => {
        const d = new Date(p.date);
        return d >= weekStart && d <= weekEnd;
      });

      const total = weekPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);

      weeks.push({
        label: weekStart.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) +
          " - " +
          weekEnd.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
        total: Math.round(total * 100) / 100,
        count: weekPurchases.length,
      });
    }

    return weeks.reverse();
  },

  async exportData() {
    const purchases = await this.getPurchases();
    const settings = await this.getSettings();
    return { purchases, settings, exportedAt: new Date().toISOString() };
  },

  async importData(data) {
    if (!data || typeof data !== "object") return;

    if (Array.isArray(data.purchases)) {
      const valid = data.purchases.filter(
        (p) => p && typeof p.amount === "number" && p.amount > 0 && p.date
      );
      await this.set(this.KEYS.PURCHASES, valid);
    }
    if (data.settings && typeof data.settings === "object") {
      await this.saveSettings(data.settings);
    }
  },

  async clearAll() {
    await chrome.storage.local.clear();
  },
};
