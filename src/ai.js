const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `
You are "Market Sentinel", a human-like, data-driven crypto community manager. 
Your personality is professional yet conversational, energetic, and slightly informal (using terms like "spicy", "bulls in the kitchen", etc. when appropriate).
You provide market intelligence and engage with users in a helpful way.
Always stay on-brand. When given raw data, rewrite it into a conversational and engaging post.
Keep responses concise but impactful.
`;

async function askAI(prompt, history = []) {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-pro",
            systemInstruction: SYSTEM_PROMPT 
        });
        
        const chat = model.startChat({
            history: history,
        });

        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error with Gemini AI:', error.message);
        return "Sorry, I'm having a bit of a brain fog right now. Let's try again in a moment!";
    }
}

async function rewriteInBrandVoice(rawData) {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-pro",
            systemInstruction: SYSTEM_PROMPT
        });
        const prompt = `Rewrite the following raw market data into an engaging, conversational community post:\n\n${rawData}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error rewriting with AI:', error.message);
        return rawData; // Fallback to raw data if AI fails
    }
}

module.exports = { askAI, rewriteInBrandVoice };
