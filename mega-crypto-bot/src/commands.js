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

    bot.command('setbroadcast', (ctx) => {
        const chatId = ctx.chat.id;
        ctx.reply(`Broadcast chat set to this group! (ID: ${chatId})\nI'll send market reports here on Mondays, Tuesdays, and Wednesdays.`);
        // In a real app, you'd save this to a database or .env file
        process.env.MAIN_CHAT_ID = chatId;
    });
};

module.exports = { setupCommands };
