import { chromium } from "playwright";

export async function scrapeReviews() {
  console.log("Launching browser (headless)...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
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

    while (true) {
      const reviews = await page.locator("article p").allInnerTexts();
      console.log(`Currently loaded: ${reviews.length} / ${totalReviews}`);

      if (reviews.length >= totalReviews) break;

      const isVisible = await loadMoreBtn.isVisible().catch(() => false);
      if (!isVisible) {
        console.log("Load more button no longer visible.");
        break;
      }

      const prevCount = reviews.length;
      await Promise.all([
        page
          .waitForResponse(
            (res) => res.url().includes("/api/reviews") && res.status() === 200,
            { timeout: 15000 },
          )
          .catch(() => null),
        loadMoreBtn.click(),
      ]);

      try {
        await page.waitForFunction(
          (expected) =>
            document.querySelectorAll("article p").length > expected,
          prevCount,
          { timeout: 15000 },
        );
      } catch {
        console.log("Timeout waiting for more reviews to render.");
        break;
      }
    }

    const reviews = await page.locator("article p").allInnerTexts();
    console.log(`Completed scraping! Total collected: ${reviews.length}`);

    const data = reviews.map((text, index) => ({
      id: index + 1,
      review: text,
    }));
    return data;
  } finally {
    await browser.close();
  }
}
