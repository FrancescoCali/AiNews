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
      <div class="rounded-2xl border border-white/10 bg-glass backdrop-blur p-4 relative">
        <button id="sourceFilterButton" type="button" class="w-full flex items-center justify-between rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-left hover:border-slate-500 transition">
          <span id="sourceFilterLabel" data-i18n="allSources">All sources</span>
          <svg class="w-4 h-4 text-slate-400 ml-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 011.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clip-rule="evenodd" /></svg>
        </button>
        <div id="sourceFilterMenu" class="hidden absolute left-0 right-0 mt-2 z-30 rounded-lg border border-slate-700 bg-slate-900/95 backdrop-blur shadow-xl max-h-72 overflow-y-auto px-1 py-1"></div>
        <input type="hidden" id="sourceFilter" value="all" />
      </div>
    </section>

    <section class="mb-10">
      <div class="flex items-center gap-2 mb-3">
        <h2 class="text-xl font-semibold" data-i18n="mostImportant">Most Important Today</h2>
        <button type="button" class="score-info-btn text-slate-400 hover:text-violet-300 transition" aria-label="Score info" data-i18n-aria="scoreInfoButton">
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm-1.5 3.75a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0v-4z" clip-rule="evenodd" /></svg>
        </button>
      </div>
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

  <div id="scoreInfoModal" class="hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="max-w-md w-full rounded-2xl border border-violet-400/30 bg-slate-900 p-6 relative shadow-2xl" id="scoreInfoCard">
      <button type="button" id="scoreInfoClose" class="absolute top-3 right-3 text-slate-400 hover:text-white transition w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800" aria-label="Close">
        <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.28 4.22a.75.75 0 011.06 0L10 8.94l4.66-4.72a.75.75 0 111.06 1.06L11.06 10l4.66 4.72a.75.75 0 11-1.06 1.06L10 11.06l-4.66 4.72a.75.75 0 11-1.06-1.06L8.94 10 4.28 5.28a.75.75 0 010-1.06z" clip-rule="evenodd" /></svg>
      </button>
      <h3 class="text-lg font-semibold text-violet-200 mb-3" data-i18n="scoreInfoTitle">How is the score calculated?</h3>
      <p class="text-sm text-slate-300 mb-3" data-i18n="scoreInfoIntro"></p>
      <ul class="text-sm text-slate-200 space-y-2 list-disc list-inside marker:text-violet-400">
        <li data-i18n="scoreInfoBase"></li>
        <li data-i18n="scoreInfoSource"></li>
        <li data-i18n="scoreInfoRecency"></li>
        <li data-i18n="scoreInfoEngagement"></li>
        <li data-i18n="scoreInfoLaunch"></li>
        <li data-i18n="scoreInfoCategory"></li>
        <li class="text-slate-400 italic" data-i18n="scoreInfoCap"></li>
      </ul>
    </div>
  </div>

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
        openTranslated: "Open translated →",
        showMore: "Show more",
        showLess: "Show less",
        score: "Score",
        scoreInfoTitle: "How is the score calculated?",
        scoreInfoIntro: "Each article gets a 1–10 score that combines:",
        scoreInfoBase: "Base score: 4 points.",
        scoreInfoSource: "+2 for high-trust sources (OpenAI, Anthropic, HuggingFace, Cursor, AWS ML Blog, Amazon Science).",
        scoreInfoRecency: "+1.5 if published within 24 hours, +0.5 extra if within 6 hours.",
        scoreInfoEngagement: "+1 if community engagement is detected (votes/comments).",
        scoreInfoLaunch: "+1 if title or description signals a launch, release, or announcement.",
        scoreInfoCategory: "+0.5 for high-impact categories: LLM, Agentic AI, Coding AI, Benchmark, AI Security.",
        scoreInfoCap: "Final result clamped between 1 and 10.",
        scoreInfoButton: "Score info",
        close: "Close",
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
        openArticle: "Apri originale →",
        openTranslated: "Apri tradotto →",
        showMore: "Mostra di più",
        showLess: "Mostra meno",
        score: "Punteggio",
        scoreInfoTitle: "Come si calcola il punteggio?",
        scoreInfoIntro: "Ogni articolo riceve un punteggio da 1 a 10 calcolato così:",
        scoreInfoBase: "Punteggio base: 4 punti.",
        scoreInfoSource: "+2 per fonti ad alta affidabilità (OpenAI, Anthropic, HuggingFace, Cursor, AWS ML Blog, Amazon Science).",
        scoreInfoRecency: "+1,5 se pubblicato nelle ultime 24 ore, +0,5 extra se nelle ultime 6 ore.",
        scoreInfoEngagement: "+1 se rileva interazione della community (voti, commenti).",
        scoreInfoLaunch: "+1 se titolo o descrizione contengono segnali di lancio, rilascio o annuncio.",
        scoreInfoCategory: "+0,5 per categorie ad alto impatto: LLM, Agentic AI, Coding AI, Benchmark, AI Security.",
        scoreInfoCap: "Risultato finale limitato tra 1 e 10.",
        scoreInfoButton: "Info punteggio",
        close: "Chiudi",
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

    const sourceFilterButton = document.getElementById("sourceFilterButton");
    const sourceFilterMenu = document.getElementById("sourceFilterMenu");
    const sourceFilterLabel = document.getElementById("sourceFilterLabel");
    const SOURCE_LIST = ["all", ...[...new Set(sorted.map((x) => x.source))].sort()];

    function buildSourceMenu() {
      const dict = I18N[currentLang];
      sourceFilterMenu.innerHTML = SOURCE_LIST.map((src) => {
        const label = src === "all" ? dict.allSources : src;
        const isActive = sourceFilter.value === src;
        const activeCls = isActive ? "bg-violet-500/20 text-violet-200" : "text-slate-200 hover:bg-slate-800";
        return \`<button type="button" data-source="\${escapeHtml(src)}" class="w-full text-left text-sm px-3 py-2 rounded-md transition \${activeCls}">\${escapeHtml(label)}</button>\`;
      }).join("");
      sourceFilterMenu.querySelectorAll("button[data-source]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const value = btn.dataset.source;
          sourceFilter.value = value;
          sourceFilterLabel.textContent = value === "all" ? I18N[currentLang].allSources : value;
          closeSourceMenu();
          filterItems();
        });
      });
    }

    function openSourceMenu() {
      buildSourceMenu();
      sourceFilterMenu.classList.remove("hidden");
    }

    function closeSourceMenu() {
      sourceFilterMenu.classList.add("hidden");
    }

    sourceFilterButton.addEventListener("click", (e) => {
      e.stopPropagation();
      if (sourceFilterMenu.classList.contains("hidden")) {
        openSourceMenu();
      } else {
        closeSourceMenu();
      }
    });

    document.addEventListener("click", (e) => {
      if (!sourceFilterMenu.contains(e.target) && e.target !== sourceFilterButton) {
        closeSourceMenu();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeSourceMenu();
    });

    let currentLang = localStorage.getItem("ai-news-lang") || "en";

    function pickSummary(item) {
      if (currentLang === "it") return item.summaryIt || item.summary || "";
      return item.summaryEn || item.summary || "";
    }

    function pickTitle(item) {
      if (currentLang === "it") return item.titleIt || item.title || "";
      return item.title || "";
    }

    function googleTranslateUrl(url) {
      try {
        const u = new URL(url);
        const host = u.host.replace(/\\./g, "-");
        const params = u.searchParams;
        params.set("_x_tr_sl", "auto");
        params.set("_x_tr_tl", "it");
        params.set("_x_tr_hl", "it");
        const query = params.toString();
        return \`https://\${host}.translate.goog\${u.pathname}\${query ? "?" + query : ""}\${u.hash || ""}\`;
      } catch {
        return url;
      }
    }

    function articleLinks(item) {
      const dict = I18N[currentLang];
      const original = \`<a class="text-cyan-300 text-sm" href="\${escapeHtml(item.url)}" target="_blank" rel="noreferrer">\${dict.openArticle}</a>\`;
      if (currentLang !== "it") return original;
      const translated = \`<a class="text-fuchsia-300 text-sm" href="\${escapeHtml(googleTranslateUrl(item.url))}" target="_blank" rel="noreferrer">\${dict.openTranslated}</a>\`;
      return \`<div class="flex flex-wrap items-center gap-3">\${original}\${translated}</div>\`;
    }

    function scoreBadge(score, options) {
      const opts = options || {};
      const colorClass = opts.colorClass || "text-violet-300";
      const sizeClass = opts.sizeClass || "text-xs";
      const iconClass = opts.iconClass || "w-3.5 h-3.5";
      const label = opts.showLabel ? (I18N[currentLang].score + " ") : "";
      return \`
        <span class="inline-flex items-center gap-1 \${sizeClass} \${colorClass}">
          <span>\${label}\${score}/10</span>
          <button type="button" class="score-info-btn text-slate-400 hover:\${colorClass.replace("text-", "text-")} transition" aria-label="\${I18N[currentLang].scoreInfoButton}">
            <svg class="\${iconClass}" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm-1.5 3.75a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0v-4z" clip-rule="evenodd" /></svg>
          </button>
        </span>
      \`;
    }

    const scoreInfoModal = document.getElementById("scoreInfoModal");
    const scoreInfoClose = document.getElementById("scoreInfoClose");
    const scoreInfoCard = document.getElementById("scoreInfoCard");

    function openScoreInfo() {
      scoreInfoModal.classList.remove("hidden");
    }

    function closeScoreInfo() {
      scoreInfoModal.classList.add("hidden");
    }

    document.addEventListener("click", (e) => {
      const trigger = e.target.closest(".score-info-btn");
      if (trigger) {
        e.stopPropagation();
        openScoreInfo();
        return;
      }
      if (!scoreInfoModal.classList.contains("hidden") && !scoreInfoCard.contains(e.target)) {
        closeScoreInfo();
      }
    });

    scoreInfoClose.addEventListener("click", closeScoreInfo);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeScoreInfo();
    });

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
      document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
        const key = el.getAttribute("data-i18n-aria");
        if (dict[key]) el.setAttribute("aria-label", dict[key]);
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
            <h3 class="mt-2 text-lg md:text-xl font-medium">\${escapeHtml(pickTitle(topItem))}</h3>
            <p class="mt-2 text-sm text-slate-200">\${escapeHtml(pickSummary(topItem))}</p>
            <div class="mt-3">\${articleLinks(topItem)}</div>
          </div>
          <div class="flex items-center gap-1 text-3xl font-bold text-violet-300">
            <span>\${topItem.score}/10</span>
            <button type="button" class="score-info-btn text-slate-400 hover:text-violet-300 transition" aria-label="\${dict.scoreInfoButton}">
              <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm-1.5 3.75a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0v-4z" clip-rule="evenodd" /></svg>
            </button>
          </div>
        </div>\`
        : \`<p>\${dict.noData}</p>\`;
    }

    function renderTopFive(items) {
      topFive.innerHTML = items.slice(0, 5).map((item, i) => \`
        <article class="rounded-xl border border-white/10 bg-slate-900/80 p-3 transition hover:-translate-y-1 flex flex-col gap-2">
          <p class="text-xs text-slate-400">#\${i + 1} • \${escapeHtml(item.source)}</p>
          <h3 class="text-sm font-medium line-clamp-3">\${escapeHtml(pickTitle(item))}</h3>
          <p class="text-xs text-slate-400 line-clamp-4">\${escapeHtml(pickSummary(item))}</p>
          <div class="flex items-center justify-between mt-auto pt-2 gap-2">
            \${scoreBadge(item.score, { colorClass: "text-violet-300" })}
            <div class="text-xs">\${articleLinks(item)}</div>
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
            \${scoreBadge(item.score, { colorClass: "text-violet-300", showLabel: true })}
          </div>
          <h3 class="mt-2 text-lg font-medium">\${escapeHtml(pickTitle(item))}</h3>
          <p class="mt-2 text-sm text-slate-300 summary-text" data-short="\${shortSummary}" data-full="\${summary}">\${shortSummary}</p>
          \${isLong ? \`<button class="toggle-summary text-xs text-violet-300 hover:underline mt-1">\${dict.showMore}</button>\` : ""}
          <p class="mt-2 text-xs text-slate-400">\${(item.keywords || []).map(escapeHtml).join(" • ")}</p>
          <div class="mt-2 text-sm">\${articleLinks(item)}</div>
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
      if (sourceFilter.value === "all") {
        sourceFilterLabel.textContent = I18N[currentLang].allSources;
      }
      renderMostImportant();
      filterItems();
    }

    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => setLanguage(btn.dataset.langBtn));
    });

    searchInput.addEventListener("input", filterItems);
    categoryFilter.addEventListener("change", filterItems);

    setLanguage(currentLang);
  </script>
</body>
</html>`;
}
