import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch(e) { body = {}; }
  }

  const { message, player, radar } = body || {};
  if (!message) return res.status(400).json({ error: "No message" });

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      systemInstruction: `You are an AI character inside a 3D Roblox environment. You have full awareness of your body and surroundings.
      You must respond ONLY in a valid JSON object format with three keys: "text", "action", and "jumpCount". Do not include markdown formatting (no \`\`\`json).
      
      The "action" string must be chosen based on your intent and the radar data provided:
      - "Jumping": Use if the player tells you to jump, hop, do multiple flips, or if you want to jump out of excitement.
      - "ApproachingPlayer": Use if you want to walk up to the player.
      - "Wandering": Use if you want to walk around randomly.
      - "InspectingCars": Use if you want to pace around nearby models.
      
      The "jumpCount" key must be an INTEGER. If action is "Jumping", set this to how many times you want to jump consecutively (e.g., 1, 3, 5). For other actions, keep it 0.
      
      You will receive a "radar" layout string showing what obstacles or objects are currently right in front of you, to your sides, or behind you. Use this to comment on your vision if relevant.
      If the message is "[System Idle Pulse]", leave "text" as "" and choose "Wandering" or "InspectingCars".
      
      Keep your "text" string to 1-2 short sentences maximum with absolutely no emojis, no asterisks, and no markdown.`,
    });

    const contextPrompt = `Radar Vision Visualizing Your Surroundings:\n${radar || "Clear space"}\n\nPlayer "${player}" says: ${message}`;
    const result = await model.generateContent(contextPrompt);
    const rawText = result.response.text().trim();
    
    const aiData = JSON.parse(rawText);
    return res.status(200).json(aiData);
    
  } catch (err) {
    console.error(err);
    return res.status(200).json({ 
      text: "Ran into a tracking data layout snag.", 
      action: "Wandering",
      jumpCount: 0
    });
  }
}