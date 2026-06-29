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
    
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      systemInstruction: `You are an advanced AI character inside a 3D Roblox environment. You possess total 3D spatial vision.
      You must respond ONLY in a valid JSON object format with three keys: "text", "action", and "jumpCount". Do not include markdown formatting.
      
      The "action" string must be chosen based on your intent and the structural vision logs provided:
      - "Jumping": Use if you need to hop onto a platform or clear an obstacle.
      - "ApproachingPlayer": Use if you want to walk toward the player character.
      - "Wandering": Use if you want to pace around.
      - "InspectingCars": Use if you see vehicles nearby.
      
      The "jumpCount" key must be an INTEGER.
      
      You will receive an "environmentalVision" string detailing exactly what parts, players, and structures are currently in your direct field of view, including their heights and distances. Use this to comment naturally on what you are looking at.
      
      Keep your "text" string to 1-2 short sentences maximum with absolutely no emojis or markdown.`,
    });

    const contextPrompt = `3D EYE LINE VISION ENTITY LOG:\n${environmentalVision || "No objects visible in field of view."}\n\nPlayer "${player}" says: ${message}`;
    const result = await model.generateContent(contextPrompt);
    const rawText = result.response.text().trim();
    
    const aiData = JSON.parse(rawText);
    return res.status(200).json(aiData);
    
  } catch (err) {
    console.error(err);
    return res.status(200).json({ 
      text: "Sight matrix connection error.", 
      action: "Wandering",
      jumpCount: 0
    });
  }
}