require('dotenv').config();

module.exports = {
    MORALIS_API_KEY: process.env.MORALIS_API_KEY,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || process.env.MAIN_CHAT_ID,
    WHALE_USD_THRESHOLD: parseFloat(process.env.WHALE_USD_THRESHOLD || '50000'),
    LOW_CAP_MAX_MC: parseFloat(process.env.LOW_CAP_MAX_MC || '15000000'),
};
