const axios = require('axios');
const { MORALIS_API_KEY } = require('./config');

const MORALIS_BASE_URL = 'https://deep-index.moralis.io/api/v2.1';

async function getTokenPrice(address, chain = 'eth') {
    if (!MORALIS_API_KEY) return null;
    try {
        const response = await axios.get(`${MORALIS_BASE_URL}/erc20/${address}/price`, {
            params: { chain },
            headers: { 'X-API-Key': MORALIS_API_KEY }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching Moralis price for ${address}:`, error.message);
        return null;
    }
}

async function getTokenMetadata(address, chain = 'eth') {
    if (!MORALIS_API_KEY) return null;
    try {
        const response = await axios.get(`${MORALIS_BASE_URL}/erc20/metadata`, {
            params: { chain, 'addresses[0]': address },
            headers: { 'X-API-Key': MORALIS_API_KEY }
        });
        return response.data && response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
        console.error(`Error fetching Moralis metadata for ${address}:`, error.message);
        return null;
    }
}

async function getMarketCap(address, chain = 'eth', usdPrice) {
    // 1. Try CoinGecko first as it's more reliable for MC
    try {
        const platform = chain === 'eth' ? 'ethereum' : (chain === 'bsc' ? 'binance-smart-chain' : chain);
        const cgRes = await axios.get(`https://api.coingecko.com/api/v3/coins/${platform}/contract/${address}`);
        if (cgRes.data && cgRes.data.market_data && cgRes.data.market_data.market_cap) {
            return cgRes.data.market_data.market_cap.usd;
        }
    } catch (e) {
        // CoinGecko might not have it or rate limit
    }

    // 2. Fallback: Calculate if we have price and total supply
    try {
        const metadata = await getTokenMetadata(address, chain);
        if (metadata && metadata.total_supply && usdPrice) {
            const totalSupply = parseFloat(metadata.total_supply) / Math.pow(10, parseInt(metadata.decimals));
            return totalSupply * usdPrice;
        }
    } catch (e) {
        // console.error('Error calculating market cap fallback:', e.message);
    }

    return null;
}

module.exports = { getTokenPrice, getTokenMetadata, getMarketCap };
