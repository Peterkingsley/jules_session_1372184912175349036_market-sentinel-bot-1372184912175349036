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

async function getMarketMovers() {
    try {
        const res = await axios.get(`https://api.coingecko.com/api/v3/coins/markets`, {
            params: {
                vs_currency: 'usd',
                order: 'volume_desc',
                per_page: 20,
                page: 1,
                sparkline: false,
                price_change_percentage: '1h,24h'
            }
        });
        return res.data.map(coin => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol.toUpperCase(),
            price: coin.current_price,
            change1h: coin.price_change_percentage_1h_in_currency,
            change24h: coin.price_change_percentage_24h_in_currency,
            volume: coin.total_volume
        }));
    } catch (error) {
        console.error('Error fetching market movers:', error.message);
        return [];
    }
}

async function getGlobalData() {
    try {
        const res = await axios.get('https://api.coingecko.com/api/v3/global');
        const data = res.data.data;
        return {
            total_market_cap: data.total_market_cap.usd,
            market_cap_change_percentage_24h_usd: data.market_cap_change_percentage_24h_usd,
            market_cap_percentage: data.market_cap_percentage
        };
    } catch (error) {
        console.error('Error fetching global data:', error.message);
        return null;
    }
}

async function getTrendingCoins() {
    try {
        const res = await axios.get("https://api.coingecko.com/api/v3/search/trending");
        return res.data.coins.map(c => ({
            id: c.item.id,
            name: c.item.name,
            symbol: c.item.symbol,
            market_cap_rank: c.item.market_cap_rank
        }));
    } catch (error) {
        console.error("Error fetching trending coins:", error.message);
        return [];
    }
}

async function getRandomMarketData() {
    try {
        const res = await axios.get("https://api.coingecko.com/api/v3/coins/markets", {
            params: {
                vs_currency: "usd",
                order: "market_cap_desc",
                per_page: 100,
                page: 1,
                sparkline: false,
                price_change_percentage: "24h"
            }
        });
        const randomIndex = Math.floor(Math.random() * res.data.length);
        const coin = res.data[randomIndex];
        return {
            name: coin.name,
            symbol: coin.symbol.toUpperCase(),
            price: coin.current_price,
            change: coin.price_change_percentage_24h ? coin.price_change_percentage_24h.toFixed(2) : "0.00"
        };
    } catch (error) {
        console.error("Error fetching random market data:", error.message);
        return null;
    }
}

async function getRandomToken() {
    try {
        // 1. Get the list of ALL millions/thousands of tokens
        const res = await axios.get('https://api.coingecko.com/api/v3/coins/list');
        const allTokens = res.data;

        // 2. Select one at random from the entire array
        const randomToken = allTokens[Math.floor(Math.random() * allTokens.length)];

        // 3. Fetch detailed data for that specific random ID
        const detailRes = await axios.get(`https://api.coingecko.com/api/v3/coins/${randomToken.id}`);
        const data = detailRes.data;

        return {
            name: data.name,
            symbol: data.symbol.toUpperCase(),
            price: data.market_data.current_price.usd,
            change: data.market_data.price_change_percentage_24h?.toFixed(2) || '0.00',
            description: data.description.en || "No description available."
        };
    } catch (error) {
        console.error('Error fetching random token:', error.message);
        return null;
    }
}

module.exports = { getPrice, getTopTokens, getMarketMovers, getGlobalData, getTrendingCoins, getRandomMarketData, getRandomToken };
