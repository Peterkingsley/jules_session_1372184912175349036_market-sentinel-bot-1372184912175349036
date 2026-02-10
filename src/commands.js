const { getLatestNews } = require('./news');
const { getPrice } = require('./crypto');
const { rewriteInBrandVoice } = require('./ai');

const setupCommands = (bot) => {
    bot.start((ctx) => {
        const welcomeMsg = "Welcome to the Market Sentinel ecosystem! 🚀 I'm here to keep you updated with the spiciest market intelligence. Ask me for prices with /p <coin> or just chat with me!";
        ctx.reply(welcomeMsg);
    });

    bot.command('p', async (ctx) => {
        const coin = ctx.message.text.split(' ')[1];
        if (!coin) return ctx.reply("Please specify a coin (e.g., /p bitcoin)");

        await ctx.sendChatAction('typing');
        const data = await getPrice(coin);
        if (data) {
            const raw = `💰 ${coin.toUpperCase()}\nPrice: $${data.price}\n24h Change: ${data.change}%`;
            const flavored = await rewriteInBrandVoice(raw);
            ctx.reply(flavored, { parse_mode: 'Markdown', reply_to_message_id: ctx.message.message_id });
        } else {
            ctx.reply("I couldn't find that coin. Are you sure it's not some hidden gem I haven't indexed yet? Try 'bitcoin' or 'ethereum'.");
        }
    });

    bot.command('news', async (ctx) => {
        await ctx.sendChatAction('typing');
        const news = await getLatestNews();
        if (news) {
            let sentimentStr = '';
            if (news.votes) {
                const { positive, negative, important } = news.votes;
                if (positive > 0 || negative > 0 || important > 0) {
                    sentimentStr = ` (Sentiment: +${positive || 0}/-${negative || 0}, Importance: ${important || 0})`;
                }
            }
            const raw = `Latest News: "${news.title}" (Source: ${news.domain})${sentimentStr}. Panic Score: ${news.panic_score || 'N/A'}`;
            const flavored = await rewriteInBrandVoice(raw);
            ctx.reply(`${flavored}

🔗 [Read full article](${news.url})`, {
                parse_mode: 'Markdown',
                disable_web_page_preview: false,
                reply_to_message_id: ctx.message.message_id
            });
        } else {
            ctx.reply("The news wires are a bit quiet right now. Check back in a few!");
        }
    });

    bot.command('setbroadcast', (ctx) => {
        const chatId = ctx.chat.id;
        ctx.reply(`Broadcast chat set to this group! (ID: ${chatId})\nI'll send market reports here on Mondays, Tuesdays, and Wednesdays.`);
        // In a real app, you'd save this to a database or .env file
        process.env.MAIN_CHAT_ID = chatId;
    });

    bot.command('testai', async (ctx) => {
        const text = ctx.message.text.split(' ').slice(1).join(' ');
        if (!text) return ctx.reply("Usage: /testai <message to test>");

        await ctx.sendChatAction('typing');
        const response = await rewriteInBrandVoice(text);
        ctx.reply(`[Test Mode Output]:\n\n${response}`);
    });
};

module.exports = { setupCommands };
