# AI News Aggregator Platform (100% Free Mode)

Piattaforma autonoma che esegue ogni giorno scraping AI news, analisi locale gratuita (senza API key), generazione dashboard HTML (Tailwind) e deploy automatico su GitHub Pages.

## Stack

- Apify-ready modular scraper (`src/apify/main.js`)
- Workflow orchestration con `parallel.workflow.json`
- Analisi e sintesi locale rule-based (`src/analysis/claude.js`)
- Frontend statico moderno in `public/index.html`
- Deploy automatico su GitHub Pages via GitHub Actions

## Struttura progetto

```txt
.
├─ .github/workflows/daily-news.yml
├─ data/
│  ├─ raw-news.json
│  ├─ news.json
│  └─ analytics.json
├─ public/
│  └─ index.html
├─ src/
│  ├─ apify/main.js
│  ├─ analysis/claude.js
│  ├─ config/sources.js
│  ├─ frontend/template.js
│  ├─ pipeline/build-digest.js
│  ├─ scraping/collector.js
│  └─ utils/{io.js,logger.js}
├─ parallel.workflow.json
├─ package.json
└─ vercel.json
```

## Requisiti

- Node.js 20+
- Repository GitHub con Pages abilitato

## Setup

1. Installa dipendenze:
   ```bash
   npm install
   ```
2. Copia variabili ambiente:
   ```bash
   cp .env.example .env
   ```
3. Compila pipeline completa in locale:
   ```bash
   npm run build:all
   ```

## Output JSON finale

Il file `data/news.json` contiene array di oggetti nel formato:

```json
{
  "title": "string",
  "source": "string",
  "url": "string",
  "summary": "string",
  "score": 1,
  "category": "LLM",
  "date": "2026-05-06T09:00:00.000Z",
  "image": "string|null",
  "keywords": ["string"]
}
```

## Scheduling giornaliero 09:00

- `parallel.workflow.json`: schedule `30 8 * * *` timezone `Europe/Rome`
- `.github/workflows/daily-news.yml`: doppio cron UTC (`30 6 * * *` e `30 7 * * *`) per coprire ora legale e ora solare italiana (08:30 Italia).

## Ottimizzazioni implementate

- Retry scraping (`p-retry`)
- Anti-rate-limit (`bottleneck`)
- Fallback RSS -> scraping HTML
- Deduplica semantica locale + classificazione/score locale
- Cache dati locali (`data/raw-news.json`, `data/news.json`)
- Logging strutturato (`pino`)
- Analytics base run-by-run (`data/analytics.json`)

## Fonti integrate

- OpenAI Blog
- Anthropic News
- HuggingFace
- Hacker News AI
- Reddit AI communities
- Cursor changelog
- Perplexity blog
- LangChain changelog

## Deploy gratuito su GitHub Pages

Nessun token custom richiesto.

1. Pusha il repository su GitHub
2. Vai su `Settings -> Pages`
3. Source: **GitHub Actions**
4. Abilita workflow Actions

Da quel momento l'update quotidiano e la pubblicazione sono automatici.
