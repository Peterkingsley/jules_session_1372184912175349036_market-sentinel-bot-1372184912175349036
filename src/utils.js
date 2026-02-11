const { getChats, removeChat } = require('./storage');

async function broadcast(bot, message, extra = {}) {
    const chats = getChats();
    console.log(`Broadcasting to ${chats.length} chats...`);

    const results = await Promise.allSettled(chats.map(async (chatId) => {
        try {
            await bot.telegram.sendMessage(chatId, message, extra);
            return { chatId, status: 'sent' };
        } catch (err) {
            console.error(`Failed to send message to ${chatId}:`, err.message);

            // If the bot was kicked or the chat doesn't exist, remove it from storage
            if (err.description && (
                err.description.includes('bot was kicked') ||
                err.description.includes('chat not found') ||
                err.description.includes('user is deactivated') ||
                err.description.includes('bot was blocked')
            )) {
                removeChat(chatId);
            }
            return { chatId, status: 'failed', error: err.message };
        }
    }));

    return results;
}

module.exports = {
    broadcast
};
