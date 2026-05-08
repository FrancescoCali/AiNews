import axios from "axios";
import path from "node:path";
import Bottleneck from "bottleneck";
import { ensureDir, readJson, writeJson } from "../utils/io.js";
import { logger } from "../utils/logger.js";

const CACHE_FILE = path.join(process.cwd(), "data", "translations.json");
const limiter = new Bottleneck({ minTime: 200, maxConcurrent: 2 });
const EMAIL = process.env.MYMEMORY_EMAIL || "";
const MAX_CHARS = 480;
const MAX_TRANSLATIONS_PER_RUN = Number(process.env.MAX_TRANSLATIONS_PER_RUN || 400);

async function translateGoogle(text, source = "en", target = "it") {
  const { data } = await axios.get("https://translate.googleapis.com/translate_a/single", {
    params: {
      client: "gtx",
      sl: source,
      tl: target,
      dt: "t",
      q: text
    },
    timeout: 9000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
    }
  });
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error("Google Translate returned unexpected payload");
  }
  const out = data[0]
    .map((segment) => (Array.isArray(segment) ? segment[0] : ""))
    .filter(Boolean)
    .join("");
  if (!out) {
    throw new Error("Google Translate returned empty translation");
  }
  return out;
}

async function translateMyMemory(text, langpair = "en|it") {
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

async function translateChunk(text) {
  try {
    return await translateGoogle(text);
  } catch (errGoogle) {
    try {
      return await translateMyMemory(text);
    } catch (errMyMemory) {
      throw new Error(`Translation providers failed: google=${errGoogle.message}; mymemory=${errMyMemory.message}`);
    }
  }
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

async function safeTranslate(text) {
  try {
    return await translateText(text);
  } catch (err) {
    logger.warn({ err: err.message }, "Single translation failed");
    return null;
  }
}

export async function translateBatch(items) {
  await ensureDir(path.dirname(CACHE_FILE));
  const cache = (await readJson(CACHE_FILE, {})) || {};
  const results = {};
  let titleHits = 0;
  let summaryHits = 0;
  let cachedCount = 0;
  let titleFails = 0;
  let summaryFails = 0;

  const work = items.map((item) => {
    const key = item.url || `${item.source}::${item.title}`;
    const baseTitle = item.title || "";
    const baseSummary = item.summaryEn || item.summary || "";
    const cacheEntry = cache[key] || {};
    const hasTitle = cacheEntry.titleSrc === baseTitle && cacheEntry.titleIt;
    const hasSummary = cacheEntry.summarySrc === baseSummary && cacheEntry.summaryIt;
    if (hasTitle && hasSummary) {
      cachedCount++;
      results[key] = { titleIt: cacheEntry.titleIt, summaryIt: cacheEntry.summaryIt };
    } else {
      results[key] = {
        titleIt: hasTitle ? cacheEntry.titleIt : null,
        summaryIt: hasSummary ? cacheEntry.summaryIt : null
      };
    }
    cache[key] = cache[key] || {};
    return { key, baseTitle, baseSummary, hasTitle, hasSummary };
  });

  for (const w of work) {
    if (w.hasTitle) continue;
    if (titleHits + summaryHits >= MAX_TRANSLATIONS_PER_RUN) break;
    const titleIt = await safeTranslate(w.baseTitle);
    if (titleIt) {
      cache[w.key].titleSrc = w.baseTitle;
      cache[w.key].titleIt = titleIt;
      results[w.key].titleIt = titleIt;
      titleHits++;
    } else {
      titleFails++;
    }
  }

  for (const w of work) {
    if (w.hasSummary) continue;
    if (titleHits + summaryHits >= MAX_TRANSLATIONS_PER_RUN) break;
    if (!w.baseSummary) continue;
    const summaryIt = await safeTranslate(w.baseSummary);
    if (summaryIt) {
      cache[w.key].summarySrc = w.baseSummary;
      cache[w.key].summaryIt = summaryIt;
      results[w.key].summaryIt = summaryIt;
      summaryHits++;
    } else {
      summaryFails++;
    }
  }

  try {
    await limiter.disconnect();
  } catch {
    // ignore disconnect errors
  }

  await writeJson(CACHE_FILE, cache);
  logger.info(
    { titleHits, summaryHits, cached: cachedCount, titleFails, summaryFails },
    "Translation batch completed"
  );
  return results;
}
