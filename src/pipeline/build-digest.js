import fs from "node:fs/promises";
import path from "node:path";
import { collectNews } from "../scraping/collector.js";
import { analyzeNews } from "../analysis/claude.js";
import { renderHtml } from "../frontend/template.js";
import { ensureDir, readJson, writeJson } from "../utils/io.js";
import { logger } from "../utils/logger.js";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const PUBLIC_DIR = path.join(ROOT, "public");
const RAW_FILE = path.join(DATA_DIR, "raw-news.json");
const OUTPUT_FILE = path.join(DATA_DIR, "news.json");
const ANALYTICS_FILE = path.join(DATA_DIR, "analytics.json");
const HTML_FILE = path.join(PUBLIC_DIR, "index.html");

function parseStep() {
  const arg = process.argv.find((x) => x.startsWith("--step="));
  return arg ? arg.split("=")[1] : "all";
}

async function runScrape() {
  const raw = await collectNews();
  await writeJson(RAW_FILE, raw);
  return raw;
}

async function runAnalyze(raw) {
  const analyzed = await analyzeNews(raw.items || []);
  analyzed.sort((a, b) => b.score - a.score);
  await writeJson(OUTPUT_FILE, analyzed);
  return analyzed;
}

async function runDashboard(analyzed) {
  await ensureDir(PUBLIC_DIR);
  const html = renderHtml(analyzed, { generatedAt: new Date().toISOString() });
  await fs.writeFile(HTML_FILE, html, "utf-8");
}

async function updateAnalytics(analyzed) {
  const oldAnalytics = (await readJson(ANALYTICS_FILE, { runs: [] })) || { runs: [] };
  oldAnalytics.runs.push({
    date: new Date().toISOString(),
    total: analyzed.length,
    topScore: analyzed[0]?.score ?? 0,
    categories: analyzed.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {})
  });
  oldAnalytics.runs = oldAnalytics.runs.slice(-45);
  await writeJson(ANALYTICS_FILE, oldAnalytics);
}

async function main() {
  const step = parseStep();
  logger.info({ step }, "Pipeline started");
  await ensureDir(DATA_DIR);
  await ensureDir(PUBLIC_DIR);

  if (step === "scrape") {
    await runScrape();
    return;
  }

  if (step === "analyze") {
    const raw = await readJson(RAW_FILE, { items: [] });
    const analyzed = await runAnalyze(raw);
    await updateAnalytics(analyzed);
    return;
  }

  if (step === "dashboard") {
    const analyzed = await readJson(OUTPUT_FILE, []);
    await runDashboard(analyzed);
    return;
  }

  const raw = await runScrape();
  const analyzed = await runAnalyze(raw);
  await runDashboard(analyzed);
  await updateAnalytics(analyzed);
  logger.info({ total: analyzed.length }, "Pipeline completed");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    logger.error({ err: err.message, stack: err.stack }, "Pipeline failed");
    process.exit(1);
  });
