const fs = require('fs');
const path = require('path');

const CHATS_FILE = path.join(__dirname, '../chats.json');

function getChats() {
    if (!fs.existsSync(CHATS_FILE)) {
        return [];
    }
    try {
        const data = fs.readFileSync(CHATS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading chats file:', err);
        return [];
    }
}

function saveChats(chats) {
    try {
        fs.writeFileSync(CHATS_FILE, JSON.stringify(chats, null, 2));
    } catch (err) {
        console.error('Error saving chats file:', err);
    }
}

function addChat(chatId) {
    const chats = getChats();
    if (!chats.includes(chatId)) {
        chats.push(chatId);
        saveChats(chats);
        console.log(`Chat ${chatId} added to storage.`);
    }
}

function removeChat(chatId) {
    let chats = getChats();
    if (chats.includes(chatId)) {
        chats = chats.filter(id => id !== chatId);
        saveChats(chats);
        console.log(`Chat ${chatId} removed from storage.`);
    }
}

module.exports = {
    getChats,
    addChat,
    removeChat
};
