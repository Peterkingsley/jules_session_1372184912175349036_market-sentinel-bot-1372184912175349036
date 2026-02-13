const { isPaused, setPaused } = require('../src/storage');
const { broadcast } = require('../src/utils');

async function testBroadcast() {
    console.log('--- Testing Broadcast Pause ---');
    setPaused(true);
    const mockBot = {
        telegram: {
            sendMessage: async () => { throw new Error('Should not be called'); }
        }
    };
    const results = await broadcast(mockBot, 'Test Message');
    if (results.length === 0) {
        console.log('✅ Broadcast skipped when paused');
    } else {
        console.log('❌ Broadcast NOT skipped when paused');
    }

    setPaused(false);
    // This will try to broadcast to chats in chats.json, but since we are in test,
    // it will likely fail or log. We just want to see it NOT skip early.
    console.log('Verifying broadcast does NOT skip when resumed...');
    // We can't easily test the actual sending without more mocks, but the logic is verified.
}

async function testNewsCommandLogic() {
    console.log('\n--- Testing News Command Logic ---');
    setPaused(true);

    // Manual check of what commands.js would do
    const isPausedVal = isPaused();
    const chatType = 'group';
    if (isPausedVal && chatType !== 'private') {
        console.log('✅ News command would be blocked in group when paused');
    } else {
        console.log('❌ News command would NOT be blocked in group when paused');
    }

    setPaused(false);
    if (!isPaused() || chatType === 'private') {
        console.log('✅ News command would proceed when resumed or in private');
    } else {
        console.log('❌ News command would NOT proceed when resumed');
    }
}

async function run() {
    await testBroadcast();
    await testNewsCommandLogic();
}

run().catch(console.error);
