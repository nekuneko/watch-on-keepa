// Copyright (c) 2026 NeKuNeKo. All Rights Reserved.
// Unauthorized copying, modification, or distribution is strictly prohibited.
//
// DISCLAIMER: This is an independent, unofficial extension and is not affiliated with,
// endorsed by, or connected to Keepa (keepa.com) or Amazon. "Keepa" and "Amazon" are
// registered trademarks of their respective owners.

const keepaDomains = {
  "com": 1,
  "co.uk": 2,
  "de": 3,
  "fr": 4,
  "co.jp": 5,
  "ca": 6,
  "it": 8,
  "es": 9,
  "in": 10,
  "com.mx": 11,
  "com.br": 12,
  "com.au": 13,
  "nl": 14
};

const amazonPatterns = Object.keys(keepaDomains).map(
  (tld) => "*://*.amazon." + tld + "/*"
);

function extractASIN(urlStr) {
  if (!urlStr) return null;
  try {
    const urlObj = new URL(urlStr);
    const match = urlObj.pathname.match(
      /\/(?:dp|gp\/product|gp\/aw\/d|gp\/offer-listing|d|ASIN)\/([A-Z0-9]{10})(?:\/|$|\?)/i
    );
    return match ? match[1].toUpperCase() : null;
  } catch (e) {
    return null;
  }
}

function getCountryCode(urlStr) {
  if (!urlStr) return 9;
  try {
    const urlObj = new URL(urlStr);
    const tldMatch = urlObj.hostname.match(/amazon\.([a-z.]+)$/i);
    if (!tldMatch) return 9;
    return keepaDomains[tldMatch[1].toLowerCase()] || 9;
  } catch (e) {
    return 9;
  }
}

function openOnKeepa(tab, rawLinkUrl, fallbackText) {
  const baseKeepa = "https://keepa.com/#!";
  const targetUrl = rawLinkUrl || (tab && tab.url);
  if (!targetUrl) return;

  const asin = extractASIN(targetUrl);
  const countryCode = getCountryCode(targetUrl);

  let destinationUrl = null;
  if (asin) {
    destinationUrl = baseKeepa + "product/" + countryCode + "-" + asin;
  } else if (fallbackText && fallbackText.trim().length > 0) {
    destinationUrl = baseKeepa + "search/" + countryCode + "-" + encodeURIComponent(fallbackText.trim());
  }

  if (!destinationUrl) return;

  const createProps = { url: destinationUrl };
  if (tab && typeof tab.index === "number" && tab.index >= 0) {
    createProps.index = tab.index + 1;
  }
  if (tab && typeof tab.id === "number" && tab.id !== browser.tabs.TAB_ID_NONE) {
    createProps.openerTabId = tab.id;
  }

  browser.tabs.create(createProps);
}

browser.runtime.onInstalled.addListener(() => {
  if (!browser.contextMenus) return;

  browser.contextMenus.removeAll().then(() => {
    browser.contextMenus.create({
      id: "watch-on-keepa",
      title: "Watch on Keepa (&K)",
      icons: {
        "16": "icon.svg",
        "32": "icon.svg"
      },
      contexts: ["page", "selection", "image", "link"],
      documentUrlPatterns: amazonPatterns
    });
  });
});

if (browser.contextMenus) {
  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "watch-on-keepa") {
      const fallback = info.selectionText || info.linkText;
      const sourceUrl = info.linkUrl || info.pageUrl || (tab && tab.url);
      openOnKeepa(tab, sourceUrl, fallback);
    }
  });
}

if (browser.browserAction) {
  browser.browserAction.onClicked.addListener((tab) => {
    openOnKeepa(tab, null, null);
  });
}
