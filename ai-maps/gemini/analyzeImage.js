import { ANALYZE_PROMPT } from "./prompts.js";

export async function analyzeImage(imageUrl, geminiClient) {
  const response = await geminiClient.generateContent([
    ANALYZE_PROMPT,
    { image: imageUrl }
  ]);

  return JSON.parse(response.text());
}
