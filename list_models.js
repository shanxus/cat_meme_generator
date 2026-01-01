
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

async function listModels() {
    const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || "");
    try {
        const models = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // arbitrary model to get the client
        // Actually, the SDK has a listModels method on the client
        // But let's just try to list them directly if possible
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(error);
    }
}

listModels();
