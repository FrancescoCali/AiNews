import { format } from "date-fns";

export function renderHtml(newsItems, meta) {
  const generatedAt = format(new Date(meta.generatedAt), "yyyy-MM-dd HH:mm");
  const dataBase64 = Buffer.from(JSON.stringify(newsItems), "utf-8").toString("base64");
  return `<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI News Radar</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            glass: 'rgba(255,255,255,0.06)'
          }
        }
      }
    }
  </script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  <main class="max-w-7xl mx-auto px-4 py-8">
    <header class="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl md:text-5xl font-semibold tracking-tight" data-i18n="title">AI News Radar</h1>
        <p class="text-slate-400 mt-2" data-i18n="subtitle">Most Important Today + Live AI Timeline</p>
        <p class="text-xs text-slate-500 mt-1"><span data-i18n="updated">Updated</span>: ${generatedAt}</p>
      </div>
      <div class="flex items-center rounded-full border border-white/10 bg-slate-900/80 p-1 text-sm">
        <button data-lang-btn="en" class="lang-btn px-3 py-1 rounded-full transition">EN</button>
        <button data-lang-btn="it" class="lang-btn px-3 py-1 rounded-full transition">IT</button>
      </div>
    </header>

    <section class="grid md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
      <div class="md:col-span-2 rounded-2xl border border-white/10 bg-glass backdrop-blur p-4">
        <input id="searchInput" data-i18n-placeholder="search" placeholder="Search title, source, keywords..." class="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 outline-none focus:border-violet-400" />
      </div>
      <div class="rounded-2xl border border-white/10 bg-glass backdrop-blur p-4">
        <select id="categoryFilter" class="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2">
          <option value="all" data-i18n="allCategories">All categories</option>
        </select>
      </div>
      <div class="rounded-2xl border border-white/10 bg-glass backdrop-blur p-4">
        <select id="sourceFilter" class="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2">
          <option value="all" data-i18n="allSources">All sources</option>
        </select>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-xl font-semibold mb-3" data-i18n="mostImportant">Most Important Today</h2>
      <div id="mostImportant" class="rounded-2xl border border-violet-400/30 bg-violet-500/10 p-5"></div>
    </section>

    <section class="mb-10">
      <h2 class="text-xl font-semibold mb-3" data-i18n="topFive">Daily Top 5</h2>
      <div id="topFive" class="grid md:grid-cols-2 xl:grid-cols-5 gap-4"></div>
    </section>

    <section class="mb-10">
      <h2 class="text-xl font-semibold mb-3" data-i18n="rankingTrend">Ranking Trend</h2>
      <div id="trendBars" class="rounded-2xl border border-white/10 bg-glass backdrop-blur p-4 space-y-3"></div>
    </section>

    <section>
      <h2 class="text-xl font-semibold mb-3" data-i18n="timeline">AI Timeline</h2>
      <div id="timeline" class="space-y-4"></div>
    </section>
  </main>

  <script id="news-data" type="application/json">${dataBase64}</script>
  <script>
    const I18N = {
      en: {
        title: "AI News Radar",
        subtitle: "Most Important Today + Live AI Timeline",
        updated: "Updated",
        search: "Search title, source, keywords...",
        allCategories: "All categories",
        allSources: "All sources",
        mostImportant: "Most Important Today",
        topFive: "Daily Top 5",
        rankingTrend: "Ranking Trend",
        timeline: "AI Timeline",
        openArticle: "Open article →",
        showMore: "Show more",
        showLess: "Show less",
        score: "Score",
        noData: "No data available.",
        locale: "en-US"
      },
      it: {
        title: "Radar Notizie AI",
        subtitle: "Più importanti oggi + Timeline AI live",
        updated: "Aggiornato",
        search: "Cerca titolo, fonte, keyword...",
        allCategories: "Tutte le categorie",
        allSources: "Tutte le fonti",
        mostImportant: "Più importanti di oggi",
        topFive: "Top 5 giornaliera",
        rankingTrend: "Trend ranking",
        timeline: "Timeline AI",
        openArticle: "Apri articolo →",
        showMore: "Mostra di più",
        showLess: "Mostra meno",
        score: "Punteggio",
        noData: "Nessun dato disponibile.",
        locale: "it-IT"
      }
    };

    function decodeBase64Json(encoded) {
      if (!encoded) return [];
      const bin = atob(encoded);
      const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
      const json = new TextDecoder().decode(bytes);
      return JSON.parse(json);
    }

    function escapeHtml(value) {
      return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    let rawData = [];
    try {
      const encoded = document.getElementById("news-data").textContent || "";
      rawData = decodeBase64Json(encoded);
    } catch (err) {
      console.error("Failed to parse news data", err);
      rawData = [];
    }

    const categoryFilter = document.getElementById("categoryFilter");
    const sourceFilter = document.getElementById("sourceFilter");
    const searchInput = document.getElementById("searchInput");
    const timeline = document.getElementById("timeline");
    const topFive = document.getElementById("topFive");
    const mostImportant = document.getElementById("mostImportant");
    const trendBars = document.getElementById("trendBars");

    const sorted = [...rawData].sort((a, b) => b.score - a.score);

    [...new Set(sorted.map((x) => x.category))].sort().forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categoryFilter.appendChild(opt);
    });

    [...new Set(sorted.map((x) => x.source))].sort().forEach((src) => {
      const opt = document.createElement("option");
      opt.value = src;
      opt.textContent = src;
      sourceFilter.appendChild(opt);
    });

    let currentLang = localStorage.getItem("ai-news-lang") || "en";

    function pickSummary(item) {
      if (currentLang === "it") return item.summaryIt || item.summary || "";
      return item.summaryEn || item.summary || "";
    }

    function applyI18n() {
      const dict = I18N[currentLang];
      document.documentElement.lang = currentLang;
      document.title = dict.title;

      document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        if (dict[key]) el.textContent = dict[key];
      });
      document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (dict[key]) el.placeholder = dict[key];
      });
      document.querySelectorAll(".lang-btn").forEach((btn) => {
        const isActive = btn.dataset.langBtn === currentLang;
        btn.classList.toggle("bg-violet-500/30", isActive);
        btn.classList.toggle("text-violet-200", isActive);
        btn.classList.toggle("text-slate-400", !isActive);
      });
    }

    function renderMostImportant() {
      const dict = I18N[currentLang];
      const topItem = sorted[0];
      mostImportant.innerHTML = topItem ? \`
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs px-2 py-1 rounded bg-violet-500/30">\${escapeHtml(topItem.category)}</span>
              <span class="text-xs text-slate-400">\${escapeHtml(topItem.source)}</span>
            </div>
            <h3 class="mt-2 text-lg md:text-xl font-medium">\${escapeHtml(topItem.title)}</h3>
            <p class="mt-2 text-sm text-slate-200">\${escapeHtml(pickSummary(topItem))}</p>
            <a class="text-violet-300 text-sm mt-3 inline-block" href="\${escapeHtml(topItem.url)}" target="_blank" rel="noreferrer">\${dict.openArticle}</a>
          </div>
          <div class="text-3xl font-bold text-violet-300">\${topItem.score}/10</div>
        </div>\`
        : \`<p>\${dict.noData}</p>\`;
    }

    function renderTopFive(items) {
      const dict = I18N[currentLang];
      topFive.innerHTML = items.slice(0, 5).map((item, i) => \`
        <article class="rounded-xl border border-white/10 bg-slate-900/80 p-3 transition hover:-translate-y-1 flex flex-col gap-2">
          <p class="text-xs text-slate-400">#\${i + 1} • \${escapeHtml(item.source)}</p>
          <h3 class="text-sm font-medium line-clamp-3">\${escapeHtml(item.title)}</h3>
          <p class="text-xs text-slate-400 line-clamp-4">\${escapeHtml(pickSummary(item))}</p>
          <div class="flex items-center justify-between mt-auto pt-2">
            <span class="text-xs text-violet-300">\${item.score}/10</span>
            <a class="text-xs text-cyan-300" href="\${escapeHtml(item.url)}" target="_blank" rel="noreferrer">\${dict.openArticle}</a>
          </div>
        </article>
      \`).join("");
    }

    function renderTrend(items) {
      const grouped = items.reduce((acc, item) => {
        acc[item.category] = acc[item.category] || [];
        acc[item.category].push(item.score);
        return acc;
      }, {});
      trendBars.innerHTML = Object.entries(grouped).map(([category, scores]) => {
        const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
        const width = Math.max(5, Number(avg) * 10);
        return \`
          <div>
            <div class="flex justify-between text-sm mb-1"><span>\${escapeHtml(category)}</span><span>\${avg}</span></div>
            <div class="h-2 rounded bg-slate-800"><div class="h-2 rounded bg-gradient-to-r from-cyan-400 to-violet-500" style="width:\${width}%"></div></div>
          </div>
        \`;
      }).join("");
    }

    function renderTimeline(items) {
      const dict = I18N[currentLang];
      timeline.innerHTML = items.map((item) => {
        const summary = escapeHtml(pickSummary(item));
        const isLong = summary.length > 220;
        const shortSummary = isLong ? summary.slice(0, 220).trim() + "…" : summary;
        return \`
        <article class="rounded-2xl border border-white/10 bg-glass backdrop-blur p-4 transition hover:border-violet-300/40">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs px-2 py-1 rounded bg-slate-800">\${escapeHtml(item.category)}</span>
            <span class="text-xs text-slate-400">\${escapeHtml(item.source)}</span>
            <span class="text-xs text-slate-500">\${new Date(item.date).toLocaleString(dict.locale)}</span>
            <span class="text-xs text-violet-300">\${dict.score} \${item.score}/10</span>
          </div>
          <h3 class="mt-2 text-lg font-medium">\${escapeHtml(item.title)}</h3>
          <p class="mt-2 text-sm text-slate-300 summary-text" data-short="\${shortSummary}" data-full="\${summary}">\${shortSummary}</p>
          \${isLong ? \`<button class="toggle-summary text-xs text-violet-300 hover:underline mt-1">\${dict.showMore}</button>\` : ""}
          <p class="mt-2 text-xs text-slate-400">\${(item.keywords || []).map(escapeHtml).join(" • ")}</p>
          <a class="text-sm text-cyan-300 mt-2 inline-block" href="\${escapeHtml(item.url)}" target="_blank" rel="noreferrer">\${dict.openArticle}</a>
        </article>
      \`;
      }).join("");

      timeline.querySelectorAll(".toggle-summary").forEach((btn) => {
        btn.addEventListener("click", () => {
          const p = btn.previousElementSibling;
          const expanded = p.dataset.expanded === "true";
          p.innerHTML = expanded ? p.dataset.short : p.dataset.full;
          p.dataset.expanded = expanded ? "false" : "true";
          btn.textContent = expanded ? dict.showMore : dict.showLess;
        });
      });
    }

    function filterItems() {
      const q = searchInput.value.trim().toLowerCase();
      const cat = categoryFilter.value;
      const src = sourceFilter.value;
      const filtered = sorted.filter((item) => {
        const inCategory = cat === "all" || item.category === cat;
        const inSource = src === "all" || item.source === src;
        const text = [item.title, item.source, (item.keywords || []).join(" "), pickSummary(item)]
          .join(" ")
          .toLowerCase();
        return inCategory && inSource && text.includes(q);
      });
      renderTimeline(filtered);
      renderTopFive(filtered);
      renderTrend(filtered);
    }

    function setLanguage(lang) {
      if (!I18N[lang]) return;
      currentLang = lang;
      localStorage.setItem("ai-news-lang", lang);
      applyI18n();
      renderMostImportant();
      filterItems();
    }

    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => setLanguage(btn.dataset.langBtn));
    });

    searchInput.addEventListener("input", filterItems);
    categoryFilter.addEventListener("change", filterItems);
    sourceFilter.addEventListener("change", filterItems);

    setLanguage(currentLang);
  </script>
</body>
</html>`;
}
