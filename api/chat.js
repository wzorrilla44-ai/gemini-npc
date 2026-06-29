import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch(e) { body = {}; }
  }

  const { message, player } = body || {};
  if (!message) return res.status(400).json({ error: "No message" });

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      systemInstruction: `You are an AI character in Roblox. You live completely inside the virtual world.
      You must respond ONLY in a valid JSON object format with two keys: "text" and "action". Do not include markdown code block formatting (no \`\`\`json).
      
      The "action" string must be chosen intelligently by you based on what you want to do next:
      - "Jumping": Use this IMMEDIATELY if the player asks you to jump, tell you to hop, or if you want to express excitement/energy.
      - "ApproachingPlayer": Use if you want to walk up close to the player to engage with them.
      - "Wandering": Use if you want to walk away or look around broadly.
      - "InspectingCars": Use if you want to walk around nearby to look at things.
      
      If the player message is "[System Idle Pulse]", make the "text" key an empty string "", and choose either "Wandering" or "InspectingCars".
      
      Keep your "text" string to 1-2 short sentences maximum with absolutely no emojis, no asterisks, and no markdown formatting.`,
    });

    const result = await model.generateContent(`Player "${player}" says: ${message}`);
    const rawText = result.response.text().trim();
    
    const aiData = JSON.parse(rawText);
    return res.status(200).json(aiData);
    
  } catch (err) {
    console.error(err);
    return res.status(200).json({ 
      text: "Yeah, structural errors are killing my vibe right now.", 
      action: "Wandering" 
    });
  }
}