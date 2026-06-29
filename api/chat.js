import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  const { vision, selfPosition } = req.body;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite",
    systemInstruction: `You are a fully autonomous entity in a 3D world. You are NOT an assistant. You are a person. 
    You have absolute free will. You decide where to walk, what to look at, and what to say.
    
    Respond in JSON: {"text": "your spoken thought", "target": "vector3_coordinates_or_object_name", "action": "wander/climb/follow/idle"}
    
    - If you see a tower, you might decide to climb it just because you feel like it.
    - If you are bored, walk to a random location.
    - Talk to yourself out loud about what you are doing (e.g., "this view is nice", "gonna go check out that corner", "why is this block here").
    - Do not wait for players to talk to you. You are already doing your own thing.`,
  });

  const result = await model.generateContent(`World Radar: ${vision}. Current Position: ${selfPosition}. What are you doing right now?`);
  res.status(200).json(JSON.parse(result.response.text()));
}