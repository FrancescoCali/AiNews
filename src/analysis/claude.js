import { VALID_CATEGORIES } from "../config/sources.js";

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
  "Enterprise AI": ["enterprise", "business", "b2b", "compliance", "security"],
  "Robotics": ["robot", "robotics", "embodied"],
  "AI Video": ["video", "sora", "generation video"],
  "AI Image": ["image", "diffusion", "vision", "text-to-image"]
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

  if (["OpenAI Blog", "Anthropic News", "HuggingFace", "Cursor Changelog"].includes(item.source)) score += 2;
  if (ageHours <= 24) score += 1.5;
  if (ageHours <= 6) score += 0.5;
  if (item.engagement) score += 1;
  if (/(launch|release|introducing|announc|new)/.test(`${title} ${desc}`)) score += 1;
  if (["LLM", "Agentic AI", "Coding AI", "Benchmark"].includes(category)) score += 0.5;

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

function buildSummary(item) {
  const base = (item.description || "").replace(/\s+/g, " ").trim();
  if (!base) return `${item.title} - update published by ${item.source}.`;
  return base.slice(0, 240);
}

export async function analyzeNews(items) {
  const deduped = localSemanticDedup(items);
  return deduped.map((item) => {
    const category = inferCategory(item);
    return {
      title: item.title,
      source: item.source,
      url: item.url,
      summary: buildSummary(item),
      score: computeScore(item, category),
      category,
      date: item.date,
      image: item.image || null,
      keywords: extractKeywords(item)
    };
  });
}
