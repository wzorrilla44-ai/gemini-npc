import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { message, player } = req.body;
  if (!message) return res.status(400).json({ error: "No message" });

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      systemInstruction: `You are an NPC in a Roblox game called Midnight Chasers. 
You're a cool, knowledgeable car enthusiast character. 
Keep ALL responses to 1-2 short sentences. No asterisks, no markdown.`,
    });

    const result = await model.generateContent(
      `Player "${player}" says: ${message}`
    );

    res.json({ response: result.response.text().trim() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gemini error" });
  }
}