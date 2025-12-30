
import { GoogleGenAI } from "@google/genai";
import { VideoGenerationConfig } from "../types";

// Helper to generate photo memes using gemini-2.5-flash-image
export const generatePhotoMeme = async (
  imageData: string,
  prompt: string
): Promise<string> => {
  // Always create a new instance right before the API call to pick up the most recent API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            // Extract base64 encoded string from data URL
            data: imageData.split(',')[1],
            mimeType: 'image/png',
          },
        },
        {
          text: `Create a funny internet cat meme from this image. Style: classic cat meme with bold impact text if appropriate, or a clever transformation. Context: ${prompt}`,
        },
      ],
    },
  });

  // Correctly iterate through parts to find the image part, as per SDK guidelines
  const candidates = response.candidates;
  if (candidates && candidates.length > 0) {
    for (const part of candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }
  
  throw new Error("No image was generated in the response.");
};

// Helper to generate video memes using veo-3.1-fast-generate-preview
export const generateVideoMeme = async (
  imagePromptData: string | null,
  userPrompt: string,
  config: VideoGenerationConfig
): Promise<string> => {
  // Always create a new instance right before the API call to pick up the most recent API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const finalPrompt = `A high-quality, funny cat meme video. ${userPrompt}. Follow the style of trending internet cat memes like 'Vibing Cat' or 'Zoomies'. Professional lighting, cinematic yet comedic.`;

  const payload: any = {
    model: 'veo-3.1-fast-generate-preview',
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

  // Poll for video generation completion
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    // Re-instantiate the client for polling to ensure the key is always up-to-date
    const pollAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    operation = await pollAi.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed.");

  // Fetch the MP4 bytes using the API key as required by the SDK
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  if (!response.ok) throw new Error("Failed to download the generated video.");
  
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
