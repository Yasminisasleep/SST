importScripts("storage.js", "platforms.js");

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    await Storage.saveSettings(Storage.DEFAULT_SETTINGS);
    await Storage.set(Storage.KEYS.CATEGORIES, Storage.DEFAULT_CATEGORIES);
    await Storage.set(Storage.KEYS.PURCHASES, []);
  }
});

chrome.alarms.create("budget-check", { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "budget-check") {
    await checkBudgetStatus();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "GET_PLATFORM":
      handleGetPlatform(sender, sendResponse);
      return true;

    case "PURCHASE_DETECTED":
      handlePurchaseDetected(message.data, sendResponse);
      return true;

    case "GET_SPENDING":
      handleGetSpending(message.period, sendResponse);
      return true;

    case "GET_BUDGET_STATUS":
      handleGetBudgetStatus(sendResponse);
      return true;

    case "ADD_MANUAL_PURCHASE":
      handleManualPurchase(message.data, sendResponse);
      return true;

    default:
      return false;
  }
});

function handleGetPlatform(sender, sendResponse) {
  if (!sender.tab || !sender.tab.url) {
    sendResponse({ platform: null });
    return;
  }

  const platform = Platforms.detectPlatform(sender.tab.url);
  if (platform) {
    const serializable = {
      ...platform,
      hostPattern: undefined,
      orderPagePatterns: platform.orderPagePatterns.map((p) => ({
        source: p.source,
        flags: p.flags,
      })),
    };
    sendResponse({ platform: serializable });
  } else {
    sendResponse({ platform: null });
  }
}

async function handlePurchaseDetected(data, sendResponse) {
  const settings = await Storage.getSettings();
  if (!settings.trackingEnabled) {
    sendResponse({ saved: false, reason: "tracking_disabled" });
    return;
  }

  const purchases = await Storage.getPurchases();
  const isDuplicate = purchases.some((p) => {
    const timeDiff = Math.abs(Date.now() - p.timestamp);
    return (
      p.amount === data.amount &&
      p.platform === data.platform &&
      timeDiff < 300000
    );
  });

  if (isDuplicate) {
    sendResponse({ saved: false, reason: "duplicate" });
    return;
  }

  const purchase = await Storage.addPurchase(data);
  sendResponse({ saved: true, purchase });

  await checkBudgetStatus();
}

async function handleGetSpending(period, sendResponse) {
  const spending = await Storage.getSpendingForPeriod(period || "monthly");
  sendResponse(spending);
}

async function handleGetBudgetStatus(sendResponse) {
  const status = await getBudgetStatus();
  sendResponse(status);
}

async function handleManualPurchase(data, sendResponse) {
  const purchase = await Storage.addPurchase(data);
  sendResponse({ saved: true, purchase });
  await checkBudgetStatus();
}

async function getBudgetStatus() {
  const settings = await Storage.getSettings();
  const spending = await Storage.getSpendingForPeriod(settings.budgetPeriod);

  const budget = settings.budgetAmount;
  const spent = spending.total;
  const remaining = Math.max(0, budget - spent);
  const percentage = budget > 0 ? Math.round((spent / budget) * 100) : 0;

  return {
    budget,
    spent: Math.round(spent * 100) / 100,
    remaining: Math.round(remaining * 100) / 100,
    percentage,
    period: settings.budgetPeriod,
    count: spending.count,
    isOverBudget: spent > budget,
    isNearLimit: percentage >= settings.alertThreshold,
  };
}

async function checkBudgetStatus() {
  const settings = await Storage.getSettings();
  if (!settings.notificationsEnabled) return;

  const status = await getBudgetStatus();

  if (status.isOverBudget) {
    chrome.notifications.create("budget-exceeded", {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "Budget Exceeded!",
      message:
        "You've spent $" +
        status.spent.toFixed(2) +
        " of your $" +
        status.budget.toFixed(2) +
        " " +
        status.period +
        " budget.",
      priority: 2,
    });
  } else if (status.isNearLimit) {
    chrome.notifications.create("budget-warning", {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "Budget Warning",
      message:
        "You've used " +
        status.percentage +
        "% of your " +
        status.period +
        " budget. $" +
        status.remaining.toFixed(2) +
        " remaining.",
      priority: 1,
    });
  }
}
