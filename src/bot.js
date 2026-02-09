const http = require('http');
require('dotenv').config();
const { Telegraf } = require('telegraf');
const { setupCommands } = require('./commands');
const { askAI, rewriteInBrandVoice } = require('./ai');
const { initScheduler } = require('./scheduler');
const { getPrice } = require('./crypto');
const { startMonitoring } = require('./monitor');

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

// 2. Robust Group Join / New Member Handler
bot.on('new_chat_members', async (ctx) => {
    try {
        const newMembers = ctx.message.new_chat_members;
        const botInfo = await ctx.telegram.getMe();
        
        // Check if the bot itself joined
        const isBotAdded = newMembers.some(member => member.id === botInfo.id);

        if (isBotAdded) {
            const welcomeText = `Sentinel has arrived in ${ctx.chat.title}! 🚀 I'm here to monitor the charts and feed you the spiciest alpha. Use /p <coin> to check prices.`;
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

        // Get market data (Cached to avoid 429)
        const marketInfo = await getOptimizedMarketSnippet();

        const prompt = `
            Task: Greet these new members: ${humanNames}.
            Context: They just joined the crypto community. ${marketInfo}
            Style: High energy, trader slang, welcoming but professional.
            Requirement: One single concise message. Ensure you mention each member by their provided handle or name to tag them.
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