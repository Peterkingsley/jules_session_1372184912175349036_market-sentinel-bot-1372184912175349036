const axios = require('axios');
const { getMarketMovers } = require('./crypto');
const { rewriteInBrandVoice } = require('./ai');
const { broadcast } = require('./utils');

let lastMovers = [];
let knownCoins = new Set();

async function startMonitoring(bot) {
    console.log('Starting market monitoring...');

    // Initialize known coins list
    try {
        const res = await axios.get('https://api.coingecko.com/api/v3/coins/list');
        res.data.forEach(c => knownCoins.add(c.id));
        console.log(`Initialized with ${knownCoins.size} coins.`);
    } catch (e) {
        console.error('Failed to initialize coin list:', e.message);
    }

    // Check every 10 minutes
    setInterval(async () => {
        const movers = await getMarketMovers();
        if (!movers || movers.length === 0) return;

        // Volatility Tracking: Detect sudden 1h spikes (> 5%)
        const highVolatility = movers.filter(m => Math.abs(m.change1h) > 5);

        for (const coin of highVolatility) {
            const rawData = `VOLATILITY ALERT: ${coin.name} (${coin.symbol}) is moving fast! ${coin.change1h > 0 ? '🚀 UP' : '📉 DOWN'} ${coin.change1h.toFixed(2)}% in the last hour. Price: $${coin.price}`;
            const flavored = await rewriteInBrandVoice(rawData);
            broadcast(bot, flavored);
        }

        lastMovers = movers;

        // New Listing Alerts
        try {
            const res = await axios.get('https://api.coingecko.com/api/v3/coins/list');
            const currentCoins = res.data;
            const newCoins = currentCoins.filter(c => !knownCoins.has(c.id));

            if (newCoins.length > 0 && newCoins.length < 50) { // Avoid spam if API fails and returns partial list
                for (const coin of newCoins) {
                    const rawData = `NEW LISTING ALERT: ${coin.name} (${coin.symbol.toUpperCase()}) just appeared on CoinGecko! 🚀`;
                    const flavored = await rewriteInBrandVoice(rawData);
                    broadcast(bot, flavored);
                    knownCoins.add(coin.id);
                }
            } else if (newCoins.length >= 50) {
                // Too many new coins, probably a refresh or API issue, just update the set
                currentCoins.forEach(c => knownCoins.add(c.id));
            }
        } catch (e) {
            console.error('Error checking for new listings:', e.message);
        }

    }, 10 * 60 * 1000);
}

module.exports = { startMonitoring };
