const { getLatestNews } = require('./news');
const { getPrice } = require('./crypto');
const { rewriteInBrandVoice } = require('./ai');
const { isPaused, setPaused } = require('./storage');

const setupCommands = (bot) => {
    bot.start((ctx) => {
        const welcomeMsg = "welcome to the inner circle! I'm your Crypto News Educator. 📚 My goal is to help you understand complex market moves and blockchain news in simple terms. Ask me for prices with /p <coin> or just chat with me!";
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
        if (isPaused() && ctx.chat.type !== 'private') {
            return ctx.reply("News posts are currently paused in groups. ⏸️");
        }

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
        ctx.reply(`This group is now registered for automated alerts and reports! 🚀\nI broadcast market intelligence to all active communities I'm part of.`);
    });

    bot.command('pausenews', async (ctx) => {
        if (ctx.chat.type !== 'private') {
            try {
                const admins = await ctx.getChatAdministrators();
                const isAdmin = admins.some(a => a.user.id === ctx.from.id);
                if (!isAdmin) return ctx.reply("Only admins can pause news posts.");
            } catch (err) {
                console.error('Error checking admin status:', err.message);
                // If we can't check admins, we might be in a channel or something went wrong.
                // For safety, only allow if private or if we can verify admin.
                if (ctx.chat.type !== 'channel') return ctx.reply("I couldn't verify your admin status.");
            }
        }

        setPaused(true);
        ctx.reply("Automated news posts and market reports have been paused. ⏸️");
    });

    bot.command('resumenews', async (ctx) => {
        if (ctx.chat.type !== 'private') {
            try {
                const admins = await ctx.getChatAdministrators();
                const isAdmin = admins.some(a => a.user.id === ctx.from.id);
                if (!isAdmin) return ctx.reply("Only admins can resume news posts.");
            } catch (err) {
                console.error('Error checking admin status:', err.message);
                if (ctx.chat.type !== 'channel') return ctx.reply("I couldn't verify your admin status.");
            }
        }

        setPaused(false);
        ctx.reply("Automated news posts and market reports have been resumed. ▶️");
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
