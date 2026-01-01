
import React, { useState, useRef } from 'react';
import { MemeType, GenerationStatus, MemeItem, MemeCaptions } from '../types';
import { generatePhotoMeme } from '../services/geminiService';
import { drawMemeOnCanvas, compressImage } from '../utils/canvasUtils';

// Define heic2any globally as it's loaded via CDN
declare const heic2any: any;

interface MemeCreatorProps {
  onMemeGenerated: (item: MemeItem) => void;
}

const MemeCreator: React.FC<MemeCreatorProps> = ({ onMemeGenerated }) => {
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [isMockMode, setIsMockMode] = useState<boolean>(false); // Changed default to false as requested

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getMockCaptions = (): MemeCaptions => {
    const mocks = [
      { topText: "ME WHEN I SEE", bottomText: "A BUG IN PRODUCTION" },
      { topText: "I CAN HAZ", bottomText: "CLEAN CODE?" },
      { topText: "NO TALK ME", bottomText: "I ANGY" },
      { topText: "POV: YOURE A SENIOR", bottomText: "LOOKING AT JUNIOR CODE" },
      { topText: "MERRY CHRISTMAS", bottomText: "YA FILTHY ANIMAL" }
    ];
    return mocks[Math.floor(Math.random() * mocks.length)];
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setGeneratedResult(null);

    const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');

    if (isHeic) {
      try {
        setIsConverting(true);
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.8
        });

        const blobToUse = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result as string);
          setIsConverting(false);
        };
        reader.readAsDataURL(blobToUse);
      } catch (err) {
        console.error("HEIC conversion failed:", err);
        setError("Failed to convert HEIC image. Please try a different format.");
        setIsConverting(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!previewUrl) {
      setError("Please upload a cat photo first!");
      return;
    }

    let resultUrl = '';
    try {
      setStatus(GenerationStatus.GENERATING);
      setError(null);
      setGeneratedResult(null); // Clear previous result to avoid confusion

      let captions: MemeCaptions;

      if (isMockMode) {
        await new Promise(r => setTimeout(r, 800)); // Simulate delay
        captions = getMockCaptions();
      } else {
        // Compress image to save tokens (Gemini has TPM limits)
        const compressedImage = await compressImage(previewUrl!);
        captions = await generatePhotoMeme(compressedImage, prompt);
      }

      // Always draw on Canvas locally
      resultUrl = await drawMemeOnCanvas(previewUrl!, captions);

      setGeneratedResult(resultUrl);
      setStatus(GenerationStatus.SUCCESS);

      const newItem: MemeItem = {
        id: Date.now().toString(),
        type: MemeType.PHOTO,
        url: resultUrl,
        prompt: prompt || "Photo Meme",
        createdAt: Date.now()
      };
      onMemeGenerated(newItem);

    } catch (err: any) {
      console.error("Capture Error:", err);
      let userMessage = "Failed to generate meme. Please try again.";

      const errorMessage = err.message || "";

      // Distinguish between Gemini API Quota and LocalStorage Quota
      if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        userMessage = "The API is busy (RPM Limit). Please wait 10 seconds and try again.";
      } else if (errorMessage.toLowerCase().includes("quota") || errorMessage.includes("STORAGE_FULL") || err.name === "QuotaExceededError") {
        userMessage = "Meme generated, but your history is full! Please clear some old memes in the Gallery.";
      } else if (errorMessage.includes("API key")) {
        userMessage = "Invalid API Key. Please check your .env configuration.";
      }

      setError(userMessage);
      // We don't set status to ERROR if the result was actually generated
      // but only the saving failed.
      if (!resultUrl) {
        setStatus(GenerationStatus.ERROR);
      } else {
        setStatus(GenerationStatus.SUCCESS);
      }
    }
  };

  const handleDownload = () => {
    if (!generatedResult) return;
    const link = document.createElement('a');
    link.href = generatedResult;
    link.download = `cat-meme-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setPreviewUrl(null);
    setGeneratedResult(null);
    setPrompt('');
    setStatus(GenerationStatus.IDLE);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-orange-100 transition-all max-w-full">
      <div className="p-4 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-orange-900 flex items-center gap-2">
            <i className="fa-solid fa-wand-magic-sparkles text-orange-500"></i>
            Meme Creator
          </h2>

          <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 self-end sm:self-auto">
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Demo Mode</span>
            <button
              onClick={() => setIsMockMode(!isMockMode)}
              className={`w-9 h-4.5 rounded-full relative transition-colors ${isMockMode ? 'bg-orange-500' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all ${isMockMode ? 'left-5' : 'left-0.5'}`}></div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Left Column: Upload & Options */}
          <div className="space-y-5 md:space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">1. Upload your Cat</label>
              <div
                onClick={() => !isConverting && fileInputRef.current?.click()}
                className={`group relative h-40 md:h-48 border-2 border-dashed border-orange-200 rounded-3xl flex flex-col items-center justify-center transition-all overflow-hidden ${isConverting ? 'cursor-wait bg-orange-50/20' : 'cursor-pointer hover:border-orange-400 hover:bg-orange-50/30'}`}
              >
                {isConverting ? (
                  <div className="flex flex-col items-center">
                    <i className="fa-solid fa-sync fa-spin text-orange-500 text-2xl mb-2"></i>
                    <p className="text-orange-600 text-sm font-medium">Converting HEIC...</p>
                  </div>
                ) : previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white font-medium">Change Photo</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-2 md:mb-3 group-hover:scale-110 transition-transform">
                      <i className="fa-solid fa-cloud-arrow-up text-lg md:text-xl"></i>
                    </div>
                    <p className="text-gray-500 text-xs md:text-sm">Click to upload photo</p>
                    <p className="text-gray-400 text-[10px] md:text-xs mt-1">Supports JPG, PNG, HEIC</p>
                  </>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*, .heic, .heif"
                  className="hidden"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">2. Add Funny Context</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: 'Angry cat demands snacks'..."
                className="w-full p-4 rounded-2xl border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none h-24 md:h-32 resize-none text-gray-900 font-medium placeholder:text-gray-400 bg-white transition-all shadow-inner text-sm md:text-base"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={status === GenerationStatus.GENERATING || isConverting}
              className={`w-full py-3.5 md:py-4 rounded-2xl font-bold text-base md:text-lg shadow-lg flex items-center justify-center gap-3 transition-all ${status === GenerationStatus.GENERATING || isConverting
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600 active:scale-[0.98]'
                }`}
            >
              {status === GenerationStatus.GENERATING ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  Brewing Magic...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paw"></i>
                  {isMockMode ? "Generate (Demo)" : "Generate Meme"}
                </>
              )}
            </button>

            {error && (
              <div className="p-3 md:p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs md:text-sm flex items-center gap-3">
                <i className="fa-solid fa-circle-exclamation"></i>
                {error}
              </div>
            )}

            {isMockMode && (
              <p className="text-[10px] md:text-xs text-orange-400 italic text-center">
                💡 Demo mode is ON: Captions are locally generated.
              </p>
            )}
          </div>

          {/* Right Column: Result Preview */}
          <div className="flex flex-col min-h-[350px] md:min-h-[450px]">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Live Result</label>
            <div className="flex-1 rounded-3xl border-2 border-orange-100 bg-orange-50/30 overflow-hidden relative flex flex-col">
              {status === GenerationStatus.GENERATING ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-orange-50/50 z-10">
                  <div className="w-16 h-16 md:w-20 md:h-20 mb-4 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-orange-200 animate-pulse"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <i className="fa-solid fa-cat text-2xl md:text-3xl text-orange-500"></i>
                    </div>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-orange-800 mb-2">Creating...</h3>
                </div>
              ) : generatedResult ? (
                <div className="h-full flex flex-col min-h-0">
                  <div className="flex-1 bg-black flex items-center justify-center overflow-hidden p-1">
                    <img src={generatedResult} alt="Generated Meme" className="max-h-full max-w-full object-contain mx-auto" />
                  </div>
                  <div className="p-3 md:p-4 bg-white border-t border-orange-100 flex gap-2 md:gap-3 shrink-0">
                    <button
                      onClick={handleDownload}
                      className="flex-1 bg-green-500 text-white py-2.5 md:py-3 rounded-xl font-bold text-sm md:text-base hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <i className="fa-solid fa-download"></i>
                      Download
                    </button>
                    <button
                      onClick={reset}
                      className="px-4 md:px-6 border-2 border-orange-100 text-orange-400 py-2.5 md:py-3 rounded-xl font-bold text-sm md:text-base hover:bg-orange-50 hover:text-orange-600 transition-all"
                    >
                      New
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-orange-200 p-8">
                  <i className="fa-solid fa-image text-6xl md:text-8xl mb-4"></i>
                  <p className="text-base md:text-lg font-medium text-center">Your masterpiece awaits</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemeCreator;
