
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

export const drawMemeOnCanvas = (
    imageUrl: string,
    captions: MemeCaptions
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

            // Set canvas size to match image
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw original image
            ctx.drawImage(img, 0, 0);

            // Meme Text Styling
            const fontSize = Math.floor(canvas.width / 12);
            ctx.font = `bold ${fontSize}px Impact, uppercase, sans-serif`;
            ctx.fillStyle = "white";
            ctx.strokeStyle = "black";
            ctx.lineWidth = fontSize / 15;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";

            // Helper to wrap text
            const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
                const words = text.split(" ");
                let line = "";
                let currentY = y;

                for (let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + " ";
                    const metrics = ctx.measureText(testLine);
                    const testWidth = metrics.width;
                    if (testWidth > maxWidth && n > 0) {
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

            const padding = 20;
            const lineHeight = fontSize * 1.1;

            // Draw Top Text
            if (captions.topText) {
                ctx.textBaseline = "top";
                wrapText(captions.topText.toUpperCase(), canvas.width / 2, padding, canvas.width - 40, lineHeight);
            }

            // Draw Bottom Text
            if (captions.bottomText) {
                ctx.textBaseline = "bottom";
                // To draw from bottom up, we need to calculate the height of wrapped text first
                // For simplicity, we just estimate or draw at the very bottom
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

            resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = (err) => reject(err);
        img.src = imageUrl;
    });
};
