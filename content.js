(function () {
  let hasScanned = false;

  function parseCurrency(text) {
    if (!text) return null;
    const cleaned = text.replace(/[^\d.,]/g, "").replace(/,/g, "");
    const value = parseFloat(cleaned);
    return isNaN(value) ? null : value;
  }

  function extractCurrencySymbol(text) {
    if (!text) return "$";
    if (text.includes("€") || text.includes("EUR")) return "€";
    if (text.includes("£") || text.includes("GBP")) return "£";
    if (text.includes("¥")) return "¥";
    return "$";
  }

  function queryFirst(selectors) {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    return null;
  }

  function queryAllText(selectors) {
    const results = [];
    for (const selector of selectors) {
      document.querySelectorAll(selector).forEach((el) => {
        const text = el.textContent.trim();
        if (text) results.push(text);
      });
      if (results.length > 0) break;
    }
    return results;
  }

  function detectOrderConfirmation(platform) {
    for (const selector of platform.selectors.confirmationIndicators) {
      if (document.querySelector(selector)) return true;
    }

    const bodyText = document.body.innerText.toLowerCase();
    const confirmPhrases = [
      "order confirmed",
      "thank you for your order",
      "order has been placed",
      "purchase complete",
      "payment successful",
      "order number",
      "confirmation number",
      "order #",
    ];

    return confirmPhrases.some((phrase) => bodyText.includes(phrase));
  }

  function extractPurchaseData(platform) {
    const totalEl = queryFirst(platform.selectors.orderTotal);
    if (!totalEl) return null;

    const totalText = totalEl.textContent.trim();
    const amount = parseCurrency(totalText);
    if (!amount || amount <= 0) return null;

    const itemNames = queryAllText(platform.selectors.itemName);
    const description =
      itemNames.length > 0
        ? itemNames.slice(0, 5).join(", ")
        : "Purchase on " + platform.name;

    return {
      amount: Math.round(amount * 100) / 100,
      currency: extractCurrencySymbol(totalText),
      platform: platform.name,
      description: description.substring(0, 200),
      category: platform.defaultCategory,
      url: window.location.href,
      pageTitle: document.title,
    };
  }

  function scanPage() {
    if (hasScanned) return;

    chrome.runtime.sendMessage({ type: "GET_PLATFORM" }, (response) => {
      if (chrome.runtime.lastError) return;
      if (!response || !response.platform) return;

      const platform = response.platform;
      platform.orderPagePatterns = platform.orderPagePatterns.map(
        (p) => new RegExp(p.source || p, p.flags || "")
      );

      const url = window.location.href;
      const path = new URL(url).pathname + new URL(url).search;
      const isOrderPage = platform.orderPagePatterns.some((pattern) =>
        pattern.test(path)
      );

      if (!isOrderPage) return;
      if (!detectOrderConfirmation(platform)) return;

      const purchaseData = extractPurchaseData(platform);
      if (!purchaseData) return;

      hasScanned = true;
      chrome.runtime.sendMessage({
        type: "PURCHASE_DETECTED",
        data: purchaseData,
      });
    });
  }

  function init() {
    scanPage();

    const observer = new MutationObserver(() => {
      if (!hasScanned) {
        clearTimeout(observer._timeout);
        observer._timeout = setTimeout(scanPage, 1500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
