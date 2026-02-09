const { getRandomToken } = require('../src/crypto');

async function test() {
    console.log("Testing getRandomToken...");
    const token = await getRandomToken();
    if (token) {
        console.log("Success! Fetched a random token:");
        console.log(JSON.stringify(token, null, 2));
    } else {
        console.error("Failed to fetch a random token.");
        process.exit(1);
    }
}

test();
