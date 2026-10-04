# Review Scraper & Sentiment Classifier

Automated tool to scrape customer reviews using Playwright and classify review sentiment using OpenRouter AI.

## What It Does

1. **Scrapes Reviews**: Automates browser navigation to scrape all 100 customer reviews from the [Circuit Market Demo](https://circuit-market-demo.vercel.app/reviews) and saves them with sequential IDs into `reviews.json`.
2. **Classifies Sentiment**: Sequentially evaluates each review's sentiment (`Good`, `Bad`, `Neutral`, or `Mixed`) using the OpenRouter `typesafe/jev-1.13` decision model and outputs the results to `classified.json`.

---

## Prerequisites & Setup

### 1. Install Dependencies

```bash
cd Backend
npm install
npx playwright install chromium
```

### 2. Configure Environment Variables

Create a `.env` file in the `Backend` directory:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

---

## How to Run

Start the Express API server:

```bash
cd Backend
npm start
```

*(or run `node server.js` from within the `Backend` directory)*

### API Endpoints

- `GET /reviews`: Scrapes all reviews from Circuit Market and returns them directly as JSON.
- `POST /classified`: Accepts JSON `{ "id": 1, "review": "text" }` (or an array) and returns `{ "id": 1, "review": "text", "classification": "Good|Bad|Neutral|Mixed" }`.
