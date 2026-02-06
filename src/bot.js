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
// Note: In a real scenario, you'd probably want to save the chat ID to a DB when the bot is added to a group.
// For now, we can use an environment variable or a command to set the broadcast target.
initScheduler(bot);
startMonitoring(bot);

// Health Check Server for Render
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Market Sentinel Bot is running\n');
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Health check server listening on port ${PORT}`);
});

bot.launch().then(() => {
    console.log("Market Sentinel Bot is alive and kicking! 🚀");
});


// Enable graceful stop
const shutdown = (signal) => {
    console.log(`Received ${signal}. Shutting down...`);
    bot.stop(signal);
    server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
    });
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
