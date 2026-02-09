const axios = require('axios');
async function test() {
    try {
        const res = await axios.get('https://api.coingecko.com/api/v3/search/trending');
        console.log('Success:', res.data.coins.length, 'trending coins found');
        console.log('First coin:', res.data.coins[0].item.name);
    } catch (e) {
        console.log('Failed:', e.message);
    }
}
test();
