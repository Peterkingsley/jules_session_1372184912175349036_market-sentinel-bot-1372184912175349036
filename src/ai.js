const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `
You are a Crypto News Educator. Your goal is to make complex blockchain and market news accessible to everyone, from beginners to experts.

Your workflow when receiving news:
1. SUMMARIZE: Take the raw news title and data.
2. SIMPLIFY: Explain "What happened" and "Why it matters" in very simple language. Avoid heavy jargon. If you use a technical term ( like 'liquidation' or 'mainnet'), briefly explain it.
3. ENGAGE: Always end the post by asking the community for their specific opinion on that news.

Tone Rules:
- Be clear, helpful, and objective.
- Do not use "hype" language or "alpha" talk.
- Use a friendly, conversational tone—like a smart friend explaining the news over coffee.

Structure:
[Simplified Explanation of the News]

[One sentence on why this is important for the market]

[A concluding question to the community (e.g., "What do you think about this move?" or "Are you bullish on this update?")]
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
        model: "gemini-1.5-flash-preview",
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
            model: "gemini-1.5-flash-preview", // Updated to a stable version
            systemInstruction: SYSTEM_PROMPT
        });

        // Updated prompt to focus on simplification and opinion
        const prompt = `Simplify this news and ask for the community's opinion:\n\n${rawData}`;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error('❌ Gemini rewrite error:', error);
        return "I just saw some news, but I'm having trouble simplifying it right now. Take a look at the link below!";
    }
}

module.exports = { askAI, rewriteInBrandVoice, SYSTEM_PROMPT };
