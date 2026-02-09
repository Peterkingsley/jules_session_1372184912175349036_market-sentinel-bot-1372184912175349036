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

// 2. Optimized New Member / Group Join Handler
bot.on('new_chat_members', async (ctx) => {
    try {
        const newMembers = ctx.message.new_chat_members;
        const botInfo = await ctx.telegram.getMe();
        
        // Check if the bot itself was added to the group
        const isBotAdded = newMembers.some(member => member.id === botInfo.id);

        if (isBotAdded) {
            // Case A: The bot just joined a new group
            const welcomeBack = await rewriteInBrandVoice(
                `I have just arrived in the group "${ctx.chat.title}". I am ready to monitor the charts and keep the community updated with spicy market intel.`
            );
            return ctx.reply(welcomeBack);
        }

        // Case B: Users joined. We fetch market data once to save API calls
        const btc = await getPrice('bitcoin');
        const marketSnippet = btc ? `BTC is currently at $${btc.price} (${btc.change}% 24h).` : 'The market is looking interesting today.';

        // To avoid spamming and AI rate limits, we greet multiple people in one message if they join together
        const humanNames = newMembers
            .filter(m => !m.is_bot)
            .map(m => m.first_name)
            .join(', ');

        if (!humanNames) return;

        const welcomePrompt = `
            Context: Multiple new members joined: ${humanNames}. 
            Current Market: ${marketSnippet}.
            Task: Write one unified, high-energy welcome message for the group. 
            Mention the names and give a quick "Sentinel" style market vibe check.
        `;

        const response = await askAI(welcomePrompt);
        await ctx.reply(response);

    } catch (error) {
        console.error('Error in new_chat_members handler:', error);
    }
});

// 3. Initialize background tasks
initScheduler(bot);
startMonitoring(bot);

// --- SERVER SETUP FOR RENDER / WEBHOOKS ---
const PORT = process.env.PORT || 3000;
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
                console.error('Webhook error:', err);
                res.statusCode = 500;
                res.end();
            }
        });
        return;
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Market Sentinel Bot is running\n');
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);

    if (RENDER_EXTERNAL_URL) {
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
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));