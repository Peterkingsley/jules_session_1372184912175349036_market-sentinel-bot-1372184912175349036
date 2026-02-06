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

// Context/Session storage (In-memory for now)
const sessions = new Map();

// 1. Setup Commands
setupCommands(bot);

// 2. New Member Greetings
bot.on('new_chat_members', async (ctx) => {
    const newMembers = ctx.message.new_chat_members;

    // Fetch some market sentiment for the greeting
    const btc = await getPrice('bitcoin');
    const marketSnippet = btc ? `BTC is currently at $${btc.price} (${btc.change}% 24h).` : '';

    for (const member of newMembers) {
        if (member.is_bot) continue;
        const name = member.first_name || 'fren';
        const welcomePrompt = `Generate a unique, energetic, and professional greeting for a new member named "${name}" who just joined our crypto community.
        Current Market Sentiment: ${marketSnippet}
        Mention that they are in the right place for market intelligence.
        Keep it persistent and welcoming.`;

        const uniqueGreeting = await askAI(welcomePrompt);
        ctx.reply(uniqueGreeting, { reply_to_message_id: ctx.message.message_id });
    }
});

// 3. AI Chat (Catch-all for text)
bot.on('text', async (ctx) => {
    // Ignore commands (they start with /)
    if (ctx.message.text.startsWith('/')) return;

    // Determine if we should respond
    const isPrivate = ctx.chat.type === 'private';
    const isReplyToBot = ctx.message.reply_to_message && ctx.message.reply_to_message.from.id === ctx.botInfo.id;
    const isMentioned = ctx.message.text.includes(`@${ctx.botInfo.username}`);

    if (!isPrivate && !isReplyToBot && !isMentioned) return;

    await ctx.sendChatAction('typing');
    
    const chatId = ctx.chat.id;
    const userMessage = ctx.message.text.replace(`@${ctx.botInfo.username}`, '').trim();
    
    // Get or create session
    if (!sessions.has(chatId)) {
        sessions.set(chatId, []);
    }
    const history = sessions.get(chatId);
    
    // Limit history size to 20 for better context
    if (history.length > 20) history.shift();

    const aiResponse = await askAI(userMessage, history);
    
    // Update history
    history.push({ role: 'user', parts: [{ text: userMessage }] });
    history.push({ role: 'model', parts: [{ text: aiResponse }] });
    
    await ctx.reply(aiResponse, { reply_to_message_id: ctx.message.message_id });
});

// 4. Initialize Scheduler & Monitor
initScheduler(bot);
startMonitoring(bot);

// Webhook & Health Check Server for Render
const PORT = process.env.PORT || 10000;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;

// Use a subset of the bot token as a secret for the webhook
const secretToken = process.env.BOT_TOKEN.replace(/:/g, '_');
const handleWebhook = bot.webhookCallback('/webhook', { secretToken });

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/webhook') {
        return handleWebhook(req, res);
    }

    // Health Check for Render
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Market Sentinel Bot is running\n');
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);

    if (RENDER_EXTERNAL_URL) {
        console.log(`Configuring webhook for ${RENDER_EXTERNAL_URL}/webhook`);
        bot.telegram.setWebhook(`${RENDER_EXTERNAL_URL}/webhook`, {
            secret_token: secretToken
        })
            .then(() => console.log('Webhook successfully set'))
            .catch(err => console.error('Failed to set webhook:', err));
    } else {
        bot.launch().then(() => {
            console.log("Market Sentinel Bot is alive and kicking (polling)! 🚀");
        }).catch(err => {
            console.error('Failed to launch bot in polling mode:', err);
        });
    }
});

// Enable graceful stop
const shutdown = (signal) => {
    console.log(`Received ${signal}. Shutting down...`);
    // Telegraf's bot.stop() can throw if the bot isn't currently polling or running its own server.
    // In webhook mode with a custom server, we don't strictly need bot.stop().
    if (!RENDER_EXTERNAL_URL) {
        try {
            bot.stop(signal);
        } catch (err) {
            console.warn('Bot stop warning:', err.message);
        }
    }
    server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
    });
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
