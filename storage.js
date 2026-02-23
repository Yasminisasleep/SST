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
    currency: "USD",
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
    const purchases = await this.getPurchases();
    purchase.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    purchase.timestamp = Date.now();
    purchase.date = new Date().toISOString();
    purchases.unshift(purchase);
    await this.set(this.KEYS.PURCHASES, purchases);
    return purchase;
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
    await this.set(this.KEYS.SETTINGS, settings);
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

  async exportData() {
    const purchases = await this.getPurchases();
    const settings = await this.getSettings();
    return { purchases, settings, exportedAt: new Date().toISOString() };
  },

  async importData(data) {
    if (data.purchases) {
      await this.set(this.KEYS.PURCHASES, data.purchases);
    }
    if (data.settings) {
      await this.set(this.KEYS.SETTINGS, data.settings);
    }
  },

  async clearAll() {
    await chrome.storage.local.clear();
  },
};
