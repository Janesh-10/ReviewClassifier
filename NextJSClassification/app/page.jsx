"use client";

import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [reviews, setReviews] = useState([]);
  const [isScraping, setIsScraping] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // 1. Scrape reviews via Next.js API route (/api/reviews)
  const handleScrapeReviews = async () => {
    try {
      setIsScraping(true);
      setErrorMessage("");
      setStatusMessage(
        "Scraping reviews from Circuit Market... Please wait (this takes a few seconds).",
      );

      const response = await axios.get("/api/reviews");
      const data = response.data || [];

      const formatted = data.map((item) => ({
        id: item.id,
        review: item.review,
        classification: item.classification || "",
      }));

      setReviews(formatted);
      setStatusMessage(`Successfully scraped ${formatted.length} reviews.`);
    } catch (err) {
      console.error("Error scraping reviews:", err);
      const msg =
        err.response?.data?.error || err.message || "Failed to scrape reviews.";
      setErrorMessage(`Error: ${msg}`);
      setStatusMessage("");
    } finally {
      setIsScraping(false);
    }
  };

  // 2. Classify reviews sequentially via Next.js API route (/api/classified)
  const handleClassifyReviews = async () => {
    if (reviews.length === 0) {
      setErrorMessage("Please scrape reviews first before classifying.");
      return;
    }

    try {
      setIsClassifying(true);
      setErrorMessage("");
      setStatusMessage(
        `Starting classification for ${reviews.length} reviews...`,
      );

      const updated = [...reviews];

      for (let i = 0; i < updated.length; i++) {
        const item = updated[i];
        setStatusMessage(
          `Classifying review ${i + 1} of ${updated.length} (ID: ${item.id})...`,
        );

        try {
          const response = await axios.post("/api/classified", {
            id: item.id,
            review: item.review,
          });

          const result = response.data;
          updated[i] = {
            ...item,
            classification: result.classification || "Neutral",
          };
          // Update table incrementally as each review finishes
          setReviews([...updated]);
        } catch (itemErr) {
          console.error(`Failed to classify review #${item.id}:`, itemErr);
          updated[i] = {
            ...item,
            classification: "Error",
          };
          setReviews([...updated]);
        }
      }

      setStatusMessage(
        `Classification completed for all ${updated.length} reviews.`,
      );
    } catch (err) {
      console.error("Error during classification:", err);
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Failed to classify reviews.";
      setErrorMessage(`Error: ${msg}`);
    } finally {
      setIsClassifying(false);
    }
  };

  const getBadgeClass = (classification) => {
    switch (classification?.toLowerCase()) {
      case "good":
        return "badge badge-good";
      case "bad":
        return "badge badge-bad";
      case "neutral":
        return "badge badge-neutral";
      case "mixed":
        return "badge badge-mixed";
      case "error":
        return "badge badge-error";
      default:
        return "badge badge-pending";
    }
  };

  return (
    <div className="container">
      <header className="app-header">
        <h1>Customer Reviews & Sentiment Classifier</h1>
        <p>
          Scrape reviews with Playwright and classify sentiment using OpenRouter
          AI in Next.js
        </p>
      </header>

      {/* Action Buttons */}
      <div className="controls">
        <button
          className="btn btn-primary"
          onClick={handleScrapeReviews}
          disabled={isScraping || isClassifying}
        >
          {isScraping ? "Scraping..." : "Scrape Reviews"}
        </button>

        <button
          className="btn btn-success"
          onClick={handleClassifyReviews}
          disabled={isScraping || isClassifying || reviews.length === 0}
        >
          {isClassifying ? "Classifying..." : "Classify Reviews"}
        </button>
      </div>

      {/* Status & Error Alerts */}
      {statusMessage && <div className="alert alert-info">{statusMessage}</div>}
      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

      {/* Reviews Table */}
      <div className="table-responsive">
        <table className="reviews-table">
          <thead>
            <tr>
              <th style={{ width: "80px" }}>ID</th>
              <th>Review Text</th>
              <th style={{ width: "150px" }}>Classification</th>
            </tr>
          </thead>
          <tbody>
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={3} className="empty-state">
                  No reviews loaded yet. Click <strong>"Scrape Reviews"</strong>{" "}
                  to fetch data.
                </td>
              </tr>
            ) : (
              reviews.map((item) => (
                <tr key={item.id}>
                  <td className="review-id">{item.id}</td>
                  <td className="review-text">{item.review}</td>
                  <td className="review-classification">
                    <span className={getBadgeClass(item.classification)}>
                      {item.classification || "Not Classified"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
