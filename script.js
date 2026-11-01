(function () {
  "use strict";

  // ═══════════════ پیکربندی بخش‌ها ═══════════════
  var sections = [
    { id: "breakfast", path: "data/صبحانه.txt" },
    { id: "traditional-food", path: "data/غذای سنتی.txt" },
    { id: "fast-food", path: "data/فست فود.txt" },
    { id: "hot-drinks", path: "data/نوشیدنی گرم.txt" },
    { id: "cold-drinks", path: "data/نوشیدنی سرد.txt" },
    { id: "bastani", path: "data/بستنی.txt" },
    { id: "pastry", path: "data/شیرینی.txt" }
  ];

  var searchInput = document.getElementById("menu-search");
  var clearButton = document.getElementById("clear-search");
  var status = document.getElementById("menu-status");
  var errorBox = document.getElementById("menu-error");
  var noResults = document.getElementById("no-results");
  var header = document.getElementById("site-header");
  var allItems = [];

  // ═══════════════ تجزیه فایل متنی منو ═══════════════
  function parseItems(text, sectionId) {
    return text.split(/\r?\n/).map(function (line) {
      var value = line.trim();
      if (!value || value.charAt(0) === "#") return null;
      var divider = value.indexOf("|");
      var name = (divider < 0 ? value : value.slice(0, divider)).trim();
      var price = divider < 0 ? "" : value.slice(divider + 1).trim();
      if (!name) return null;
      return { name: name, price: price, section: sectionId };
    }).filter(Boolean);
  }

  // ═══════════════ ساخت المان آیتم منو ═══════════════
  function renderItem(item) {
    var row = document.createElement("div");
    row.className = "menu-item";
    var name = document.createElement("span");
    name.className = "item-name";
    name.textContent = item.name;
    var price = document.createElement("span");
    price.className = item.price ? "item-price" : "item-price price-missing";
    price.textContent = item.price || "قیمت وارد نشده";
    row.appendChild(name);
    row.appendChild(price);
    return row;
  }

  // ═══════════════ تبدیل ارقام به فارسی ═══════════════
  function toPersianDigits(value) {
    return String(value).replace(/[0-9]/g, function (d) {
      return "۰۱۲۳۴۵۶۷۸۹"[Number(d)];
    });
  }

  // ═══════════════ اعمال فیلتر جست‌وجو ═══════════════
  function applyFilter() {
    var query = searchInput.value.trim().toLocaleLowerCase();
    var visibleTotal = 0;

    sections.forEach(function (section) {
      var matched = allItems.filter(function (item) {
        return item.section === section.id && item.name.toLocaleLowerCase().indexOf(query) !== -1;
      });
      var list = document.getElementById("items-" + section.id);
      var sectionElement = document.querySelector('[data-section="' + section.id + '"]');
      if (!sectionElement || !list) return;

      var countValue = sectionElement.querySelector(".count-value");
      list.replaceChildren();
      matched.forEach(function (item) { list.appendChild(renderItem(item)); });

      if (!matched.length) {
        var empty = document.createElement("p");
        empty.className = "empty-section";
        empty.textContent = query ? "موردی برای نمایش نیست." : "هنوز موردی ثبت نشده است.";
        list.appendChild(empty);
      }

      if (countValue) countValue.textContent = toPersianDigits(matched.length);

      sectionElement.hidden = Boolean(query) && matched.length === 0;
      visibleTotal += matched.length;
    });

    clearButton.hidden = !searchInput.value;
    noResults.hidden = !query || visibleTotal > 0;
  }

  // ═══════════════ نمایش خطای بارگذاری ═══════════════
  function showLoadError() {
    status.hidden = true;
    errorBox.hidden = false;
    errorBox.replaceChildren();
    var title = document.createElement("strong");
    title.textContent = "بارگذاری منو انجام نشد.";
    var message = document.createElement("span");
    message.textContent = "اگر فایل را با نشانی file:// باز کرده‌اید، مرورگر اجازه‌ی خواندن فایل‌های منو را نمی‌دهد. پوشه را با یک سرور محلی اجرا کنید (مثلاً python -m http.server 8000) و سپس http://localhost:8000 را باز کنید. همچنین مطمئن شوید فایل‌های پوشه‌ی data کنار این صفحه هستند.";
    errorBox.appendChild(title);
    errorBox.appendChild(message);
  }

  // ═══════════════ بارگذاری داده‌های منو ═══════════════
  Promise.all(sections.map(function (section) {
    return fetch(encodeURI(section.path))
      .then(function (response) {
        if (!response.ok) throw new Error("Could not load " + section.path);
        return response.text();
      })
      .then(function (text) { return parseItems(text, section.id); });
  })).then(function (groups) {
    allItems = groups.reduce(function (items, group) { return items.concat(group); }, []);
    status.hidden = true;
    applyFilter();
  }).catch(function () { showLoadError(); });

  // ═══════════════ جست‌وجوی تعاملی (با debounce) ═══════════════
  var searchTimer;
  searchInput.addEventListener("input", function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(applyFilter, 150);
  });

  clearButton.addEventListener("click", function () {
    searchInput.value = "";
    applyFilter();
    searchInput.focus();
  });

  document.getElementById("reset-search").addEventListener("click", function () {
    searchInput.value = "";
    applyFilter();
    searchInput.focus();
  });

  // ═══════════════ هدر چسبان (با rAF) ═══════════════
  var ticking = false;
  function updateHeader() {
    var compact = window.scrollY > 40;
    header.classList.toggle("is-compact", compact);
    document.documentElement.style.setProperty("--header-h", header.offsetHeight + "px");
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) {
      requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });
  updateHeader();

  // ═══════════════ اشتراک‌گذاری منو ═══════════════
  document.getElementById("share-menu").addEventListener("click", function () {
    var message = document.getElementById("share-status");

    if (window.location.protocol === "file:") {
      message.textContent = "برای اشتراک‌گذاری، سایت را روی یک سرور اجرا کنید.";
      return;
    }

    var cleanUrl = window.location.origin + window.location.pathname.replace(/\/index\.html$/, "/") + window.location.search;
    var shareData = { url: cleanUrl };

    if (navigator.share) {
      navigator.share(shareData).then(function () {
        message.textContent = "منو با موفقیت به اشتراک گذاشته شد.";
      }).catch(function (error) {
        if (error.name !== "AbortError") copyLink();
      });
    } else {
      copyLink();
    }

    function copyLink() {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(cleanUrl).then(function () {
          message.textContent = "پیوند منو در کلیپ‌بورد کپی شد.";
        }).catch(function () {
          message.textContent = "امکان کپی خودکار نبود؛ نشانی صفحه را دستی کپی کنید.";
        });
      } else {
        message.textContent = "برای اشتراک‌گذاری، نشانی این صفحه را کپی کنید.";
      }
    }
  });

  // ═══════════════ اسکرول هوشمند چیپ‌ها ═══════════════
  var chips = document.querySelectorAll(".category-chip");
  var navBar = document.querySelector(".category-nav-bar");

  chips.forEach(function (chip) {
    chip.addEventListener("click", function (event) {
      var rawTarget = chip.getAttribute("href") || "";
      var cleanId = rawTarget.replace(/^#/, "").trim();
      if (!cleanId) return;

      var target = document.getElementById(cleanId) ||
                   document.querySelector('[data-section="' + cleanId + '"]');

      if (target) {
        event.preventDefault();
        var headerOffset = (header ? header.offsetHeight : 0) + (navBar ? navBar.offsetHeight : 0) + 12;
        var offsetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        chips.forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
      }
    });
  });
})();

// ═══════════════ ثبت Service Worker ═══════════════
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("./sw.js").catch(function (err) {
      console.log("SW registration failed:", err);
    });
  });
}

// ═══════════════ مدیریت نصب PWA ═══════════════
var deferredPrompt = null;
var installBanner = document.getElementById("pwa-install-banner");
var installBtn = document.getElementById("pwa-install-btn");
var dismissBtn = document.getElementById("pwa-dismiss-btn");

if (localStorage.getItem("pwa-dismissed") && installBanner) {
  installBanner.style.display = "none";
}

window.addEventListener("beforeinstallprompt", function (e) {
  e.preventDefault();
  deferredPrompt = e;
  if (installBanner && !localStorage.getItem("pwa-dismissed")) {
    installBanner.style.display = "flex";
  }
});

if (installBtn) {
  installBtn.addEventListener("click", function () {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function (choice) {
      if (choice.outcome === "accepted") console.log("PWA Installed");
      deferredPrompt = null;
      if (installBanner) installBanner.style.display = "none";
    });
  });
}

if (dismissBtn) {
  dismissBtn.addEventListener("click", function () {
    if (installBanner) installBanner.style.display = "none";
    localStorage.setItem("pwa-dismissed", "1");
  });
}

window.addEventListener("appinstalled", function () {
  if (installBanner) installBanner.style.display = "none";
  deferredPrompt = null;
});
