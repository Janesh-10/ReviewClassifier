const path = require("path");
const { chromium } = require("playwright");
const axios = require("axios");
require("dotenv").config({ path: path.join(__dirname, ".env") });

async function scrapeReviews() {
  console.log("Launching browser (headless)...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log(
    "Navigating to https://circuit-market-demo.vercel.app/reviews...",
  );
  await page.goto("https://circuit-market-demo.vercel.app/reviews", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("section[data-review-total]");

  const totalReviews = parseInt(
    await page
      .locator("section[data-review-total]")
      .getAttribute("data-review-total"),
    10,
  );
  console.log(`Total reviews expected: ${totalReviews}`);

  const loadMoreBtn = page.locator('button:has-text("Load more")');

  // Loop to click until all reviews are loaded
  while (true) {
    const reviews = await page.locator("article p").allInnerTexts();
    console.log(`Currently loaded: ${reviews.length} / ${totalReviews}`);

    if (reviews.length >= totalReviews) break;

    const isVisible = await loadMoreBtn.isVisible().catch(() => false);
    if (!isVisible) {
      console.log("Load more button no longer visible.");
      break;
    }

    // Click and wait briefly for the DOM to update with new reviews
    const prevCount = reviews.length;
    await loadMoreBtn.click();

    try {
      // Wait until the count of paragraphs increases
      await page.waitForFunction(
        (expected) => document.querySelectorAll("article p").length > expected,
        prevCount,
        { timeout: 10000 },
      );
    } catch {
      // If it times out, break out to prevent infinite loops if the button stalls
      console.log("Timeout waiting for more reviews to render.");
      break;
    }
  }

  // Grab final list of reviews
  const reviews = await page.locator("article p").allInnerTexts();
  console.log(`Completed scraping! Total collected: ${reviews.length}`);
  await browser.close();

  const data = reviews.map((text, index) => ({ id: index + 1, review: text }));
  return data;
}

async function classifyReviews(input, reviewText) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY not found in .env or environment variables.",
    );
  }

  const id = typeof input === "object" && input !== null ? input.id : input;
  const review =
    typeof input === "object" && input !== null ? input.review : reviewText;

  if (!review) {
    throw new Error("Invalid input: expected review text.");
  }

  const url = "https://openrouter.ai/api/alpha/decisions";
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Sentiment Classifier",
  };

  const payload = {
    model: "typesafe/jev-1.13",
    state: {
      review: review,
    },
    questions: {
      sentiment: {
        type: "choice",
        instructions:
          "Classify the sentiment of the customer review into Good, Bad, Neutral, or Mixed.",
        criteria: {
          Good: "The review is good, positive, expresses satisfaction, praise, or happiness with the product.",
          Bad: "The review is bad, negative, expresses defect, breakage, disappointment, or complaint.",
          Neutral:
            "The review is neutral, neither good nor bad, objective, descriptive, or factual.",
          Mixed:
            "The review contains both good and bad things, mixed sentiment, or pros and cons.",
        },
      },
    },
  };

  let sentiment = "Neutral";
  try {
    const response = await axios.post(url, payload, {
      headers,
      timeout: 30000,
    });
    sentiment = response.data?.answers?.sentiment?.choice || "Neutral";
  } catch (err) {
    const errorMsg = err.response?.data?.error?.message || err.message;
    console.error(`Error classifying review #${id}: ${errorMsg}`);
  }

  return {
    id,
    review,
    classification: sentiment,
  };
}

module.exports = {
  scrapeReviews,
  classifyReviews,
};
