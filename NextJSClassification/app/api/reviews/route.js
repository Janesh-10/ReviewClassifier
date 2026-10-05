import { NextResponse } from "next/server";
import { scrapeReviews } from "@/lib/scraper";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("GET /api/reviews received. Scraping reviews...");
    const reviews = await scrapeReviews();
    return NextResponse.json(reviews);
  } catch (err) {
    console.error("Error in /api/reviews:", err);
    return NextResponse.json(
      { error: "Failed to scrape reviews", details: err.message },
      { status: 500 },
    );
  }
}
