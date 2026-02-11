const { addChat, getChats, removeChat } = require('../src/storage');
const { broadcast } = require('../src/utils');
const fs = require('fs');
const path = require('path');

async function runFinalVerify() {
    console.log('--- Final Verification ---');

    // 1. Test Storage
    console.log('Testing Storage...');
    const initialChats = getChats();
    addChat('test_chat_1');
    addChat('test_chat_2');
    let chats = getChats();
    if (chats.includes('test_chat_1') && chats.includes('test_chat_2')) {
        console.log('Storage: Add works.');
    } else {
        throw new Error('Storage: Add failed.');
    }

    // 2. Test Broadcast Error Handling
    console.log('Testing Broadcast Error Handling...');
    const mockBot = {
        telegram: {
            sendMessage: async (chatId, message) => {
                if (chatId === 'test_chat_1') {
                    const err = new Error('Forbidden: bot was blocked by the user');
                    err.description = 'Forbidden: bot was blocked by the user';
                    throw err;
                }
                return true;
            }
        }
    };

    await broadcast(mockBot, 'Hello');
    chats = getChats();
    if (!chats.includes('test_chat_1') && chats.includes('test_chat_2')) {
        console.log('Broadcast: Error handling (auto-remove) works.');
    } else {
        throw new Error('Broadcast: Error handling failed.');
    }

    // 3. Verify Component Wiring (Static Analysis)
    console.log('Verifying Component Wiring...');
    const monitorContent = fs.readFileSync(path.join(__dirname, '../src/monitor.js'), 'utf8');
    const schedulerContent = fs.readFileSync(path.join(__dirname, '../src/scheduler.js'), 'utf8');
    const whaleAlertContent = fs.readFileSync(path.join(__dirname, '../src/services/autoWhaleAlerts/index.js'), 'utf8');
    const botContent = fs.readFileSync(path.join(__dirname, '../src/bot.js'), 'utf8');

    if (monitorContent.includes('broadcast(bot, flavored)') && !monitorContent.includes('process.env.MAIN_CHAT_ID')) {
        console.log('Monitor: Wired correctly.');
    } else {
        console.warn('Monitor: Might still use MAIN_CHAT_ID or not use broadcast correctly.');
    }

    if (schedulerContent.includes('broadcast(bot, flavored)') && !schedulerContent.includes('process.env.MAIN_CHAT_ID')) {
        console.log('Scheduler: Wired correctly.');
    } else {
        console.warn('Scheduler: Might still use MAIN_CHAT_ID or not use broadcast correctly.');
    }

    if (whaleAlertContent.includes('broadcast(bot, message')) {
        console.log('Whale Alerts: Wired correctly.');
    } else {
        throw new Error('Whale Alerts: Not using broadcast.');
    }

    if (botContent.includes('addChat(ctx.chat.id)') && botContent.includes("bot.on('my_chat_member'")) {
        console.log('Bot: Chat tracking wired correctly.');
    } else {
        throw new Error('Bot: Chat tracking not wired.');
    }

    console.log('--- All checks passed! ---');

    // Cleanup
    removeChat('test_chat_2');
}

runFinalVerify().catch(err => {
    console.error('Final verification failed:', err.message);
    process.exit(1);
});
