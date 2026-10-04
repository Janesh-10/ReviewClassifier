const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { scrapeReviews, classifyReviews } = require('./scrape_reviews');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Review Scraper & Sentiment Classification API is running',
    endpoints: {
      health: 'GET /health',
      reviews: 'GET /reviews (scrapes and returns reviews directly as JSON)',
      classified: 'POST /classified (receives { id, review } in JSON body and returns { id, review, classification })'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Scrape and return reviews directly as JSON response
app.get('/reviews', async (req, res) => {
  try {
    console.log('GET /reviews received. Scraping reviews...');
    const reviews = await scrapeReviews();
    res.json(reviews);
  } catch (err) {
    console.error('Error scraping reviews:', err);
    res.status(500).json({ error: 'Failed to scrape reviews', details: err.message });
  }
});

// Classify review endpoint: receives { id, review } in JSON request body and returns { id, review, classification }
app.post('/classified', async (req, res) => {
  try {
    const { id, review } = req.body || {};
    if (!review) {
      return res.status(400).json({
        error: 'Invalid request body. Expected JSON with "review" (and optional "id").'
      });
    }

    console.log(`POST /classified received for review id: ${id !== undefined ? id : 'N/A'}`);
    const result = await classifyReviews(req.body);
    res.json(result);
  } catch (err) {
    console.error('Error classifying review:', err);
    res.status(500).json({ error: 'Failed to classify review', details: err.message });
  }
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} (http://localhost:${PORT})`);
  });
}

module.exports = app;
