require('dotenv').config();
const { getTrendingCoins, getRandomMarketData } = require('../src/crypto');
const { getLatestNews } = require('../src/news');

async function verify() {
    console.log('--- Verifying Random Market Data ---');
    const coin = await getRandomMarketData();
    console.log('Random Coin:', coin);

    console.log('\n--- Verifying Trending Coins ---');
    const trending = await getTrendingCoins();
    console.log('Trending Coins found:', trending.length);
    if (trending.length > 0) {
        console.log('Sample Trending:', trending[0]);
    }

    console.log('\n--- Verifying News (might fail if no key) ---');
    const news = await getLatestNews();
    console.log('News:', news);
}

verify().catch(console.error);
