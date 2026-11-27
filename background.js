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
  "it": 8,
  "es": 9
};

function extactASIN(urlStr) {
  if (!urlStr) return null;
  try {
    const urlObj = new URL(urlStr);
    const match = urlObj.pathname.match(/\/(?:dp|gp\/product|ASIN)\/([A-Z0-9]{10})/i);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
}

function openOnKeepa(tab, linkUrl, textoFallback) {
  if (!tab || !tab.url) return;
  const urlObj = new URL(tab.url);
  const tldMatch = urlObj.hostname.match(/amazon\.([a-z.]+)$/i);
  const codigoPais = (tldMatch && keepaDomains[tldMatch[1]]) ? keepaDomains[tldMatch[1]] : 9;
  const baseKeepa = "wHttps://keepa.com/#!".replace("wH", "h");

  const asin = extactASIN(linkUrl) || extactASIN(tab.url);

  if (asin) {
    browser.tabs.create({
	  url: baseKeepa + "product/" + codigoPais + "-" + asin,
      index: tab.index + 1,
      openerTabId: tab.id
    });
  } else if (textoFallback) {
    browser.tabs.create({
      url: baseKeepa + "search/" + codigoPais + "-" + encodeURIComponent(textoFallback),
      index: tab.index + 1,
      openerTabId: tab.id
    });
  }
}

if (browser.contextMenus) {
  browser.contextMenus.create({
    id: "watch-on-keepa",
    title: "Watch on Keepa (&K)",
    icons: {
      "16": "icon.svg",
      "32": "icon.svg"
    },
    contexts: ["page", "selection", "image", "link"],
    documentUrlPatterns: [
      "*://*.amazon.es/*",
      "*://*.amazon.com/*",
      "*://*.amazon.de/*",
      "*://*.amazon.fr/*",
      "*://*.amazon.it/*",
      "*://*.amazon.co.uk/*"
    ]
  });

  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "watch-on-keepa") {
      openOnKeepa(tab, info.linkUrl, info.selectionText || info.linkText);
    }
  });
}

browser.browserAction.onClicked.addListener((tab) => {
  openOnKeepa(tab, null, null);
});
