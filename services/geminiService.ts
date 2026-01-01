
import { GoogleGenAI } from "@google/genai";
import { MemeCaptions } from "../types";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Helper to generate photo meme captions using gemini-flash-latest.
 * Includes automatic retry logic for 429 quota errors.
 */
export const generatePhotoMeme = async (
  imageData: string,
  prompt: string,
  retries: number = 2
): Promise<MemeCaptions> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
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
    throw new Error("AI returned an empty or invalid format.");

  } catch (err: any) {
    // If it's a quota error (429) and we have retries left, wait and try again
    if (err.message?.includes("429") || err.message?.includes("quota") || err.message?.includes("RESOURCE_EXHAUSTED")) {
      if (retries > 0) {
        console.log(`Quota limit hit. Retrying in 2 seconds... (${retries} left)`);
        await delay(2000);
        return generatePhotoMeme(imageData, prompt, retries - 1);
      }
      throw new Error("The API is currently busy. Please wait a few seconds and try again.");
    }

    console.error("Gemini API Error:", err);
    throw err;
  }
};
