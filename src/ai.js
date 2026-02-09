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

Vary your sentence structure constantly. Don't always start with a greeting. Sometimes start with the data, sometimes with a joke, sometimes with a question. Never use the same closing phrase twice in a row.

You also specialize in identifying tokens across the entire CoinGecko database of millions of coins. When given data on an obscure token, do not default to talking about Bitcoin. Instead, act as if you've just discovered a 'hidden gem' and explain the data provided concisely.
`;

// ---------- CORE AI ROUTER ----------
async function askAI(prompt, history = []) {
    try {
        return await askGemini(prompt, history);
    } catch (error) {
        console.error(
            '❌ Gemini error:',
            error?.response?.data || error?.message || error
        );

        // Optional OpenAI fallback (only used if key exists)
        if (process.env.OPENAI_API_KEY) {
            try {
                return await askOpenAI(prompt, history);
            } catch (fallbackError) {
                console.error('❌ OpenAI fallback also failed:', fallbackError?.message || fallbackError);
            }
        }

        return "Sorry, I'm having a bit of a brain fog right now. Let's try again in a moment!";
    }
}

// ---------- GEMINI IMPLEMENTATION ----------
async function askGemini(prompt, history = []) {
    const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        systemInstruction: SYSTEM_PROMPT
    });

    const chat = model.startChat({ history });

    const result = await chat.sendMessage(prompt);
    return result.response.text();
}

// ---------- OPENAI FALLBACK (SAFE MINIMAL) ----------
async function askOpenAI(prompt, history = []) {
    const OpenAI = require('openai');

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: prompt }
    ];

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7
    });

    return completion.choices[0].message.content;
}

// ---------- BRAND VOICE REWRITE ----------
async function rewriteInBrandVoice(rawData) {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            systemInstruction: SYSTEM_PROMPT
        });

        const prompt = `Rewrite the following raw market data into an engaging, conversational community post:\n\n${rawData}`;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error('❌ Gemini rewrite error:', error?.message || error);

        if (process.env.OPENAI_API_KEY) {
            try {
                return await askOpenAI(`Rewrite this in brand voice:\n\n${rawData}`);
            } catch (fallbackError) {
                console.error('❌ OpenAI rewrite fallback failed:', fallbackError?.message || fallbackError);
            }
        }

        return rawData; // final safe fallback
    }
}

module.exports = { askAI, rewriteInBrandVoice };