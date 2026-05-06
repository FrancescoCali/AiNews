export const SOURCES = [
  {
    id: "openai-blog",
    name: "OpenAI Blog",
    categoryHint: "LLM",
    rss: "https://openai.com/news/rss.xml",
    homepage: "https://openai.com/news/"
  },
  {
    id: "anthropic-news",
    name: "Anthropic News",
    categoryHint: "LLM",
    rss: null,
    homepage: "https://www.anthropic.com/news"
  },
  {
    id: "huggingface-blog",
    name: "HuggingFace",
    categoryHint: "Open Source",
    rss: "https://huggingface.co/blog/feed.xml",
    homepage: "https://huggingface.co/blog"
  },
  {
    id: "hackernews-ai",
    name: "Hacker News AI",
    categoryHint: "Coding AI",
    rss: "https://hnrss.org/newest?q=AI",
    homepage: "https://news.ycombinator.com/"
  },
  {
    id: "reddit-ai",
    name: "Reddit AI Communities",
    categoryHint: "Agentic AI",
    rss: "https://www.reddit.com/r/artificial/.rss",
    homepage: "https://www.reddit.com/r/artificial/"
  },
  {
    id: "cursor-changelog",
    name: "Cursor Changelog",
    categoryHint: "Coding AI",
    rss: "https://cursor.com/changelog/rss.xml",
    homepage: "https://cursor.com/changelog"
  },
  {
    id: "perplexity-blog",
    name: "Perplexity Blog",
    categoryHint: "Enterprise AI",
    rss: null,
    homepage: "https://www.perplexity.ai/hub/blog"
  },
  {
    id: "langchain-changelog",
    name: "LangChain Changelog",
    categoryHint: "Agentic AI",
    rss: "https://changelog.langchain.com/feed.xml",
    homepage: "https://changelog.langchain.com/"
  }
];

export const VALID_CATEGORIES = [
  "LLM",
  "Coding AI",
  "Open Source",
  "Agentic AI",
  "Benchmark",
  "Enterprise AI",
  "Robotics",
  "AI Video",
  "AI Image"
];
