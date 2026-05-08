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
  },
  {
    id: "figma-blog",
    name: "Figma Blog",
    categoryHint: "AI Design",
    rss: "https://www.figma.com/blog/feed/",
    homepage: "https://www.figma.com/blog/"
  },
  {
    id: "canva-newsroom",
    name: "Canva Newsroom",
    categoryHint: "AI Design",
    rss: null,
    homepage: "https://www.canva.com/newsroom/news/"
  },
  {
    id: "adobe-blog",
    name: "Adobe Blog",
    categoryHint: "AI Design",
    rss: null,
    homepage: "https://blog.adobe.com/en/topics/ai"
  },
  {
    id: "framer-blog",
    name: "Framer Blog",
    categoryHint: "AI Design",
    rss: null,
    homepage: "https://www.framer.com/blog/"
  },
  {
    id: "webflow-blog",
    name: "Webflow Blog",
    categoryHint: "AI Design",
    rss: null,
    homepage: "https://webflow.com/blog"
  },
  {
    id: "spline-blog",
    name: "Spline",
    categoryHint: "AI Design",
    rss: null,
    homepage: "https://spline.design/blog"
  },
  {
    id: "sketch-blog",
    name: "Sketch Blog",
    categoryHint: "AI Design",
    rss: "https://www.sketch.com/blog/feed/",
    homepage: "https://www.sketch.com/blog/"
  },
  {
    id: "runway-news",
    name: "Runway",
    categoryHint: "AI Design",
    rss: null,
    homepage: "https://runwayml.com/news"
  },
  {
    id: "midjourney-updates",
    name: "Midjourney Updates",
    categoryHint: "AI Design",
    rss: null,
    homepage: "https://www.midjourney.com/updates"
  },
  {
    id: "stability-ai-news",
    name: "Stability AI News",
    categoryHint: "AI Design",
    rss: null,
    homepage: "https://stability.ai/news"
  },
  {
    id: "leonardo-ai",
    name: "Leonardo AI",
    categoryHint: "AI Design",
    rss: null,
    homepage: "https://leonardo.ai/news/"
  },
  {
    id: "ideogram-blog",
    name: "Ideogram",
    categoryHint: "AI Design",
    rss: null,
    homepage: "https://about.ideogram.ai/"
  },
  {
    id: "krea-blog",
    name: "Krea AI",
    categoryHint: "AI Design",
    rss: null,
    homepage: "https://www.krea.ai/blog"
  },
  {
    id: "recraft-blog",
    name: "Recraft",
    categoryHint: "AI Design",
    rss: null,
    homepage: "https://www.recraft.ai/blog"
  },
  {
    id: "smashing-magazine",
    name: "Smashing Magazine",
    categoryHint: "AI Design",
    rss: "https://www.smashingmagazine.com/feed/",
    homepage: "https://www.smashingmagazine.com/"
  },
  {
    id: "aws-ml-blog",
    name: "AWS Machine Learning Blog",
    categoryHint: "Enterprise AI",
    rss: "https://aws.amazon.com/blogs/machine-learning/feed/",
    homepage: "https://aws.amazon.com/blogs/machine-learning/"
  },
  {
    id: "amazon-science",
    name: "Amazon Science",
    categoryHint: "LLM",
    rss: "https://www.amazon.science/index.rss",
    homepage: "https://www.amazon.science/blog"
  },
  {
    id: "aws-whats-new",
    name: "AWS What's New",
    categoryHint: "Enterprise AI",
    rss: null,
    homepage: "https://aws.amazon.com/about-aws/whats-new/recent/"
  },
  {
    id: "hiddenlayer-blog",
    name: "HiddenLayer",
    categoryHint: "AI Security",
    rss: null,
    homepage: "https://hiddenlayer.com/innovation-hub/"
  },
  {
    id: "lakera-blog",
    name: "Lakera AI",
    categoryHint: "AI Security",
    rss: null,
    homepage: "https://www.lakera.ai/blog"
  },
  {
    id: "protect-ai-blog",
    name: "Protect AI",
    categoryHint: "AI Security",
    rss: null,
    homepage: "https://protectai.com/blog"
  },
  {
    id: "schneier-security",
    name: "Schneier on Security",
    categoryHint: "AI Security",
    rss: "https://www.schneier.com/feed/atom/",
    homepage: "https://www.schneier.com/",
    requireKeywords: ["ai", "artificial intelligence", "machine learning", "llm", "chatgpt", "gpt", "claude", "deepfake", "model", "llama", "agent"]
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
  "AI Image",
  "AI Design",
  "AI Security"
];
