(function () {
  "use strict";

  let railwayNewsLoaded = false;
  let railwayNewsRequest = null;

  const RAILWAY_TERMS = /\b(?:indian railways?|ministry of railways?|railway board|irctc|indian railway traffic|railway station|railway train|railway track|railway zone|railway ministry|northern railway|eastern railway|western railway|central railway|southern railway|north eastern railway|north central railway|north western railway|south eastern railway|south central railway|east central railway|east coast railway|west central railway|vande bharat|memu|blw)\b/i;

  function isIndianRailwayArticle(article) {
    const text = [
      article?.title,
      article?.description,
      article?.content,
      typeof article?.source === "string" ? article.source : article?.source?.name,
      article?.source_name
    ]
      .filter(Boolean)
      .join(" ");
    return RAILWAY_TERMS.test(text);
  }

  function renderRailwayNewsArticles(list, articles) {
    list.replaceChildren();
    articles.filter(isIndianRailwayArticle).forEach(article => {
      let url;
      try { url = new URL(article.url); } catch { return; }
      if (!["https:", "http:"].includes(url.protocol)) return;

      const link = document.createElement("a");
      link.className = "dashboard-news-item";
      link.href = url.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      const title = document.createElement("strong");
      title.textContent = article.title || "Railway news";
      const meta = document.createElement("span");
      meta.className = "dashboard-news-meta";
      const published = article.publishedAt ? new Date(article.publishedAt) : null;
      const dateLabel = published && !Number.isNaN(published.getTime())
        ? published.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
        : "";
      meta.textContent = [article.source, dateLabel].filter(Boolean).join(" | ");
      link.append(title, meta);
      list.appendChild(link);
    });
    return list.children.length;
  }

  function loadDashboardRailwayNews(forceRefresh = false) {
    const list = document.getElementById("dashboard-railway-news-list");
    if (!list) return Promise.resolve();
    if (railwayNewsRequest && !forceRefresh) return railwayNewsRequest;
    if (railwayNewsLoaded && !forceRefresh) return Promise.resolve();

    list.textContent = "Loading railway news...";
    const refreshBtn = document.querySelector("#dashboard-railway-news button");
    if (refreshBtn) refreshBtn.disabled = true;

    railwayNewsRequest = fetch("/api/indian-railway-news", { cache: "no-store" })
      .then(async response => {
        const contentType = response.headers.get("content-type") || "";
        let data = null;
        try {
          if (contentType.includes("application/json")) {
            data = await response.json();
          } else {
            const text = await response.text();
            try { data = JSON.parse(text); } catch { data = null; }
          }
        } catch {
          data = null;
        }
        if (!response.ok) {
          throw new Error((data && data.error) ? data.error : "Unable to load railway news");
        }
        if (!data || !Array.isArray(data.articles)) {
          throw new Error("Unable to load railway news");
        }
        return data.articles.filter(isIndianRailwayArticle);
      })
      .then(articles => {
        const count = renderRailwayNewsArticles(list, articles || []);
        if (!count) list.textContent = "No Indian Railway news available.";
        railwayNewsLoaded = true;
      })
      .catch(error => {
        railwayNewsLoaded = false;
        console.error("Could not load Indian Railway news:", error);
        list.textContent = "Indian Railway news is temporarily unavailable.";
      })
      .finally(() => {
        railwayNewsRequest = null;
        if (refreshBtn) refreshBtn.disabled = false;
      });
    return railwayNewsRequest;
  }

  function updateHomeWelcomeTitle() {
    const el = document.getElementById("home-welcome-title");
    if (!el) return;
    const name = String(window.currentEmployeeName || "").trim();
    el.textContent = name ? "Welcome, " + name : "Welcome";
  }

  function updateHomeWelcomeDateTime() {
    const el = document.getElementById("home-welcome-datetime");
    if (!el) return;
    const now = new Date();
    const dateLabel = now.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    const timeLabel = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
    el.innerHTML = `<span class="home-date-line">${dateLabel}</span><span class="home-time-line">${timeLabel}</span>`;
  }
  setInterval(updateHomeWelcomeDateTime, 1000);
  updateHomeWelcomeDateTime();

  window.updateHomeWelcomeTitle = updateHomeWelcomeTitle;
  setTimeout(updateHomeWelcomeTitle, 0);
  setTimeout(() => {
    if (typeof window.loadDashboardRailwayNews === 'function') {
      window.loadDashboardRailwayNews();
    }
  }, 100);

  window.loadDashboardRailwayNews = loadDashboardRailwayNews;

  function launchModule(cat) {
    console.log("launchModule(" + cat + ") called");
    if (cat === "night" || cat === "keyman") {
      showSection("form-section");
      setDutyMode(cat);
    } else if (cat === "ta") {
      showSection("form-section");
      if (typeof handleMenuSelect === "function") handleMenuSelect("ta");
    } else if (cat === "attendance") {
      showSection("form-section");
      if (typeof handleMenuSelect === "function") handleMenuSelect("attendance");
    } else if (cat === "admin") {
      showSection("admin-section");
    } else if (cat === "history") {
      showSection("history-section");
    } else if (cat === "profile") {
      showSection("profile-section");
    } else if (cat === "settings") {
      showSection("settings-section");
    } else if (cat === "approve") {
      showSection("approve-section");
    } else {
      showSection("form-section");
      if (typeof handleMenuSelect === "function") handleMenuSelect(cat);
    }
  }

  window.launchModule = launchModule;
})();
