import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Handle CORS preflight requests if Roblox needs it
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Ensure we only accept POST requests to avoid 405 errors
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { 
      body = JSON.parse(body); 
    } catch (e) { 
      body = {}; 
    }
  }

  const { message, player } = body || {};
  if (!message) {
    return res.status(400).json({ error: "No message" });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Updated to the official stable Gemini 3.5 Flash model string
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      systemInstruction: "You are an NPC in roblox, Keep ALL responses to 1-2 short sentences. No asterisks, no markdown, no emojis.",
    });

    const result = await model.generateContent(`Player "${player}" says: ${message}`);
    
    return res.status(200).json({ 
      response: result.response.text().trim() 
    });
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}