const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Simple health check (optional)
app.get("/", (req, res) => {
  res.send("Review backend is running");
});

app.post("/generate-reply", async (req, res) => {
  try {
    const { reviewText, rating, productName, tone } = req.body;

    console.log("📩 /generate-reply called with:", {
      reviewText,
      rating,
      productName,
      tone,
    });

    const systemPrompt = `
You are an assistant helping Amazon sellers reply to customer reviews.

Rules:
- Be polite, empathetic, and concise (3–6 sentences).
- Never offer discounts, gift cards, or incentives for changing reviews.
- Never ask for a positive review or an updated review.
- Do not mention off-Amazon contact info; say "contact us via Amazon's messaging system".
- If rating is 1 or 2, focus on apology + solution.
- If rating is 3, focus on acknowledging mixed experience and offering help.
- If rating is 4 or 5, focus on gratitude and reinforcing the good points.
- Avoid any medical or exaggerated claims.
`;

    const userPrompt = `
Product: ${productName || "Unknown"}
Rating: ${rating || "Unknown"} stars
Review: """${reviewText}"""

Tone: ${tone || "friendly and professional"}

Write a reply from the seller that:
- Addresses the customer in a respectful, neutral way (no name if unknown).
- Reflects back their main issue or praise.
- Offers help or thanks as appropriate.
- Stays clearly within Amazon communication policies.
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 250,
      temperature: 0.5,
    });

    const reply = response.choices[0].message.content;
    console.log("✅ Generated reply:", reply);
    res.json({ reply });
  } catch (e) {
    console.error("❌ Error in /generate-reply:", e);
    res.status(500).json({ error: "Something went wrong" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("🚀 Review backend listening on port", PORT);
});

