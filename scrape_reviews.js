const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const axios = require("axios");
require("dotenv").config({ path: path.join(__dirname, ".env") });

async function scrapeReviews(outputFile = "reviews.json") {
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

  // Save to file
  const data = reviews.map((text, index) => ({ id: index + 1, review: text }));
  const outputPath = path.join(__dirname, outputFile);
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Saved reviews to ${outputPath}`);
  return data;
}

async function classifyReviews(
  inputFile = "reviews.json",
  outputFile = "classified.json",
) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY not found in .env or environment variables.",
    );
  }

  const inputPath = path.join(__dirname, inputFile);
  if (!fs.existsSync(inputPath)) {
    console.log(`${inputFile} not found. Running scraper first...`);
    await scrapeReviews(inputFile);
  }

  const reviewsData = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
  const totalCount = reviewsData.length;
  console.log(
    `\nClassifying ${totalCount} reviews sequentially using OpenRouter (typesafe/jev-1.13) via axios...`,
  );

  const url = "https://openrouter.ai/api/alpha/decisions";
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Sentiment Classifier",
  };

  const results = [];

  // Sequential processing without concurrency
  for (const item of reviewsData) {
    const payload = {
      model: "typesafe/jev-1.13",
      state: {
        review: item.review,
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
      console.error(`Error classifying review #${item.id}: ${errorMsg}`);
    }

    results.push({
      id: item.id,
      review: item.review,
      sentiment: sentiment,
    });

    if (item.id % 10 === 0 || item.id === totalCount) {
      console.log(`Classified ${item.id}/${totalCount} reviews...`);
    }
  }

  // Save to classified.json
  const outputPath = path.join(__dirname, outputFile);
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`\nSuccessfully saved classified reviews to ${outputPath}`);

  // Print summary counts
  const sentimentCounts = {};
  for (const item of results) {
    sentimentCounts[item.sentiment] =
      (sentimentCounts[item.sentiment] || 0) + 1;
  }
  console.log("Sentiment summary:", sentimentCounts);
}

async function main() {
  await scrapeReviews();
  await classifyReviews();
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Execution error:", err);
    process.exit(1);
  });
}

module.exports = {
  scrapeReviews,
  classifyReviews,
};
