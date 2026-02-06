require('dotenv').config();
const { Telegraf } = require('telegraf');
const { setupCommands } = require('./commands');
const { askAI, rewriteInBrandVoice } = require('./ai');
const { initScheduler } = require('./scheduler');

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
    for (const member of newMembers) {
        const name = member.first_name || 'fren';
        const welcomePrompt = `Generate a unique, energetic, and professional greeting for a new member named "${name}" who just joined our crypto community. Mention that they are in the right place for market intelligence.`;
        const uniqueGreeting = await askAI(welcomePrompt);
        ctx.reply(uniqueGreeting, { reply_to_message_id: ctx.message.message_id });
    }
});

// 3. AI Chat (Catch-all for text)
bot.on('text', async (ctx) => {
    // Ignore commands (they start with /)
    if (ctx.message.text.startsWith('/')) return;

    await ctx.sendChatAction('typing');
    
    const userId = ctx.from.id;
    const userMessage = ctx.message.text;
    
    // Get or create session
    if (!sessions.has(userId)) {
        sessions.set(userId, []);
    }
    const history = sessions.get(userId);
    
    // Limit history size
    if (history.length > 10) history.shift();

    const aiResponse = await askAI(userMessage, history);
    
    // Update history (simplified format for this example)
    history.push({ role: 'user', parts: [{ text: userMessage }] });
    history.push({ role: 'model', parts: [{ text: aiResponse }] });
    
    await ctx.reply(aiResponse, { reply_to_message_id: ctx.message.message_id });
});

// 4. Initialize Scheduler
// Note: In a real scenario, you'd probably want to save the chat ID to a DB when the bot is added to a group.
// For now, we can use an environment variable or a command to set the broadcast target.
initScheduler(bot);

bot.launch().then(() => {
    console.log("Market Sentinel Bot is alive and kicking! 🚀");
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
