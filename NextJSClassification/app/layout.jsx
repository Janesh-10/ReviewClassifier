import "./globals.css";

export const metadata = {
  title: "Customer Reviews & Sentiment Classifier",
  description:
    "Scrape customer reviews with Playwright and classify sentiment using OpenRouter AI in Next.js.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
