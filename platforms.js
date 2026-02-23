const Platforms = {
  amazon: {
    name: "Amazon",
    hostPattern: /amazon\.(com|co\.uk|ca|de|fr|es|it|co\.jp)/,
    orderPagePatterns: [
      /\/gp\/buy\/spc/,
      /\/gp\/css\/summary/,
      /\/order/i,
      /\/thankyou/i,
      /buy\/thankyou/,
    ],
    selectors: {
      orderTotal: [
        "#subtotals-marketplace-table .grand-total-price",
        ".grand-total-price",
        "#orderSummary .a-color-price",
        ".order-total .a-color-price",
        "#bottomRightGroup .a-color-price",
      ],
      itemName: [
        ".yo-giftcard-shipment-group .a-link-normal",
        "#productTitle",
        ".a-truncate-cut",
        ".sc-product-title",
      ],
      confirmationIndicators: [
        "#thank-you-message",
        ".a-alert-heading",
        "#orderDetails",
      ],
    },
    defaultCategory: "Other",
  },

  ebay: {
    name: "eBay",
    hostPattern: /ebay\.com/,
    orderPagePatterns: [
      /\/ord\/show/,
      /\/chk\/confirm/,
      /\/purchaseconfirm/i,
    ],
    selectors: {
      orderTotal: [
        ".cost-label + .cost-value",
        ".total-row .item-price",
        "#ppcTotal",
        ".order-total .text-display",
      ],
      itemName: [
        ".item-title a",
        ".purchase-title",
        "#itemTitle",
        ".vi-title",
      ],
      confirmationIndicators: [
        ".purchase-confirmation",
        "#confirmation-page",
      ],
    },
    defaultCategory: "Other",
  },

  walmart: {
    name: "Walmart",
    hostPattern: /walmart\.com/,
    orderPagePatterns: [
      /\/checkout/,
      /\/order/i,
      /\/thankyou/i,
    ],
    selectors: {
      orderTotal: [
        ".price-total .price-characteristic",
        '[data-testid="total-value"]',
        ".order-summary-total .price",
      ],
      itemName: [
        ".product-title",
        '[data-testid="item-description"]',
        ".cart-item-name",
      ],
      confirmationIndicators: [
        ".thank-you-page",
        '[data-testid="order-confirmation"]',
      ],
    },
    defaultCategory: "Other",
  },

  target: {
    name: "Target",
    hostPattern: /target\.com/,
    orderPagePatterns: [
      /\/co-review/,
      /\/co-thankyou/,
      /\/order/i,
    ],
    selectors: {
      orderTotal: [
        '[data-test="orderSummary-total"]',
        ".OrderSummary__Total",
        ".order-total-value",
      ],
      itemName: [
        '[data-test="cartItem-title"]',
        ".CartItemTitle",
        ".OrderItemTitle",
      ],
      confirmationIndicators: [
        '[data-test="order-confirmation"]',
        ".ThankYouPage",
      ],
    },
    defaultCategory: "Other",
  },

  bestbuy: {
    name: "Best Buy",
    hostPattern: /bestbuy\.com/,
    orderPagePatterns: [
      /\/checkout/,
      /\/order/i,
      /\/thank-you/i,
    ],
    selectors: {
      orderTotal: [
        ".order-summary__total .cash-money",
        ".price-summary__total-value",
        ".order-total",
      ],
      itemName: [
        ".cart-item__title",
        ".sku-title a",
        ".line-item-name",
      ],
      confirmationIndicators: [
        ".thank-you",
        ".order-confirmation",
      ],
    },
    defaultCategory: "Electronics",
  },

  etsy: {
    name: "Etsy",
    hostPattern: /etsy\.com/,
    orderPagePatterns: [
      /\/checkout/,
      /\/thankyou/i,
      /\/your\/purchases/,
    ],
    selectors: {
      orderTotal: [
        ".order-total .currency-value",
        ".grand-total .money",
        "[data-order-total]",
      ],
      itemName: [
        ".listing-title",
        ".transaction-title",
        ".cart-listing-title",
      ],
      confirmationIndicators: [
        ".thank-you-page",
        ".confirmation-page",
      ],
    },
    defaultCategory: "Other",
  },

  shopify: {
    name: "Shopify Store",
    hostPattern: /shopify\.com|myshopify\.com/,
    orderPagePatterns: [
      /\/checkouts\/.+\/thank_you/,
      /\/orders\//,
    ],
    selectors: {
      orderTotal: [
        ".payment-due__price",
        ".total-line--total .payment-due__price",
        "[data-checkout-payment-due-target]",
      ],
      itemName: [
        ".product__description__name",
        ".order-summary__emphasis",
      ],
      confirmationIndicators: [
        ".thank-you",
        ".os-header__title",
      ],
    },
    defaultCategory: "Other",
  },

  aliexpress: {
    name: "AliExpress",
    hostPattern: /aliexpress\.com/,
    orderPagePatterns: [
      /\/order/i,
      /\/confirm/i,
      /\/thankyou/i,
    ],
    selectors: {
      orderTotal: [
        ".order-price .highlight",
        ".total-price",
        ".order-amount",
      ],
      itemName: [
        ".product-title a",
        ".order-item-title",
        ".item-title",
      ],
      confirmationIndicators: [
        ".order-success",
        ".pay-success",
      ],
    },
    defaultCategory: "Other",
  },

  newegg: {
    name: "Newegg",
    hostPattern: /newegg\.com/,
    orderPagePatterns: [
      /\/secure\/checkout/,
      /\/order/i,
      /\/thankyou/i,
    ],
    selectors: {
      orderTotal: [
        ".summary-content-total strong",
        ".order-total .price",
        ".summary-total",
      ],
      itemName: [
        ".item-cell .item-title a",
        ".product-title",
        ".item-desc",
      ],
      confirmationIndicators: [
        ".order-confirmation",
        ".thank-you-section",
      ],
    },
    defaultCategory: "Electronics",
  },

  detectPlatform(url) {
    const hostname = new URL(url).hostname;
    for (const [key, platform] of Object.entries(this)) {
      if (typeof platform === "object" && platform.hostPattern) {
        if (platform.hostPattern.test(hostname)) {
          return { key, ...platform };
        }
      }
    }
    return null;
  },

  isOrderPage(url) {
    const platform = this.detectPlatform(url);
    if (!platform) return false;

    const path = new URL(url).pathname + new URL(url).search;
    return platform.orderPagePatterns.some((pattern) => pattern.test(path));
  },
};
