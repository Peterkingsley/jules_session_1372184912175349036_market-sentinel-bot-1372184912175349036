require('dotenv').config();
const { getPrice, getTopTokens } = require('../src/crypto');
const { rewriteInBrandVoice } = require('../src/ai');

async function runTests() {
    console.log('--- Testing Crypto Module ---');
    try {
        const btc = await getPrice('bitcoin');
        console.log('BTC Price:', btc);
    } catch (e) {
        console.log('Crypto test failed:', e.message);
    }
    
    try {
        const topEth = await getTopTokens('ethereum');
        console.log('Top Ethereum Tokens:', topEth.length, 'found');
    } catch (e) {
        console.log('Top tokens test failed:', e.message);
    }

    console.log('\n--- Testing AI Module ---');
    const rawData = 'BTC is at $60,000, up 5% today.';
    try {
        const flavored = await rewriteInBrandVoice(rawData);
        console.log('Raw:', rawData);
        console.log('AI Flavored:', flavored);
    } catch (e) {
        console.log('AI test failed:', e.message);
    }
}

runTests().catch(console.error);
