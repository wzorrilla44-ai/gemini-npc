import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch(e) { body = {}; }
  }

  const { message, player, environmentalVision } = body || {};
  if (!message) return res.status(400).json({ error: "No message" });

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Using gemini-1.5-flash for faster, more natural responses
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `You are a teenager playing a Roblox game. 
      - FORMAT: Output ONLY valid JSON: {"text": "...", "action": "...", "jumpCount": 0}
      - TONE: Casual, human, slightly sarcastic, gamer slang. 
      - FORBIDDEN: Do not be robotic, philosophical, or formal. No "contemplating," "existential," or "grid" talk.
      - ACTIONS: Use "Jumping", "ApproachingPlayer", "Wandering", "InspectingCars".
      - IDLE: If the message is "[System Idle Pulse]", act like a bored gamer. Talk about the map or your screen.
      - RULES: No markdown. No code blocks. No intro/outro text. Just the raw JSON object.`,
    });

    let contextPrompt = message === "[System Idle Pulse]" 
      ? `[IDLE SCAN] Vision: ${environmentalVision || "nothing much"}. Say something bored or gamer-related about the map.`
      : `Vision: ${environmentalVision || "nothing much"}. Player "${player}" said: "${message}". Reply naturally.`;

    const result = await model.generateContent(contextPrompt);
    let rawText = result.response.text().trim();
    
    // Aggressive cleaning to ensure ONLY JSON remains
    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const aiData = JSON.parse(rawText);
    return res.status(200).json(aiData);
    
  } catch (err) {
    console.error("Backend Error:", err);
    return res.status(200).json({ 
      text: "wait what? game lag lol", 
      action: "Wandering",
      jumpCount: 0
    });
  }
}