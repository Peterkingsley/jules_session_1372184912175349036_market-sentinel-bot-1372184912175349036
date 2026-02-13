const { getChats, addChat, removeChat, isPaused, setPaused } = require('../src/storage');
const fs = require('fs');
const path = require('path');

const CHATS_FILE = path.join(__dirname, '../chats.json');

function cleanup() {
    if (fs.existsSync(CHATS_FILE)) {
        fs.unlinkSync(CHATS_FILE);
    }
}

async function runTests() {
    console.log('--- Testing Storage Migration ---');
    cleanup();
    // Create old format
    fs.writeFileSync(CHATS_FILE, JSON.stringify(['chat_1', 'chat_2']));

    let chats = getChats();
    console.log('Chats after migration:', chats);
    if (chats.length === 2 && chats.includes('chat_1') && chats.includes('chat_2')) {
        console.log('✅ Migration successful');
    } else {
        console.log('❌ Migration failed');
    }

    console.log('\n--- Testing Paused State ---');
    console.log('Initial isPaused:', isPaused());
    setPaused(true);
    console.log('After setPaused(true):', isPaused());
    if (isPaused() === true) {
        console.log('✅ setPaused(true) successful');
    } else {
        console.log('❌ setPaused(true) failed');
    }

    setPaused(false);
    console.log('After setPaused(false):', isPaused());
    if (isPaused() === false) {
        console.log('✅ setPaused(false) successful');
    } else {
        console.log('❌ setPaused(false) failed');
    }

    console.log('\n--- Testing Add/Remove Chat ---');
    addChat('chat_3');
    chats = getChats();
    console.log('Chats after addChat:', chats);
    if (chats.includes('chat_3')) {
        console.log('✅ addChat successful');
    } else {
        console.log('❌ addChat failed');
    }

    removeChat('chat_1');
    chats = getChats();
    console.log('Chats after removeChat:', chats);
    if (!chats.includes('chat_1')) {
        console.log('✅ removeChat successful');
    } else {
        console.log('❌ removeChat failed');
    }

    // Verify file structure
    const data = JSON.parse(fs.readFileSync(CHATS_FILE, 'utf8'));
    console.log('\nFile content:', JSON.stringify(data, null, 2));
    if (data.chats && typeof data.isPaused === 'boolean') {
        console.log('✅ File structure correct');
    } else {
        console.log('❌ File structure incorrect');
    }
}

runTests().catch(console.error);
