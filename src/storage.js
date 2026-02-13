const fs = require('fs');
const path = require('path');

const CHATS_FILE = path.join(__dirname, '../chats.json');

function getData() {
    if (!fs.existsSync(CHATS_FILE)) {
        return { chats: [], isPaused: false };
    }
    try {
        const data = fs.readFileSync(CHATS_FILE, 'utf8');
        const parsed = JSON.parse(data);
        // Migration: handle old array format
        if (Array.isArray(parsed)) {
            return { chats: parsed, isPaused: false };
        }
        return {
            chats: parsed.chats || [],
            isPaused: parsed.isPaused || false
        };
    } catch (err) {
        console.error('Error reading chats file:', err);
        return { chats: [], isPaused: false };
    }
}

function saveData(data) {
    try {
        fs.writeFileSync(CHATS_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error saving chats file:', err);
    }
}

function getChats() {
    return getData().chats;
}

function addChat(chatId) {
    const data = getData();
    if (!data.chats.includes(chatId)) {
        data.chats.push(chatId);
        saveData(data);
        console.log(`Chat ${chatId} added to storage.`);
    }
}

function removeChat(chatId) {
    const data = getData();
    if (data.chats.includes(chatId)) {
        data.chats = data.chats.filter(id => id !== chatId);
        saveData(data);
        console.log(`Chat ${chatId} removed from storage.`);
    }
}

function isPaused() {
    return getData().isPaused;
}

function setPaused(paused) {
    const data = getData();
    data.isPaused = paused;
    saveData(data);
    console.log(`News posts state set to: ${paused ? 'paused' : 'resumed'}`);
}

module.exports = {
    getChats,
    addChat,
    removeChat,
    isPaused,
    setPaused
};
