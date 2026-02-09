const axios = require('axios');
async function test() {
    try {
        const res = await axios.get('https://cryptopanic.com/api/v1/posts/?public=true');
        console.log('Success without key:', res.data.results.length);
    } catch (e) {
        console.log('Failed without key:', e.message);
    }
}
test();
