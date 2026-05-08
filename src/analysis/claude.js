import { VALID_CATEGORIES } from "../config/sources.js";
import { translateBatch } from "./translate.js";
import { logger } from "../utils/logger.js";

function localSemanticDedup(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.title}`.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const CATEGORY_KEYWORDS = {
  "LLM": ["llm", "gpt", "claude", "gemini", "model", "reasoning"],
  "Coding AI": ["code", "coding", "dev", "ide", "copilot", "cursor", "agent", "sdk"],
  "Open Source": ["open source", "oss", "github", "community", "weights"],
  "Agentic AI": ["agent", "workflow", "automation", "tool use", "multi-step"],
  "Benchmark": ["benchmark", "eval", "leaderboard", "sota", "score"],
  "Enterprise AI": [
    "enterprise",
    "business",
    "b2b",
    "compliance",
    "aws",
    "bedrock",
    "sagemaker",
    "trainium",
    "inferentia",
    "amazon q",
    "rekognition"
  ],
  "Robotics": ["robot", "robotics", "embodied"],
  "AI Video": ["video", "sora", "generation video"],
  "AI Image": ["image", "diffusion", "vision", "text-to-image"],
  "AI Security": [
    "security",
    "safety",
    "alignment",
    "jailbreak",
    "adversarial",
    "red team",
    "red-team",
    "prompt injection",
    "vulnerability",
    "exploit",
    "threat model",
    "guardrails",
    "hidden layer",
    "lakera",
    "protect ai",
    "model risk",
    "deepfake",
    "abuse",
    "data poisoning",
    "model extraction"
  ],
  "AI Design": [
    "design",
    "figma",
    "canva",
    "adobe",
    "framer",
    "webflow",
    "spline",
    "sketch",
    "runway",
    "midjourney",
    "stability",
    "stable diffusion",
    "leonardo",
    "ideogram",
    "krea",
    "recraft",
    "firefly",
    "ux",
    "ui",
    "prototype",
    "wireframe",
    "creative",
    "brand",
    "logo",
    "illustration",
    "generative art",
    "text-to-image",
    "image generation",
    "video generation"
  ]
};

function inferCategory(item) {
  const text = `${item.title} ${item.description} ${(item.tags || []).join(" ")}`.toLowerCase();
  let bestCategory = item.categoryHint || "LLM";
  let bestHits = 0;

  for (const category of VALID_CATEGORIES) {
    const keywords = CATEGORY_KEYWORDS[category] || [];
    const hits = keywords.reduce((acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0);
    if (hits > bestHits) {
      bestHits = hits;
      bestCategory = category;
    }
  }
  return bestCategory;
}

function computeScore(item, category) {
  let score = 4;
  const title = (item.title || "").toLowerCase();
  const desc = (item.description || "").toLowerCase();
  const dateMs = Date.parse(item.date || "");
  const ageHours = Number.isNaN(dateMs) ? 999 : (Date.now() - dateMs) / (1000 * 60 * 60);

  if (
    [
      "OpenAI Blog",
      "Anthropic News",
      "HuggingFace",
      "Cursor Changelog",
      "AWS Machine Learning Blog",
      "Amazon Science"
    ].includes(item.source)
  ) {
    score += 2;
  }
  if (ageHours <= 24) score += 1.5;
  if (ageHours <= 6) score += 0.5;
  if (item.engagement) score += 1;
  if (/(launch|release|introducing|announc|new)/.test(`${title} ${desc}`)) score += 1;
  if (["LLM", "Agentic AI", "Coding AI", "Benchmark", "AI Security"].includes(category)) score += 0.5;

  return Math.max(1, Math.min(10, Math.round(score)));
}

function extractKeywords(item) {
  const text = `${item.title} ${item.description} ${(item.tags || []).join(" ")}`.toLowerCase();
  const tokens = text
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((x) => x.length >= 4);

  const stop = new Set(["with", "from", "that", "this", "have", "will", "your", "about", "into", "more", "than", "what", "when"]);
  const freq = new Map();
  for (const t of tokens) {
    if (stop.has(t)) continue;
    freq.set(t, (freq.get(t) || 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word);
}

function translateToItalianLocal(text = "") {
  const replacements = [
    [/update published by/gi, "aggiornamento pubblicato da"],
    [/introducing/gi, "presentazione"],
    [/release introduces/gi, "rilascio introduce"],
    [/this release/gi, "questo rilascio"],
    [/learn how/gi, "scopri come"],
    [/now available/gi, "ora disponibile"],
    [/open-source/gi, "open source"],
    [/security/gi, "sicurezza"],
    [/partnership/gi, "partnership"],
    [/agents/gi, "agenti"],
    [/model/gi, "modello"],
    [/models/gi, "modelli"]
  ];

  let out = text;
  for (const [pattern, value] of replacements) {
    out = out.replace(pattern, value);
  }
  return out;
}

function buildEnglishSummary(item) {
  const base = (item.description || "").replace(/\s+/g, " ").trim();

  if (item.source === "Hacker News AI") {
    if (!base || base.startsWith("Article URL")) {
      return `Community signal from Hacker News: ${item.title}.`;
    }
    return base.length > 360 ? `${base.slice(0, 360).trim()}…` : base;
  }

  if (!base) {
    return `${item.title}. Update published by ${item.source}.`;
  }

  return base.length > 360 ? `${base.slice(0, 360).trim()}…` : base;
}

function buildItalianSummary(item) {
  const base = (item.description || "").replace(/\s+/g, " ").trim();

  if (item.source === "Hacker News AI") {
    if (!base || base.startsWith("Article URL")) {
      return `Segnalazione dalla community di Hacker News: ${item.title}.`;
    }
    return translateToItalianLocal(base).slice(0, 360);
  }

  if (!base) {
    return `${item.title}. Aggiornamento pubblicato da ${item.source}.`;
  }

  const translated = translateToItalianLocal(base);
  return translated.length > 360 ? `${translated.slice(0, 360).trim()}…` : translated;
}

export async function analyzeNews(items) {
  const deduped = localSemanticDedup(items);
  const intermediate = deduped.map((item) => {
    const category = inferCategory(item);
    const summaryEn = buildEnglishSummary(item);
    const fallbackSummaryIt = buildItalianSummary(item);
    return {
      title: item.title,
      source: item.source,
      url: item.url,
      summaryEn,
      fallbackSummaryIt,
      score: computeScore(item, category),
      category,
      date: item.date,
      image: item.image || null,
      keywords: extractKeywords(item)
    };
  });

  let translations = {};
  try {
    translations = await translateBatch(intermediate);
  } catch (err) {
    logger.warn({ err: err.message }, "Translation batch unavailable, using local fallback");
    translations = {};
  }

  return intermediate.map((item) => {
    const key = item.url || `${item.source}::${item.title}`;
    const t = translations[key];
    const titleIt = t?.titleIt || item.title;
    const summaryIt = t?.summaryIt || item.fallbackSummaryIt;
    return {
      title: item.title,
      titleIt,
      source: item.source,
      url: item.url,
      summary: item.summaryEn,
      summaryEn: item.summaryEn,
      summaryIt,
      score: item.score,
      category: item.category,
      date: item.date,
      image: item.image,
      keywords: item.keywords
    };
  });
}
