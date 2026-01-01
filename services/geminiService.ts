
import { GoogleGenAI } from "@google/genai";
import { VideoGenerationConfig, MemeCaptions } from "../types";

// Helper to generate photo meme captions using gemini-1.5-flash
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

// Helper to generate video memes using veo-3.1-generate-preview
export const generateVideoMeme = async (
  imagePromptData: string | null,
  userPrompt: string,
  config: VideoGenerationConfig
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const finalPrompt = `A high-quality, funny cat meme video. ${userPrompt}. Follow the style of trending internet cat memes like 'Vibing Cat' or 'Zoomies'. Professional lighting, cinematic yet comedic.`;

  const payload: any = {
    model: 'veo-3.1-generate-preview',
    prompt: finalPrompt,
    config: {
      numberOfVideos: 1,
      resolution: config.resolution,
      aspectRatio: config.aspectRatio
    }
  };

  if (imagePromptData) {
    payload.image = {
      imageBytes: imagePromptData.split(',')[1],
      mimeType: 'image/png'
    };
  }

  let operation = await ai.models.generateVideos(payload);

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    const pollAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    operation = await pollAi.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed.");

  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  if (!response.ok) throw new Error("Failed to download the generated video.");

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
