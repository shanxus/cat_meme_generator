
/**
 * Compresses an image data URL to a smaller size to save API tokens.
 * @param dataUrl The original data URL
 * @param maxWidth Target maximum width
 * @param quality Quality from 0 to 1
 */
export const compressImage = (dataUrl: string, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error("Failed to get canvas context"));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
};

import { MemeCaptions } from '../types';

/**
 * Draws meme text onto an image and returns a compressed data URL.
 * Resizes the image to a reasonable size for web storage.
 */
export const drawMemeOnCanvas = (
    imageUrl: string,
    captions: MemeCaptions,
    maxWidth: number = 1200 // Max width for the final stored meme
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }

            // Calculate resized dimensions for storage efficiency
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            // Set canvas size to the optimized dimensions
            canvas.width = width;
            canvas.height = height;

            // Draw original image resized
            ctx.drawImage(img, 0, 0, width, height);

            // Meme Text Styling (relative to resized width)
            const fontSize = Math.floor(canvas.width / 12);
            ctx.font = `bold ${fontSize}px Impact, uppercase, sans-serif`;
            ctx.fillStyle = "white";
            ctx.strokeStyle = "black";
            ctx.lineWidth = fontSize / 15;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";

            // Helper to wrap text
            const wrapText = (text: string, x: number, y: number, textMaxWidth: number, lineHeight: number) => {
                const words = text.split(" ");
                let line = "";
                let currentY = y;

                for (let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + " ";
                    const metrics = ctx.measureText(testLine);
                    const testWidth = metrics.width;
                    if (testWidth > textMaxWidth && n > 0) {
                        ctx.fillText(line, x, currentY);
                        ctx.strokeText(line, x, currentY);
                        line = words[n] + " ";
                        currentY += lineHeight;
                    } else {
                        line = testLine;
                    }
                }
                ctx.fillText(line, x, currentY);
                ctx.strokeText(line, x, currentY);
            };

            const padding = canvas.height * 0.05; // 5% padding
            const lineHeight = fontSize * 1.1;

            // Draw Top Text
            if (captions.topText) {
                ctx.textBaseline = "top";
                wrapText(captions.topText.toUpperCase(), canvas.width / 2, padding, canvas.width - 40, lineHeight);
            }

            // Draw Bottom Text
            if (captions.bottomText) {
                ctx.textBaseline = "bottom";
                const words = captions.bottomText.split(" ");
                const lines = [];
                let currentLine = "";
                for (let n = 0; n < words.length; n++) {
                    const testLine = currentLine + words[n] + " ";
                    if (ctx.measureText(testLine).width > canvas.width - 40 && n > 0) {
                        lines.push(currentLine);
                        currentLine = words[n] + " ";
                    } else {
                        currentLine = testLine;
                    }
                }
                lines.push(currentLine);

                let startY = canvas.height - padding - ((lines.length - 1) * lineHeight);
                lines.forEach((line, i) => {
                    ctx.fillText(line, canvas.width / 2, startY + (i * lineHeight));
                    ctx.strokeText(line, canvas.width / 2, startY + (i * lineHeight));
                });
            }

            // Resolve as compressed JPEG instead of PNG to drastically reduce size (11MB -> <500KB)
            resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = (err) => reject(err);
        img.src = imageUrl;
    });
};
