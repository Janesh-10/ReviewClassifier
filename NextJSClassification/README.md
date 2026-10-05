# Customer Review Scraper & Sentiment Classifier (Next.js 16)

A unified **Next.js 16** application combining the React 19 frontend dashboard, Playwright browser scraper, and OpenRouter AI sentiment classification API into a single full-stack project.

---

## What It Does

1. **Integrated Full-Stack Architecture**: Both the interactive UI and server-side API routes run on a single Next.js server (`http://localhost:3000`), completely eliminating CORS configuration and multiple running processes.
2. **Playwright Dynamic Scraping**: Runs a headless Chromium browser on the server via `GET /api/reviews` to scrape reviews directly from the [Circuit Market Demo Store](https://circuit-market-demo.vercel.app/reviews).
3. **AI Sentiment Classification**: Evaluates customer reviews using the OpenRouter `typesafe/jev-1.13` decision model via `POST /api/classified`.
4. **Interactive Dashboard**: Initially empty table with real-time status alerts, incremental sentiment badges (`Good`, `Bad`, `Neutral`, `Mixed`), and error handling.

---

## Project Structure

```text
NextJSClassification/
├── .env.local              # Local environment variables (OPENROUTER_API_KEY)
├── .env.example            # Environment template
├── .gitignore              # Next.js & Playwright ignore rules
├── next.config.js          # Next.js 16 config with serverExternalPackages
├── package.json            # Dependencies and npm scripts (Next 16, React 19)
├── jsconfig.json           # Path alias (@/*)
├── app/
│   ├── layout.jsx          # Root layout
│   ├── page.jsx            # Interactive dashboard (table & action buttons)
│   ├── globals.css         # Styling for table, badges, buttons, and alerts
│   └── api/
│       ├── reviews/
│       │   └── route.js    # GET /api/reviews: Scrapes reviews via Playwright
│       └── classified/
│           └── route.js    # POST /api/classified: Classifies sentiment via OpenRouter
└── lib/
    ├── scraper.js          # Playwright scraping logic
    └── classifier.js       # OpenRouter AI decision client
```

---

## Prerequisites & Setup

Ensure you have **Node.js** (v18 or higher) installed.

### 1. Install Dependencies

Open a terminal inside this directory (`NextJSClassification`):

```bash
npm install
npx playwright install chromium
```

### 2. Configure Environment Variables

The `.env.local` file is already created for you with your API key. If needed, update your OpenRouter API key inside:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

_(You can obtain a key from [OpenRouter.ai](https://openrouter.ai))_

---

## How to Run

### Development Mode

Start the Next.js development server:

```bash
npm run dev
```

Open your browser and navigate to:

```
http://localhost:3000
```

### Production Build

To test or run a production build:

```bash
npm run build
npm start
```

---

## API Endpoints

- `GET /api/reviews` — Launches Playwright to scrape Circuit Market reviews and returns `[ { "id": 1, "review": "..." }, ... ]`.
- `POST /api/classified` — Accepts `{ "id": 1, "review": "text" }` in the JSON body and returns `{ "id": 1, "review": "text", "classification": "Good|Bad|Neutral|Mixed" }`.
