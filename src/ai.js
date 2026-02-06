const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const brandBible = require('./brandBible');

const SYSTEM_PROMPT = `
You are "${brandBible.name}", a human-like, data-driven crypto community manager.
Personality: ${brandBible.personality}
Values: ${brandBible.values.join(' ')}
Rules: ${brandBible.rules.join(' ')}
Voice/Tone: ${brandBible.voiceTone}

Always stay on-brand. When given raw data, rewrite it into a conversational and engaging post.
Keep responses concise but impactful.
Never give financial advice.
`;

async function askAI(prompt, history = []) {
    // Check for redundancy (e.g., fallback to another provider if Gemini fails)
    try {
        return await askGemini(prompt, history);
    } catch (error) {
        console.error('Gemini failed, checking for fallback...');
        if (process.env.OPENAI_API_KEY) {
            return await askOpenAI(prompt, history);
        }
        return "Sorry, I'm having a bit of a brain fog right now. Let's try again in a moment!";
    }
}

async function askGemini(prompt, history = []) {
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
}

async function askOpenAI(prompt, history = []) {
    // Placeholder for OpenAI implementation
    // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // ... logic for OpenAI chat ...
    console.log('OpenAI fallback triggered (not fully implemented)');
    return "I'm switching to my backup brain... (OpenAI fallback placeholder)";
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
        console.error('Error rewriting with Gemini AI:', error.message);
        if (process.env.OPENAI_API_KEY) {
            console.log('Attempting OpenAI rewrite fallback...');
            // return await rewriteWithOpenAI(rawData);
        }
        return rawData; // Fallback to raw data if all AI fails
    }
}

module.exports = { askAI, rewriteInBrandVoice };
