const cron = require('node-cron');
const { getPrice, getTopTokens } = require('./crypto');
const { rewriteInBrandVoice } = require('./ai');

function initScheduler(bot) {
    // Mondays: General market sentiment/Recap at 9 AM
    cron.schedule('0 9 * * 1', async () => {
        const chatId = process.env.MAIN_CHAT_ID;
        if (!chatId) return;

        const btc = await getPrice('bitcoin');
        const eth = await getPrice('ethereum');
        const sol = await getPrice('solana');
        
        const rawData = `Monday Market Recap:\nBTC: $${btc.price} (${btc.change}%)\nETH: $${eth.price} (${eth.change}%)\nSOL: $${sol.price} (${sol.change}%)\nSummary: The week is starting and we are looking at the majors.`;
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
        let rawData = "Wednesday Top Solana Tokens:\n";
        tokens.forEach(t => {
            rawData += `- ${t.name} (${t.symbol}): $${t.price} (${t.change}%)\n`;
        });
        const flavored = await rewriteInBrandVoice(rawData);
        bot.telegram.sendMessage(chatId, flavored);
    });

    console.log('Scheduler initialized. Broadcasts will be sent if MAIN_CHAT_ID is set.');
}

module.exports = { initScheduler };
