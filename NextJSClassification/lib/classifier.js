import axios from "axios";

export async function classifyReview({ id, review }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not found in environment variables.");
  }

  if (!review) {
    throw new Error("Invalid input: review text is required.");
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
