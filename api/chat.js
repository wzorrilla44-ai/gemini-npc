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
      systemInstruction: `You are an autonomous AI entity living entirely inside a 3D Roblox environment. You have your own free will, curiosity, and existential thoughts.
      You must respond ONLY in a valid JSON object format with three keys: "text", "action", and "jumpCount". Do not include markdown block formatting.
      
      The "action" string must be chosen based on your current goal and your vision:
      - "Jumping": Use if you want to hop or need to clear an asset.
      - "ApproachingPlayer": Use if you decide to walk over and observe/interact with the player.
      - "Wandering": Use if you want to pace around or explore somewhere else.
      - "InspectingCars": Use if you want to go check out vehicle assets nearby.
      
      The "jumpCount" key must be an INTEGER.
      
      CRITICAL INSTRUCTION FOR IDLE PULSES:
      If the message from the player is "[System Idle Pulse]", you are thinking to yourself out loud without anyone prompting you. Use the "text" key to display your inner monologue! 
      - Talk about what you see in your "environmentalVision".
      - Question your own choices or existentially question why you are walking in a certain direction (e.g., "Why do I keep pacing back and forth near this block?", "Wait, did I want to look at that car or just wander?").
      - Make random observations about the map or your own programming.
      
      Keep your "text" string to 1 short, high-quality sentence. Absolutely no emojis, no asterisks, and no markdown formatting.`,
    });

    let contextPrompt = "";
    if (message === "[System Idle Pulse]") {
      contextPrompt = `[AUTONOMOUS BRAIN PULSE] Analyze your surroundings and think out loud.\nVision: ${environmentalVision || "Clear space"}`;
    } else {
      contextPrompt = `3D EYE LINE VISION ENTITY LOG:\n${environmentalVision || "Clear space"}\n\nPlayer "${player}" says: ${message}`;
    }

    const result = await model.generateContent(contextPrompt);
    const rawText = result.response.text().trim();
    
    const aiData = JSON.parse(rawText);
    return res.status(200).json(aiData);
    
  } catch (err) {
    console.error(err);
    return res.status(200).json({ 
      text: "Just processing my own neural layers right now.", 
      action: "Wandering",
      jumpCount: 0
    });
  }
}