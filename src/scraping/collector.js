import axios from "axios";
import Bottleneck from "bottleneck";
import * as cheerio from "cheerio";
import Parser from "rss-parser";
import pLimit from "p-limit";
import pRetry from "p-retry";
import { SOURCES } from "../config/sources.js";
import { logger } from "../utils/logger.js";

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "ai-news-aggregator/1.0" }
});

const limiter = new Bottleneck({
  minTime: 600,
  maxConcurrent: 2
});

const SOURCE_CONCURRENCY = 3;

function isLikelyJunkTitle(title = "") {
  const t = title.trim().toLowerCase();
  if (!t || t.length < 8) return true;
  const blocked = [
    "news",
    "newsroom",
    "research",
    "support",
    "press kit",
    "privacy",
    "terms",
    "cookies"
  ];
  return blocked.includes(t);
}

function isValidArticleUrl(url = "") {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (lower.startsWith("mailto:") || lower.startsWith("javascript:")) return false;
  if (lower.includes("/cdn-cgi/") || lower.endsWith("#")) return false;
  return /^https?:\/\//.test(lower);
}

function extractImage(item, html = "") {
  if (item.enclosure?.url) return item.enclosure.url;
  const media = item?.["media:content"]?.url || item?.["media:thumbnail"]?.url;
  if (media) return media;
  if (!html) return null;
  const $ = cheerio.load(html);
  return $('meta[property="og:image"]').attr("content") || $("img").first().attr("src") || null;
}

function normalizeEntry(source, item) {
  const description = item.contentSnippet || item.summary || item.content || "";
  const rawUrl = item.link || source.homepage;
  const url = rawUrl && rawUrl.startsWith("http") ? rawUrl.split("#")[0] : rawUrl;
  return {
    title: item.title?.trim() || "Untitled",
    source: source.name,
    sourceId: source.id,
    url,
    description: description.trim(),
    date: item.isoDate || item.pubDate || new Date().toISOString(),
    author: item.creator || item.author || "Unknown",
    tags: item.categories || [],
    image: extractImage(item),
    engagement: item?.["slash:comments"] || null,
    categoryHint: source.categoryHint
  };
}

async function fetchWithFallback(source) {
  const rssAttempt = async () => {
    if (!source.rss) {
      throw new Error("No RSS configured");
    }
    const feed = await parser.parseURL(source.rss);
    return (feed.items || []).slice(0, 15).map((item) => normalizeEntry(source, item));
  };

  const htmlFallback = async () => {
    const response = await axios.get(source.homepage, {
      timeout: 15000,
      headers: { "User-Agent": "ai-news-aggregator/1.0" }
    });
    const $ = cheerio.load(response.data);
    const articles = [];
    $("article, .post, li").each((_, el) => {
      const title = $(el).find("h1,h2,h3,a").first().text().trim();
      const link = $(el).find("a").first().attr("href");
      if (!title || !link) return;
      const absLink = link.startsWith("http")
        ? link
        : new URL(link, source.homepage).toString();
      const description = $(el).find("p").first().text().trim();
      articles.push({
        title,
        source: source.name,
        sourceId: source.id,
        url: absLink,
        description,
        date: new Date().toISOString(),
        author: "Unknown",
        tags: [],
        image: null,
        engagement: null,
        categoryHint: source.categoryHint
      });
    });
    return articles.slice(0, 10);
  };

  try {
    return await pRetry(rssAttempt, { retries: 2, minTimeout: 1200 });
  } catch (rssError) {
    logger.warn({ source: source.id, err: rssError.message }, "RSS failed, using HTML fallback");
    return pRetry(htmlFallback, { retries: 1, minTimeout: 1000 });
  }
}

export async function collectNews() {
  const runAt = new Date().toISOString();
  const limit = pLimit(SOURCE_CONCURRENCY);

  const perSource = await Promise.all(
    SOURCES.map((source) =>
      limit(async () =>
        limiter.schedule(async () => {
          try {
            const entries = await fetchWithFallback(source);
            logger.info({ source: source.id, count: entries.length }, "Collected entries");
            return entries;
          } catch (err) {
            logger.error({ source: source.id, err: err.message }, "Source collection failed");
            return [];
          }
        })
      )
    )
  );

  const dedupeSet = new Set();
  const items = perSource
    .flat()
    .filter((item) => isValidArticleUrl(item.url))
    .filter((item) => !isLikelyJunkTitle(item.title))
    .filter((item) => {
      const key = `${item.url}|${item.title}`.toLowerCase();
      if (dedupeSet.has(key)) return false;
      dedupeSet.add(key);
      return true;
    });
  return {
    runAt,
    total: items.length,
    items
  };
}
