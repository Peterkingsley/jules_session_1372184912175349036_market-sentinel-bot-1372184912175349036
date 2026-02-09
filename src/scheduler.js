const cron = require('node-cron');
const { getPrice, getTopTokens, getGlobalData, getRandomToken } = require('./crypto');
const { rewriteInBrandVoice } = require('./ai');

function initScheduler(bot) {
    // Mondays: General market sentiment/Recap at 9 AM
    cron.schedule('0 9 * * 1', async () => {
        const chatId = process.env.MAIN_CHAT_ID;
        if (!chatId) return;

        const global = await getGlobalData();
        const btc = await getPrice('bitcoin');
        const eth = await getPrice('ethereum');
        
        let rawData = "Monday Market Sentiment Report:\n";
        if (global) {
            rawData += `Total Market Cap: $${(global.total_market_cap / 1e12).toFixed(2)}T (${global.market_cap_change_percentage_24h_usd.toFixed(2)}%)\n`;
            rawData += `BTC Dominance: ${global.market_cap_percentage.btc.toFixed(2)}%\n`;
        }
        rawData += `BTC: $${btc?.price} (${btc?.change}%)\n`;
        rawData += `ETH: $${eth?.price} (${eth?.change}%)\n`;
        rawData += "Outlook: The week is fresh and the bulls/bears are fighting for territory.";

        const flavored = await rewriteInBrandVoice(rawData);
        bot.telegram.sendMessage(chatId, flavored);
    });

    // Tuesdays: Top performing tokens on Ethereum at 9 AM
    cron.schedule('0 9 * * 2', async () => {
        const chatId = process.env.MAIN_CHAT_ID;
        if (!chatId) return;

        const tokens = await getTopTokens('ethereum');
        let rawData = "Tuesday Top Ethereum Tokens:\n";
        tokens.forEach(t => {
            rawData += `- ${t.name} (${t.symbol}): $${t.price} (${t.change}%)\n`;
        });
        const flavored = await rewriteInBrandVoice(rawData);
        bot.telegram.sendMessage(chatId, flavored);
    });

    // Wednesdays: Top performing tokens on Solana at 9 AM
    cron.schedule('0 9 * * 3', async () => {
        const chatId = process.env.MAIN_CHAT_ID;
        if (!chatId) return;

        const tokens = await getTopTokens('solana');
        let rawData = "Wednesday Solana Alpha Report:\n";
        tokens.forEach(t => {
            rawData += `- ${t.name} (${t.symbol}): $${t.price} (${t.change}%)\n`;
        });
        const flavored = await rewriteInBrandVoice(rawData);
        bot.telegram.sendMessage(chatId, flavored);
    });

    // Monthly Performance Review: 1st of every month at 10 AM
    cron.schedule('0 10 1 * *', async () => {
        const chatId = process.env.MAIN_CHAT_ID;
        if (!chatId) return;

        const rawData = "Monthly Performance Review: It's the first of the month! Time to look back at the biggest winners and losers. (Note: Real monthly data would require historical API access, currently summarizing 24h as a placeholder for the monthly report structure).";
        const flavored = await rewriteInBrandVoice(rawData);
        bot.telegram.sendMessage(chatId, flavored);
    });

    // NEW: Every day at 3 PM, pick a random token from the millions available
    cron.schedule('0 15 * * *', async () => {
        const chatId = process.env.MAIN_CHAT_ID;
        if (!chatId) return;

        const token = await getRandomToken();
        if (token) {
            const rawData = `RANDOM TOKEN SPOTLIGHT:
            ${token.name} (${token.symbol})
            Price: $${token.price}
            24h Change: ${token.change}%
            Quick Info: ${token.description.substring(0, 200)}...`;

            const flavored = await rewriteInBrandVoice(rawData);
            bot.telegram.sendMessage(chatId, flavored);
        }
    });

    console.log('Scheduler initialized. Broadcasts will be sent if MAIN_CHAT_ID is set.');
}

module.exports = { initScheduler };
