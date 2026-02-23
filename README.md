# Smart Spending Tracker

Browser extension that automatically identifies and logs online purchases across multiple e-commerce platforms, with budgeting and alert capabilities.

Built with JavaScript, Chrome Extension API (Manifest V3), and Local Storage.

## Features

Automatic purchase detection on Amazon, eBay, Walmart, Target, Best Buy, Etsy, Shopify stores, AliExpress, Newegg, Vinted, Vestiaire Collective, and PayPal.

Budget management with configurable weekly, monthly, or yearly periods.

Real time notifications when approaching or exceeding budget limits.

Purchase history with filters by date, category, platform, and keyword search.

Spending breakdown by category with visual bar charts.

Weekly spending trend visualization.

Manual purchase entry for offline or untracked transactions.

Data export and import in JSON format.

Customizable spending categories.

## Project Structure

```
SST/
  manifest.json
  icons/
  src/
    background/
      background.js
    content/
      content.js
    lib/
      storage.js
      platforms.js
    popup/
      popup.html
      popup.css
      popup.js
    settings/
      settings.html
      settings.css
      settings.js
    history/
      history.html
      history.css
      history.js
```

## Setup

1. Clone the repository

```
git clone https://github.com/Yasminisasleep/SST.git
```

2. Open Chrome and go to `chrome://extensions/`

3. Enable "Developer mode" in the top right corner

4. Click "Load unpacked" and select the SST project folder

5. The extension icon appears in the toolbar, ready to use

## How It Works

The content script runs on supported e-commerce sites and watches for order confirmation pages. When a purchase is detected (order total, item names, confirmation indicators), it sends the data to the background service worker.

The background worker validates the purchase (checks for duplicates, verifies tracking is enabled), stores it in Chrome Local Storage, and triggers budget checks. If spending reaches the configured alert threshold or exceeds the budget, a browser notification is sent.

The popup shows a quick overview with a budget ring, recent purchases, and a form to add manual entries.

The history page provides a full table of all purchases with filtering, search, category charts, and weekly trend visualization.

The settings page lets you configure budget amount, period, alert threshold, notification preferences, and manage categories. You can also export/import your data or clear everything.

## Supported Platforms

Amazon (com, fr, co.uk, ca, de, es, it, co.jp), eBay (com, fr), Walmart, Target, Best Buy, Etsy, Shopify stores, AliExpress, Newegg, Vinted, Vestiaire Collective, PayPal

## Tech Stack

JavaScript (vanilla, no frameworks)

Chrome Extension Manifest V3

Chrome Storage API for persistence

Chrome Notifications API for budget alerts

Chrome Alarms API for periodic budget checks

MutationObserver for dynamic page monitoring
