import { format } from "date-fns";

export function renderHtml(newsItems, meta) {
  const generatedAt = format(new Date(meta.generatedAt), "yyyy-MM-dd HH:mm");
  const dataBase64 = Buffer.from(JSON.stringify(newsItems), "utf-8").toString("base64");
  return `<!doctype html>
<html lang="it" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Radar Notizie AI</title>
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
    <header class="mb-8">
      <h1 class="text-3xl md:text-5xl font-semibold tracking-tight">Radar Notizie AI</h1>
      <p class="text-slate-400 mt-2">Più importanti oggi + Timeline AI live</p>
      <p class="text-xs text-slate-500 mt-1">Aggiornato: ${generatedAt}</p>
    </header>

    <section class="grid md:grid-cols-3 gap-4 mb-8">
      <div class="md:col-span-2 rounded-2xl border border-white/10 bg-glass backdrop-blur p-4">
        <input id="searchInput" placeholder="Cerca titolo, fonte, keyword..." class="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 outline-none focus:border-violet-400" />
      </div>
      <div class="rounded-2xl border border-white/10 bg-glass backdrop-blur p-4">
        <select id="categoryFilter" class="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2">
          <option value="all">Tutte le categorie</option>
        </select>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-xl font-semibold mb-3">Più importanti di oggi</h2>
      <div id="mostImportant" class="rounded-2xl border border-violet-400/30 bg-violet-500/10 p-5"></div>
    </section>

    <section class="mb-10">
      <h2 class="text-xl font-semibold mb-3">Top 5 giornaliera</h2>
      <div id="topFive" class="grid md:grid-cols-2 xl:grid-cols-5 gap-4"></div>
    </section>

    <section class="mb-10">
      <h2 class="text-xl font-semibold mb-3">Trend ranking</h2>
      <div id="trendBars" class="rounded-2xl border border-white/10 bg-glass backdrop-blur p-4 space-y-3"></div>
    </section>

    <section>
      <h2 class="text-xl font-semibold mb-3">Timeline AI</h2>
      <div id="timeline" class="space-y-4"></div>
    </section>
  </main>

  <script id="news-data" type="application/json">${dataBase64}</script>
  <script>
    function decodeBase64Json(encoded) {
      if (!encoded) return [];
      const bin = atob(encoded);
      const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
      const json = new TextDecoder().decode(bytes);
      return JSON.parse(json);
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
    const searchInput = document.getElementById("searchInput");
    const timeline = document.getElementById("timeline");
    const topFive = document.getElementById("topFive");
    const mostImportant = document.getElementById("mostImportant");
    const trendBars = document.getElementById("trendBars");

    const sorted = [...rawData].sort((a, b) => b.score - a.score);
    const categories = [...new Set(sorted.map((x) => x.category))].sort();
    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categoryFilter.appendChild(option);
    });

    function escapeHtmlGlobal(value) {
      return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    const topItem = sorted[0];
    mostImportant.innerHTML = topItem ? \`
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs px-2 py-1 rounded bg-violet-500/30">\${escapeHtmlGlobal(topItem.category)}</span>
            <span class="text-xs text-slate-400">\${escapeHtmlGlobal(topItem.source)}</span>
          </div>
          <h3 class="mt-2 text-lg md:text-xl font-medium">\${escapeHtmlGlobal(topItem.title)}</h3>
          <p class="mt-2 text-sm text-slate-200">\${escapeHtmlGlobal(topItem.summary)}</p>
          <a class="text-violet-300 text-sm mt-3 inline-block" href="\${escapeHtmlGlobal(topItem.url)}" target="_blank" rel="noreferrer">Apri articolo →</a>
        </div>
        <div class="text-3xl font-bold text-violet-300">\${topItem.score}/10</div>
      </div>\`
      : "<p>Nessun dato disponibile.</p>";

    function escapeHtml(value) {
      return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function renderTopFive(items) {
      topFive.innerHTML = items.slice(0, 5).map((item, i) => \`
        <article class="rounded-xl border border-white/10 bg-slate-900/80 p-3 transition hover:-translate-y-1 flex flex-col gap-2">
          <p class="text-xs text-slate-400">#\${i + 1} • \${escapeHtml(item.source)}</p>
          <h3 class="text-sm font-medium line-clamp-3">\${escapeHtml(item.title)}</h3>
          <p class="text-xs text-slate-400 line-clamp-4">\${escapeHtml(item.summary)}</p>
          <div class="flex items-center justify-between mt-auto pt-2">
            <span class="text-xs text-violet-300">\${item.score}/10</span>
            <a class="text-xs text-cyan-300" href="\${escapeHtml(item.url)}" target="_blank" rel="noreferrer">Apri →</a>
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
            <div class="flex justify-between text-sm mb-1"><span>\${category}</span><span>\${avg}</span></div>
            <div class="h-2 rounded bg-slate-800"><div class="h-2 rounded bg-gradient-to-r from-cyan-400 to-violet-500" style="width:\${width}%"></div></div>
          </div>
        \`;
      }).join("");
    }

    function renderTimeline(items) {
      timeline.innerHTML = items.map((item) => {
        const summary = escapeHtml(item.summary || "");
        const fullSummary = summary;
        const isLong = summary.length > 220;
        const shortSummary = isLong ? summary.slice(0, 220).trim() + "…" : summary;
        return \`
        <article class="rounded-2xl border border-white/10 bg-glass backdrop-blur p-4 transition hover:border-violet-300/40">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs px-2 py-1 rounded bg-slate-800">\${escapeHtml(item.category)}</span>
            <span class="text-xs text-slate-400">\${escapeHtml(item.source)}</span>
            <span class="text-xs text-slate-500">\${new Date(item.date).toLocaleString("it-IT")}</span>
            <span class="text-xs text-violet-300">Punteggio \${item.score}/10</span>
          </div>
          <h3 class="mt-2 text-lg font-medium">\${escapeHtml(item.title)}</h3>
          <p class="mt-2 text-sm text-slate-300 summary-text" data-short="\${shortSummary}" data-full="\${fullSummary}">\${shortSummary}</p>
          \${isLong ? '<button class="toggle-summary text-xs text-violet-300 hover:underline mt-1">Mostra di più</button>' : ''}
          <p class="mt-2 text-xs text-slate-400">\${(item.keywords || []).map(escapeHtml).join(" • ")}</p>
          <a class="text-sm text-cyan-300 mt-2 inline-block" href="\${escapeHtml(item.url)}" target="_blank" rel="noreferrer">Apri articolo →</a>
        </article>
      \`;
      }).join("");

      timeline.querySelectorAll('.toggle-summary').forEach((btn) => {
        btn.addEventListener('click', () => {
          const p = btn.previousElementSibling;
          const expanded = p.dataset.expanded === 'true';
          p.innerHTML = expanded ? p.dataset.short : p.dataset.full;
          p.dataset.expanded = expanded ? 'false' : 'true';
          btn.textContent = expanded ? 'Mostra di più' : 'Mostra meno';
        });
      });
    }

    function filterItems() {
      const q = searchInput.value.trim().toLowerCase();
      const cat = categoryFilter.value;
      const filtered = sorted.filter((item) => {
        const inCategory = cat === "all" || item.category === cat;
        const text = [item.title, item.source, (item.keywords || []).join(" ")].join(" ").toLowerCase();
        return inCategory && text.includes(q);
      });
      renderTimeline(filtered);
      renderTopFive(filtered);
      renderTrend(filtered);
    }

    searchInput.addEventListener("input", filterItems);
    categoryFilter.addEventListener("change", filterItems);
    filterItems();
  </script>
</body>
</html>`;
}
