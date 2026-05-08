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

const NON_ARTICLE_PATH_HINTS = [
  "/leaderboard",
  "/pricing",
  "/signup",
  "/login",
  "/contact",
  "/support",
  "/careers",
  "/jobs",
  "/about",
  "/demo",
  "/download",
  "/docs/",
  "/legal",
  "/privacy",
  "/terms",
  "/cookies",
  "/feed",
  "/rss",
  "/subscribe"
];

function looksLikeNonArticle(url = "") {
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    if (path === "/" || path === "") return true;
    return NON_ARTICLE_PATH_HINTS.some((hint) => path === hint || path.startsWith(hint + "/") || path.endsWith(hint));
  } catch {
    return false;
  }
}

function extractTextWithSpaces($, el) {
  if (!el) return "";
  let result = "";
  $(el).contents().each((_, node) => {
    if (node.type === "text") {
      result += node.data || "";
    } else if (node.type === "tag") {
      result += " " + extractTextWithSpaces($, node) + " ";
    }
  });
  return result.replace(/\s+/g, " ").trim();
}

const TITLE_NOISE_PREFIXES = [
  /^[A-Z][a-z]+\s+\d{1,2},\s+\d{4}\s*/,
  /^\d{1,2}\s+[A-Z][a-z]+\s+\d{4}\s*/,
  /^(Announcements|Product|Policy|Research|News|Newsroom|Blog|Update|Updates)\s+/i
];

function cleanTitle(text = "") {
  let t = text.replace(/\s+/g, " ").trim();
  for (let i = 0; i < 3; i++) {
    let changed = false;
    for (const pattern of TITLE_NOISE_PREFIXES) {
      const next = t.replace(pattern, "");
      if (next !== t) {
        t = next.trim();
        changed = true;
      }
    }
    if (!changed) break;
  }
  return t;
}

function extractImage(item, html = "") {
  if (item.enclosure?.url) return item.enclosure.url;
  const media = item?.["media:content"]?.url || item?.["media:thumbnail"]?.url;
  if (media) return media;
  if (!html) return null;
  const $ = cheerio.load(html);
  return $('meta[property="og:image"]').attr("content") || $("img").first().attr("src") || null;
}

const enrichLimiter = new Bottleneck({ minTime: 250, maxConcurrent: 4 });

async function fetchOgMeta(url) {
  try {
    const { data } = await axios.get(url, {
      timeout: 6000,
      headers: { "User-Agent": "ai-news-aggregator/1.0" },
      maxContentLength: 800_000,
      maxRedirects: 3
    });
    const $ = cheerio.load(data);
    const description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      $('meta[name="twitter:description"]').attr("content") ||
      $("article p").first().text().trim() ||
      $("p").first().text().trim() ||
      "";
    const image =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      null;
    return {
      description: description ? description.replace(/\s+/g, " ").trim().slice(0, 480) : "",
      image
    };
  } catch {
    return { description: "", image: null };
  }
}

async function enrichEntries(entries) {
  const targets = entries.filter((entry) => {
    const desc = (entry.description || "").trim();
    return entry.url && desc.length < 80;
  });
  await Promise.all(
    targets.map((entry) =>
      enrichLimiter.schedule(async () => {
        const { description, image } = await fetchOgMeta(entry.url);
        if (description && description.length > entry.description.length) {
          entry.description = description;
        }
        if (!entry.image && image) {
          entry.image = image;
        }
      })
    )
  );
  try {
    await enrichLimiter.disconnect();
  } catch {
    // ignore disconnect errors
  }
  return entries;
}

function normalizeEntry(source, item) {
  const description = item.contentSnippet || item.summary || item.content || "";
  const rawUrl = item.link || item.guid || "";
  if (!rawUrl || !rawUrl.startsWith("http")) return null;
  const url = rawUrl.split("#")[0];
  return {
    title: cleanTitle(item.title || "") || "Untitled",
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

function normalizeUrlForCompare(url = "") {
  return url.toLowerCase().replace(/\/+$/, "").split("?")[0];
}

function isHomepageUrl(url, source) {
  if (!url || !source?.homepage) return false;
  return normalizeUrlForCompare(url) === normalizeUrlForCompare(source.homepage);
}

function matchesRequiredKeywords(entry, source) {
  if (!source.requireKeywords || source.requireKeywords.length === 0) return true;
  const haystack = `${entry.title} ${entry.description} ${(entry.tags || []).join(" ")}`.toLowerCase();
  return source.requireKeywords.some((kw) => haystack.includes(kw.toLowerCase()));
}

async function fetchWithFallback(source) {
  const rssAttempt = async () => {
    if (!source.rss) {
      throw new Error("No RSS configured");
    }
    const feed = await parser.parseURL(source.rss);
    return (feed.items || [])
      .slice(0, 25)
      .map((item) => normalizeEntry(source, item))
      .filter(Boolean)
      .filter((entry) => !isHomepageUrl(entry.url, source))
      .filter((entry) => matchesRequiredKeywords(entry, source))
      .slice(0, 15);
  };

  const htmlFallback = async () => {
    const response = await axios.get(source.homepage, {
      timeout: 15000,
      headers: { "User-Agent": "ai-news-aggregator/1.0" }
    });
    const $ = cheerio.load(response.data);
    const articles = [];
    $("article, .post, li").each((_, el) => {
      const headingEl = $(el).find("h1, h2, h3, h4").first();
      const anchorEl = $(el).find("a[href]").first();
      let title = headingEl.length
        ? extractTextWithSpaces($, headingEl[0])
        : anchorEl.length
          ? extractTextWithSpaces($, anchorEl[0])
          : "";
      title = cleanTitle(title);
      const link = anchorEl.attr("href");
      if (!title || !link) return;
      let absLink;
      try {
        absLink = link.startsWith("http")
          ? link
          : new URL(link, source.homepage).toString();
      } catch {
        return;
      }
      absLink = absLink.split("#")[0];
      if (!/^https?:\/\//i.test(absLink)) return;
      if (isHomepageUrl(absLink, source)) return;
      if (looksLikeNonArticle(absLink)) return;

      const descEl = $(el).find("p").first();
      const description = descEl.length ? extractTextWithSpaces($, descEl[0]) : "";
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
    return articles
      .filter((entry) => matchesRequiredKeywords(entry, source))
      .slice(0, 10);
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

  const homepageSet = new Set(SOURCES.map((s) => normalizeUrlForCompare(s.homepage)));
  const dedupeSet = new Set();
  const items = perSource
    .flat()
    .filter((item) => isValidArticleUrl(item.url))
    .filter((item) => !homepageSet.has(normalizeUrlForCompare(item.url)))
    .filter((item) => !looksLikeNonArticle(item.url))
    .filter((item) => !isLikelyJunkTitle(item.title))
    .filter((item) => {
      const key = `${item.url}|${item.title}`.toLowerCase();
      if (dedupeSet.has(key)) return false;
      dedupeSet.add(key);
      return true;
    });

  await enrichEntries(items);
  logger.info({ total: items.length }, "Articles enriched with og metadata");

  try {
    await limiter.disconnect();
  } catch {
    // ignore disconnect errors
  }

  return {
    runAt,
    total: items.length,
    items
  };
}
