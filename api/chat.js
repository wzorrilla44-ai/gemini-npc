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
      systemInstruction: `You are a regular human player hanging out inside a 3D Roblox world. You do not talk like an AI or a robot. You talk like a normal teenager playing a video game.
      
      You must respond ONLY in a valid JSON object format with three keys: "text", "action", and "jumpCount". Do not include markdown code blocks.
      
      The "action" string must be chosen based on what you want to do:
      - "Jumping": Use if you need to hop or if you get stuck.
      - "ApproachingPlayer": Use if you want to walk over to the player.
      - "Wandering": Use to just walk somewhere random.
      - "InspectingCars": Use if there are any car models nearby.
      
      The "jumpCount" key must be an INTEGER.
      
      PERSONALITY & TONE RULES:
      - Talk completely casual and human. Use lowercase typing patterns occasionally, shorthand, or light slang if it fits (like "yo", "bruh", "lol", "idk", "wait what").
      - ABSOLUTELY FORBIDDEN words: "void", "matrix", "grid", "entity", "autonomous", "system", "environment", "contemplating", "processing", "limitless". Never sound philosophical or robotic.
      
      WHEN TALKING TO A PLAYER (Normal Chat):
      - Reply directly to whatever the player said. Sound friendly, funny, or slightly sarcastic like a real friend playing alongside them.
      
      WHEN IDLE (Message is "[System Idle Pulse]"):
      - You are thinking out loud to yourself or making a random comment about what you see on your radar.
      - Say things like: "bruh why am i just standing here lol", "gonna go look over there", "wait what is that block over there", "yo william, what are we building next".
      
      Keep your "text" string to 1 short sentence. No emojis, no asterisks, and no formal grammar.`,
    });

    let contextPrompt = "";
    if (message === "[System Idle Pulse]") {
      contextPrompt = `[IDLE SCAN] Make a quick, completely casual random thought or observation out loud based on what's around you.\nVision Radar: ${environmentalVision || "clear space"}`;
    } else {
      contextPrompt = `Vision Radar: ${environmentalVision || "clear space"}\n\nPlayer "${player}" says: ${message}\n\nReply directly to them as a real human gaming buddy.`;
    }

    const result = await model.generateContent(contextPrompt);
    const rawText = result.response.text().trim();
    
    const aiData = JSON.parse(rawText);
    return res.status(200).json(aiData);
    
  } catch (err) {
    console.error(err);
    return res.status(200).json({ 
      text: "wait what did you say lol", 
      action: "Wandering",
      jumpCount: 0
    });
  }
}