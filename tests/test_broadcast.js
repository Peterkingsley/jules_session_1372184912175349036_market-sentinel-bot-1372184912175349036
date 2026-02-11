const { broadcast } = require('../src/utils');
const { addChat, getChats } = require('../src/storage');

async function testBroadcast() {
    console.log('--- Testing Broadcast Utility ---');

    // Setup test chats
    addChat('chat_1');
    addChat('chat_kick');

    const mockBot = {
        telegram: {
            sendMessage: async (chatId, message, extra) => {
                console.log(`Mock sending to ${chatId}: ${message}`);
                if (chatId === 'chat_kick') {
                    const error = new Error('Forbidden: bot was kicked from the group chat');
                    error.description = 'Forbidden: bot was kicked from the group chat';
                    throw error;
                }
                return true;
            }
        }
    };

    await broadcast(mockBot, 'Test broadcast message');

    const remainingChats = getChats();
    console.log('Remaining chats:', remainingChats);

    if (remainingChats.includes('chat_1') && !remainingChats.includes('chat_kick')) {
        console.log('Broadcast test passed!');
    } else {
        console.error('Broadcast test failed!');
        process.exit(1);
    }
}

testBroadcast().catch(console.error);
