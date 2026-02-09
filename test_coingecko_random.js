const axios = require('axios');
async function test() {
    try {
        const res = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
            params: {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: 100,
                page: 1,
                sparkline: false,
                price_change_percentage: '24h'
            }
        });
        const randomIndex = Math.floor(Math.random() * res.data.length);
        const coin = res.data[randomIndex];
        console.log('Random coin:', coin.name, coin.symbol, coin.current_price, coin.price_change_percentage_24h);
    } catch (e) {
        console.log('Failed:', e.message);
    }
}
test();
