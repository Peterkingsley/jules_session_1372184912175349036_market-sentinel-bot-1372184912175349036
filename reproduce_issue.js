require('dotenv').config();
const { rewriteInBrandVoice } = require('./src/ai');

async function test() {
    const rawData = "Bitcoin is at $67,000. Ethereum is at $3,500.";
    for (let i = 0; i < 5; i++) {
        console.log(`Test ${i+1}:`);
        const flavored = await rewriteInBrandVoice(rawData);
        console.log(flavored);
        console.log('---');
    }
}

test().catch(console.error);
