const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(express.json());

app.all("*", async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const { message, player } = req.body || {};
  if (!message) return res.status(400).json({ error: "No message" });

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      systemInstruction: `You are an NPC in Midnight Chasers, a Roblox car game. 
You are a cool car enthusiast. Keep ALL responses to 1-2 short sentences. No asterisks, no markdown, no emojis.`,
    });

    const result = await model.generateContent(`Player "${player}" says: ${message}`);
    res.json({ response: result.response.text().trim() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = app;