
import { GoogleGenAI } from "@google/genai";
import { MemeCaptions } from "../types";

// Helper to generate photo meme captions using gemini-flash-latest
export const generatePhotoMeme = async (
  imageData: string,
  prompt: string
): Promise<MemeCaptions> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-flash-latest', // Best balance of speed and quota availability
    contents: {
      parts: [
        {
          inlineData: {
            data: imageData.split(',')[1],
            mimeType: imageData.split(';')[0].split(':')[1],
          },
        },
        {
          text: `Create a funny internet cat meme caption for this image. 
          User Context: ${prompt}
          
          IMPORTANT: Return ONLY a JSON object with "topText" and "bottomText" keys. 
          Example: {"topText": "WHEN YOU REALISE", "bottomText": "IT IS MONDAY AGAIN"}
          Keep it short and witty. Use uppercase for the classic meme look.`,
        },
      ],
    },
  });

  const candidates = response.candidates;
  if (candidates && candidates.length > 0) {
    for (const part of candidates[0].content.parts) {
      if (part.text) {
        try {
          const jsonStr = part.text.replace(/```json\n?|\n?```/g, '').trim();
          return JSON.parse(jsonStr) as MemeCaptions;
        } catch (e) {
          console.error("Failed to parse AI response:", part.text);
        }
      }
    }
  }

  throw new Error("Failed to generate captions.");
};
