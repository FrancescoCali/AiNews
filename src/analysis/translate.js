import axios from "axios";
import path from "node:path";
import Bottleneck from "bottleneck";
import { ensureDir, readJson, writeJson } from "../utils/io.js";
import { logger } from "../utils/logger.js";

const CACHE_FILE = path.join(process.cwd(), "data", "translations.json");
const limiter = new Bottleneck({ minTime: 250, maxConcurrent: 2 });
const EMAIL = process.env.MYMEMORY_EMAIL || "";
const MAX_CHARS = 480;
const MAX_TRANSLATIONS_PER_RUN = Number(process.env.MAX_TRANSLATIONS_PER_RUN || 200);

async function translateChunk(text, langpair = "en|it") {
  const params = { q: text, langpair };
  if (EMAIL) params.de = EMAIL;
  const { data } = await axios.get("https://api.mymemory.translated.net/get", {
    params,
    timeout: 8000
  });
  const translated = data?.responseData?.translatedText;
  if (!translated || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(translated)) {
    throw new Error("MyMemory returned warning or empty response");
  }
  return translated;
}

function chunkText(text, max = MAX_CHARS) {
  if (!text) return [];
  if (text.length <= max) return [text];
  const chunks = [];
  let cursor = 0;
  while (cursor < text.length) {
    let end = Math.min(cursor + max, text.length);
    if (end < text.length) {
      const lastDot = text.lastIndexOf(". ", end);
      const lastSpace = text.lastIndexOf(" ", end);
      if (lastDot > cursor + 100) end = lastDot + 1;
      else if (lastSpace > cursor + 100) end = lastSpace;
    }
    chunks.push(text.slice(cursor, end).trim());
    cursor = end;
  }
  return chunks;
}

async function translateText(text) {
  if (!text) return "";
  const chunks = chunkText(text);
  const out = [];
  for (const chunk of chunks) {
    const translated = await limiter.schedule(() => translateChunk(chunk));
    out.push(translated);
  }
  return out.join(" ");
}

export async function translateBatch(items) {
  await ensureDir(path.dirname(CACHE_FILE));
  const cache = (await readJson(CACHE_FILE, {})) || {};
  const results = {};
  let translated = 0;
  let cachedCount = 0;
  let failed = 0;
  let skipped = 0;

  for (const item of items) {
    const key = item.url || `${item.source}::${item.title}`;
    const cacheEntry = cache[key];
    const baseSummary = item.summaryEn || item.summary || "";
    const baseTitle = item.title || "";

    if (cacheEntry && cacheEntry.titleSrc === baseTitle && cacheEntry.summarySrc === baseSummary) {
      results[key] = { titleIt: cacheEntry.titleIt, summaryIt: cacheEntry.summaryIt };
      cachedCount++;
      continue;
    }

    if (translated >= MAX_TRANSLATIONS_PER_RUN) {
      skipped++;
      continue;
    }

    try {
      const titleIt = await translateText(baseTitle);
      const summaryIt = await translateText(baseSummary);
      cache[key] = {
        titleSrc: baseTitle,
        summarySrc: baseSummary,
        titleIt,
        summaryIt
      };
      results[key] = { titleIt, summaryIt };
      translated++;
    } catch (err) {
      logger.warn({ err: err.message, url: key }, "Translation failed for item");
      failed++;
    }
  }

  try {
    await limiter.disconnect();
  } catch {
    // ignore disconnect errors
  }

  await writeJson(CACHE_FILE, cache);
  logger.info({ translated, cached: cachedCount, failed, skipped }, "Translation batch completed");
  return results;
}
