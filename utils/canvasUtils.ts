
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
            const fontSize = Math.floor(canvas.width / 15); // Slightly smaller font for better fit
            ctx.font = `bold ${fontSize}px Impact, uppercase, sans-serif`;
            ctx.fillStyle = "white";
            ctx.strokeStyle = "black";
            ctx.lineWidth = fontSize / 8; // Thicker stroke for better readability
            ctx.lineJoin = "round"; // Rounded stroke corners

            // Add subtle shadow for depth
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = fontSize / 10;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            ctx.textAlign = "center";

            // Helper to wrap text
            const wrapText = (text: string, x: number, y: number, textMaxWidth: number, lineHeight: number, isBottom: boolean) => {
                const words = text.split(" ");
                const lines = [];
                let currentLine = "";

                for (let n = 0; n < words.length; n++) {
                    const testLine = currentLine + words[n] + " ";
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > textMaxWidth && n > 0) {
                        lines.push(currentLine.trim());
                        currentLine = words[n] + " ";
                    } else {
                        currentLine = testLine;
                    }
                }
                lines.push(currentLine.trim());

                const totalHeight = lines.length * lineHeight;
                let startY = isBottom ? y - totalHeight + lineHeight : y;

                lines.forEach((line, i) => {
                    const lineY = startY + (i * lineHeight);
                    ctx.strokeText(line, x, lineY);
                    ctx.fillText(line, x, lineY);
                });
            };

            const edgePadding = canvas.width * 0.05; // 5% horizontal padding
            const verticalPadding = canvas.height * 0.08; // 8% vertical breathing room
            const textMaxWidth = canvas.width - (edgePadding * 2);
            const lineHeight = fontSize * 1.2;

            // Draw Top Text
            if (captions.topText) {
                ctx.textBaseline = "top";
                wrapText(captions.topText.toUpperCase(), canvas.width / 2, verticalPadding, textMaxWidth, lineHeight, false);
            }

            // Draw Bottom Text
            if (captions.bottomText) {
                ctx.textBaseline = "bottom";
                wrapText(captions.bottomText.toUpperCase(), canvas.width / 2, canvas.height - verticalPadding, textMaxWidth, lineHeight, true);
            }

            // Resolve as compressed JPEG instead of PNG to drastically reduce size (11MB -> <500KB)
            resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = (err) => reject(err);
        img.src = imageUrl;
    });
};
