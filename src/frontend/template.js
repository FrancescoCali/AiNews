import { format } from "date-fns";

export function renderHtml(newsItems, meta) {
  const generatedAt = format(new Date(meta.generatedAt), "yyyy-MM-dd HH:mm");
  const dataJson = JSON.stringify(newsItems).replace(/</g, "\\u003c");
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
    <header class="mb-8">
      <h1 class="text-3xl md:text-5xl font-semibold tracking-tight">AI News Radar</h1>
      <p class="text-slate-400 mt-2">Most Important Today + Live AI Timeline</p>
      <p class="text-xs text-slate-500 mt-1">Updated: ${generatedAt}</p>
    </header>

    <section class="grid md:grid-cols-3 gap-4 mb-8">
      <div class="md:col-span-2 rounded-2xl border border-white/10 bg-glass backdrop-blur p-4">
        <input id="searchInput" placeholder="Search title, source, keywords..." class="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 outline-none focus:border-violet-400" />
      </div>
      <div class="rounded-2xl border border-white/10 bg-glass backdrop-blur p-4">
        <select id="categoryFilter" class="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-2">
          <option value="all">All categories</option>
        </select>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-xl font-semibold mb-3">Most Important Today</h2>
      <div id="mostImportant" class="rounded-2xl border border-violet-400/30 bg-violet-500/10 p-5"></div>
    </section>

    <section class="mb-10">
      <h2 class="text-xl font-semibold mb-3">Top 5 Daily</h2>
      <div id="topFive" class="grid md:grid-cols-2 xl:grid-cols-5 gap-4"></div>
    </section>

    <section class="mb-10">
      <h2 class="text-xl font-semibold mb-3">Ranking Trend</h2>
      <div id="trendBars" class="rounded-2xl border border-white/10 bg-glass backdrop-blur p-4 space-y-3"></div>
    </section>

    <section>
      <h2 class="text-xl font-semibold mb-3">AI Timeline</h2>
      <div id="timeline" class="space-y-4"></div>
    </section>
  </main>

  <script id="news-data" type="application/json">${dataJson}</script>
  <script>
    const rawData = JSON.parse(document.getElementById("news-data").textContent || "[]");
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

    const top = sorted[0];
    mostImportant.innerHTML = top ? \`
      <div class="flex items-center justify-between gap-3">
        <div>
          <span class="text-xs px-2 py-1 rounded bg-violet-500/30">\${top.category}</span>
          <h3 class="mt-2 text-lg font-medium">\${top.title}</h3>
          <p class="mt-2 text-sm text-slate-300">\${top.summary}</p>
          <a class="text-violet-300 text-sm mt-2 inline-block" href="\${top.url}" target="_blank" rel="noreferrer">Read source</a>
        </div>
        <div class="text-3xl font-bold text-violet-300">\${top.score}/10</div>
      </div>\`
      : "<p>No data available.</p>";

    function renderTopFive(items) {
      topFive.innerHTML = items.slice(0, 5).map((item, i) => \`
        <article class="rounded-xl border border-white/10 bg-slate-900/80 p-3 transition hover:-translate-y-1">
          <p class="text-xs text-slate-400">#\${i + 1} • \${item.source}</p>
          <h3 class="mt-1 text-sm font-medium line-clamp-3">\${item.title}</h3>
          <p class="mt-2 text-xs text-slate-400">Score: \${item.score}</p>
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
      timeline.innerHTML = items.map((item) => \`
        <article class="rounded-2xl border border-white/10 bg-glass backdrop-blur p-4 transition hover:border-violet-300/40">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs px-2 py-1 rounded bg-slate-800">\${item.category}</span>
            <span class="text-xs text-slate-400">\${new Date(item.date).toLocaleString()}</span>
            <span class="text-xs text-violet-300">Score \${item.score}/10</span>
          </div>
          <h3 class="mt-2 text-lg font-medium">\${item.title}</h3>
          <p class="mt-2 text-sm text-slate-300">\${item.summary}</p>
          <p class="mt-2 text-xs text-slate-400">\${(item.keywords || []).join(" • ")}</p>
          <a class="text-sm text-cyan-300 mt-2 inline-block" href="\${item.url}" target="_blank" rel="noreferrer">Open source</a>
        </article>
      \`).join("");
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
