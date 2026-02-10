const http = require('http');
require('dotenv').config();
const { Telegraf } = require('telegraf');
const { setupCommands } = require('./commands');
const { askAI, rewriteInBrandVoice } = require('./ai');
const { initScheduler } = require('./scheduler');
const { getPrice, getTrendingCoins, getRandomMarketData } = require('./crypto');
const { startMonitoring } = require('./monitor');
const { getLatestNews } = require('./news');

if (!process.env.BOT_TOKEN) {
    console.error('BOT_TOKEN is missing in .env file');
    process.exit(1);
}

const bot = new Telegraf(process.env.BOT_TOKEN);

// To prevent 429 errors and speed up greetings, we cache market snippets
let cachedMarketSnippet = null;
let lastCacheTime = 0;

/**
 * Fetches BTC price but caches it for 5 minutes to avoid hitting
 * Gemini or CoinGecko rate limits during high-traffic greetings.
 */
async function getOptimizedMarketSnippet() {
    const now = Date.now();
    // Cache for 5 minutes (300,000ms)
    if (cachedMarketSnippet && (now - lastCacheTime < 300000)) {
        return cachedMarketSnippet;
    }
    try {
        const btc = await getPrice('bitcoin');
        cachedMarketSnippet = btc ? `BTC is at $${btc.price} (${btc.change}% 24h).` : 'The market is buzzing.';
        lastCacheTime = now;
        return cachedMarketSnippet;
    } catch (e) {
        return cachedMarketSnippet || 'The charts are looking spicy today.';
    }
}

// 1. Setup Commands
setupCommands(bot);

const vibes = [
    "hyper-energetic trader",
    "chill floor manager",
    "mysterious alpha hunter",
    "straight-to-the-point analyst",
    "slightly chaotic moon-boy"
];

// 2. Robust Group Join / New Member Handler
bot.on('new_chat_members', async (ctx) => {
    try {
        const newMembers = ctx.message.new_chat_members;
        const botInfo = await ctx.telegram.getMe();
        
        // Check if the bot itself joined
        const isBotAdded = newMembers.some(member => member.id === botInfo.id);

        if (isBotAdded) {
            const welcomeText = `Greetings! Sentinel has arrived in ${ctx.chat.title}! 🚀 I'm here to monitor the charts and feed you the spiciest alpha. Use /p <coin> to check prices.`;
            // Using a try-catch specifically for the brand rewrite to ensure the welcome always sends
            let flavored;
            try {
                flavored = await rewriteInBrandVoice(welcomeText);
            } catch (aiErr) {
                flavored = welcomeText;
            }
            return ctx.reply(flavored);
        }

        // Filter out bots and get names
        const humanNames = newMembers
            .filter(m => !m.is_bot)
            .map(m => m.username ? `@${m.username}` : m.first_name)
            .join(', ');

        if (!humanNames) return;

        // Show "typing" status so the community knows the bot is working
        await ctx.sendChatAction('typing');

        // Selection is fully random across the three sources
        const sources = ['price', 'news', 'trending'];
        const selectedSource = sources[Math.floor(Math.random() * sources.length)];
        let contextData = '';

        try {
            if (selectedSource === 'price') {
                const coin = await getRandomMarketData();
                if (coin) {
                    contextData = `Market Update: ${coin.name} (${coin.symbol}) is currently at $${coin.price} with a 24h change of ${coin.change}%.`;
                } else {
                    contextData = await getOptimizedMarketSnippet();
                }
            } else if (selectedSource === 'news') {
                const news = await getLatestNews();
                if (news) {
                    contextData = `Latest News: "${news.title}" (Source: ${news.domain}).`;
                } else {
                    contextData = await getOptimizedMarketSnippet();
                }
            } else if (selectedSource === 'trending') {
                const trending = await getTrendingCoins();
                if (trending && trending.length > 0) {
                    const randomTrending = trending[Math.floor(Math.random() * trending.length)];
                    contextData = `Trending Alert: ${randomTrending.name} (${randomTrending.symbol}) is currently trending on CoinGecko at rank #${randomTrending.market_cap_rank}.`;
                } else {
                    contextData = await getOptimizedMarketSnippet();
                }
            }
        } catch (fetchErr) {
            console.error('Data Fetch Error in Greeting:', fetchErr.message);
            contextData = await getOptimizedMarketSnippet();
        }

        const randomVibe = vibes[Math.floor(Math.random() * vibes.length)];
        const prompt = `
            [Vibe: ${randomVibe}]
            Task: Greet these new members: ${humanNames}.
            Context: They just joined the crypto community. ${contextData}
            Style: High energy, trader slang, welcoming but professional.
            Requirement: One single concise message. Ensure you mention each member by their provided handle or name to tag them.
            Instruction: Always lead with a friendly greeting and welcome the new members. Be creative with how you integrate the market data, but the greeting must come first.
        `;

        const response = await askAI(prompt);
        await ctx.reply(response, { parse_mode: 'Markdown' });

    } catch (error) {
        console.error('Greeting Error:', error.message);
        // Fallback message if AI or Telegram API fails
        ctx.reply("Welcome to the group! Get ready for some market alpha. 🚀").catch(() => {});
    }
});

// 3. Background Tasks
initScheduler(bot);
startMonitoring(bot);

// --- SERVER SETUP ---
const PORT = process.env.PORT || 10000;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
const secretToken = process.env.WEBHOOK_SECRET || 'market_sentinel_secret';

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/webhook') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const update = JSON.parse(body);
                bot.handleUpdate(update, res);
            } catch (err) {
                console.error('Webhook processing error:', err);
                res.statusCode = 500;
                res.end();
            }
        });
        return;
    }
    res.writeHead(200);
    res.end('Bot Active');
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    if (RENDER_EXTERNAL_URL) {
        bot.telegram.setWebhook(`${RENDER_EXTERNAL_URL}/webhook`, { 
            secret_token: secretToken,
            drop_pending_updates: true 
        }).then(() => console.log('Webhook configured.'));
    } else {
        bot.launch().then(() => console.log('Bot started via polling.'));
    }
});
