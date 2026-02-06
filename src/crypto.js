const axios = require('axios');

async function getPrice(coinId) {
    try {
        const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`);
        const data = res.data[coinId.toLowerCase()];
        if (!data) return null;
        return {
            price: data.usd,
            change: data.usd_24h_change ? data.usd_24h_change.toFixed(2) : '0.00'
        };
    } catch (error) {
        console.error('Error fetching price:', error.message);
        return null;
    }
}

async function getTopTokens(platform = 'ethereum') {
    try {
        // Using markets endpoint to get top tokens by market cap as a proxy for "top performing" or just "top"
        // For Solana, CoinGecko uses 'solana' as platform.
        const res = await axios.get(`https://api.coingecko.com/api/v3/coins/markets`, {
            params: {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: 5,
                page: 1,
                sparkline: false,
                price_change_percentage: '24h',
                category: platform === 'ethereum' ? 'ethereum-ecosystem' : 'solana-ecosystem'
            }
        });
        return res.data.map(coin => ({
            name: coin.name,
            symbol: coin.symbol.toUpperCase(),
            price: coin.current_price,
            change: coin.price_change_percentage_24h ? coin.price_change_percentage_24h.toFixed(2) : '0.00'
        }));
    } catch (error) {
        console.error('Error fetching top tokens:', error.message);
        return [];
    }
}

module.exports = { getPrice, getTopTokens };
