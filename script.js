(function () {
  "use strict";

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
  var allItems = [];

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

  function applyFilter() {
    var query = searchInput.value.trim().toLocaleLowerCase();
    var visibleTotal = 0;
    sections.forEach(function (section) {
      var matched = allItems.filter(function (item) {
        return item.section === section.id && item.name.toLocaleLowerCase().indexOf(query) !== -1;
      });
      var list = document.getElementById("items-" + section.id);
      var sectionElement = document.querySelector('[data-section="' + section.id + '"]');
      if (!sectionElement) return;

      var count = sectionElement.querySelector(".section-count");
      list.replaceChildren();
      matched.forEach(function (item) { list.appendChild(renderItem(item)); });

      if (!matched.length) {
        var empty = document.createElement("p");
        empty.className = "empty-section";
        empty.textContent = query ? "موردی برای نمایش نیست." : "هنوز موردی ثبت نشده است.";
        list.appendChild(empty);
      }

      if (count) {
        count.textContent = String(matched.length).replace(/[0-9]/g, function (digit) {
          return "۰۱۲۳۴۵۶۷۸۹"[Number(digit)];
        });
      }

      sectionElement.hidden = Boolean(query) && matched.length === 0;
      visibleTotal += matched.length;
    });

    clearButton.hidden = !searchInput.value;
    noResults.hidden = !query || visibleTotal > 0;
  }

  function showLoadError() {
    status.hidden = true;
    errorBox.hidden = false;
    errorBox.replaceChildren();
    var title = document.createElement("strong");
    title.textContent = "بارگذاری منو انجام نشد.";
    var message = document.createElement("span");
    message.textContent = "اگر فایل را با نشانی file:// باز کرده‌اید، مرورگر اجازه‌ی خواندن فایل‌های منو را نمی‌دهد. پوشه را با یک سرور محلی اجرا کنید (مثلاً دستور python -m http.server 8000) و سپس http://localhost:8000 را باز کنید. همچنین مطمئن شوید فایل‌های پوشه‌ی data کنار این صفحه هستند.";
    errorBox.appendChild(title);
    errorBox.appendChild(message);
  }

  // بارگذاری داده‌ها بدون کش
  Promise.all(sections.map(function (section) {
    var noCacheUrl = encodeURI(section.path) + "?v=" + Date.now() + "_" + Math.random().toString(36).slice(2);
    return fetch(noCacheUrl, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    }).then(function (response) {
      if (!response.ok) throw new Error("Could not load " + section.path);
      return response.text();
    }).then(function (text) { return parseItems(text, section.id); });
  })).then(function (groups) {
    allItems = groups.reduce(function (items, group) { return items.concat(group); }, []);
    status.hidden = true;
    applyFilter();
    setupCategoryNav();
  }).catch(function () { showLoadError(); });

  searchInput.addEventListener("input", applyFilter);
  clearButton.addEventListener("click", function () {
    searchInput.value = "";
    applyFilter();
    searchInput.focus();
  });

  var resetBtn = document.getElementById("reset-search");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      searchInput.value = "";
      applyFilter();
      searchInput.focus();
    });
  }

  // مدیریت هدر چسبان
  var header = document.getElementById("site-header");
  function updateHeader() {
    if (header) {
      header.classList.toggle("is-compact", window.scrollY > 40);
    }
  }
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  // تعامل چیپ‌های دسته‌بندی و اسکرول نرم
  function setupCategoryNav() {
    var chips = document.querySelectorAll(".category-chip");
    if (!chips.length) return;

    chips.forEach(function (chip) {
      chip.addEventListener("click", function (e) {
        e.preventDefault();
        var targetId = chip.getAttribute("data-target");
        var targetEl = document.querySelector('[data-section="' + targetId + '"]');
        if (targetEl) {
          var headerOffset = 120; // محاسبه فاصله برای زیر هدر و چیپ چسبان
          var elementPosition = targetEl.getBoundingClientRect().top;
          var offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }
      });
    });

    // هایلایت خودکار چیپ‌ها هنگام اسکرول
    if ("IntersectionObserver" in window) {
      var observerOptions = {
        root: null,
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0
      };

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var sectionId = entry.target.getAttribute("data-section");
            chips.forEach(function (chip) {
              var isCurrent = chip.getAttribute("data-target") === sectionId;
              chip.classList.toggle("active", isCurrent);
              if (isCurrent) {
                chip.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
              }
            });
          }
        });
      }, observerOptions);

      sections.forEach(function (sec) {
        var el = document.querySelector('[data-section="' + sec.id + '"]');
        if (el) observer.observe(el);
      });
    }
  }

  // اشتراک‌گذاری
  var shareBtn = document.getElementById("share-menu");
  if (shareBtn) {
    shareBtn.addEventListener("click", function () {
      var message = document.getElementById("share-status");
      var cleanUrl = window.location.origin + window.location.pathname.replace(/\/index\.html$/, "/") + window.location.search;
      var shareData = { url: cleanUrl };

      function copyLink() {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(cleanUrl).then(function () {
            if (message) message.textContent = "پیوند منو در کلیپ‌بورد کپی شد.";
          }).catch(function () {
            if (message) message.textContent = "امکان کپی خودکار نبود؛ نشانی صفحه را دستی کپی کنید.";
          });
        } else {
          if (message) message.textContent = "برای اشتراک‌گذاری، نشانی این صفحه را کپی کنید.";
        }
      }

      if (navigator.share) {
        navigator.share(shareData).then(function () {
          if (message) message.textContent = "منو با موفقیت به اشتراک گذاشته شد.";
        }).catch(function (error) {
          if (error.name !== "AbortError") copyLink();
        });
      } else {
        copyLink();
      }
    });
  }
})();
