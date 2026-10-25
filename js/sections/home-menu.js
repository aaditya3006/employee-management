(function () {
  "use strict";

  let railwayNewsLoaded = false;
  let railwayNewsRequest = null;

  const FALLBACK_RAILWAY_NEWS = [
    { title: "Indian Railways official updates and announcements", url: "https://indianrailways.gov.in/", source: "Indian Railways", publishedAt: "" },
    { title: "Press Information Bureau railway news", url: "https://pib.gov.in/allRel.aspx?reg=3&lang=1", source: "PIB", publishedAt: "" },
    { title: "IRCTC latest railway travel updates", url: "https://www.irctc.co.in/", source: "IRCTC", publishedAt: "" },
    { title: "Indian Railway news search", url: "https://news.google.com/search?q=Indian+Railway&hl=en-IN&gl=IN&ceid=IN:en", source: "Google News", publishedAt: "" },
    { title: "Ministry of Railways updates", url: "https://rlycms.gov.in/", source: "Railway Board", publishedAt: "" }
  ];

  function renderRailwayNewsArticles(list, articles) {
    list.replaceChildren();
    articles.forEach(article => {
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
        return data.articles;
      })
      .then(articles => {
        const count = renderRailwayNewsArticles(list, (articles && articles.length) ? articles : FALLBACK_RAILWAY_NEWS);
        if (!count) list.textContent = "No Indian Railway news articles were found.";
        railwayNewsLoaded = true;
      })
      .catch(() => {
        railwayNewsLoaded = false;
        renderRailwayNewsArticles(list, FALLBACK_RAILWAY_NEWS);
        const retry = document.createElement("button");
        retry.type = "button";
        retry.className = "dashboard-news-retry";
        retry.textContent = "Retry";
        retry.addEventListener("click", () => loadDashboardRailwayNews(true));
        list.appendChild(retry);
      })
      .finally(() => {
        railwayNewsRequest = null;
        if (refreshBtn) refreshBtn.disabled = false;
      });
    return railwayNewsRequest;
  }
    return railwayNewsRequest;
  }

  function updateHomeWelcomeTitle() {
    const el = document.getElementById("home-welcome-title");
    if (!el) return;
    const name = String(window.currentEmployeeName || "").trim();
    el.textContent = name ? "Welcome, " + name : "Welcome";
  }

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
