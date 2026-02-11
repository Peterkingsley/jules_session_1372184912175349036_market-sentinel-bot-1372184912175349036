const { parseSwapEvent, getParamValue } = require('./parser');
const { isWhaleTrade } = require('./detector');
const { broadcast } = require('../../utils');

async function handleMoralisWebhook(bot, data) {
    if (!data.logs || data.logs.length === 0) return;

    for (const log of data.logs) {
        try {
            const swap = parseSwapEvent(log);
            if (!swap) continue;

            // Discovery: Find token address by looking at other logs in the same transaction
            const txLogs = data.logs.filter(l => l.transactionHash === swap.transactionHash);
            const transferLogs = txLogs.filter(l =>
                l.decoded &&
                l.decoded.name === 'Transfer'
            );

            if (transferLogs.length > 0) {
                let subjectTokenLog;
                if (swap.type === 'buy') {
                    // Look for Transfer from Pair to Wallet/Recipient
                    subjectTokenLog = transferLogs.find(l =>
                        getParamValue(l.decoded.params, 'from') === swap.address &&
                        (getParamValue(l.decoded.params, 'to') === swap.wallet || swap.type === 'buy')
                    );
                } else {
                    // Look for Transfer to Pair from Wallet
                    subjectTokenLog = transferLogs.find(l =>
                        getParamValue(l.decoded.params, 'to') === swap.address
                    );
                }

                if (subjectTokenLog) {
                    swap.tokenAddress = subjectTokenLog.address;
                }
            }

            if (!swap.tokenAddress) continue;

            const chainId = data.chainId;
            const chainMap = {
                '0x1': 'eth',
                '0x38': 'bsc',
                '0x89': 'polygon',
                '0xa4b1': 'arbitrum',
                '0x2105': 'base'
            };
            const chain = chainMap[chainId] || 'eth';

            const whaleTrade = await isWhaleTrade(swap, chain);
            if (whaleTrade) {
                await sendWhaleAlert(bot, whaleTrade, chain);
            }
        } catch (err) {
            console.error('Error processing log:', err);
        }
    }
}

async function sendWhaleAlert(bot, trade, chain) {
    const explorerMap = {
        'eth': 'https://etherscan.io',
        'bsc': 'https://bscscan.com',
        'polygon': 'https://polygonscan.com',
        'arbitrum': 'https://arbiscan.io',
        'base': 'https://basescan.org'
    };
    const explorer = explorerMap[chain] || 'https://etherscan.io';
    const txLink = `${explorer}/tx/${trade.transactionHash}`;
    const walletLink = `${explorer}/address/${trade.wallet}`;
    const shortWallet = `${trade.wallet.slice(0, 6)}...${trade.wallet.slice(-3)}`;

    const message = `🐋 *Low-Cap Whale Trade*
*Token:* ${trade.tokenName} (${trade.tokenSymbol})
*Type:* ${trade.type.toUpperCase()}
*Market Cap:* $${(trade.marketCap / 1e6).toFixed(2)}M
*Trade Size:* $${trade.usdValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
*Amount:* ${trade.amount.toLocaleString()} ${trade.tokenSymbol}
*Wallet:* [${shortWallet}](${walletLink})
*TX:* [View on Explorer](${txLink})
*Time:* Just now`;

    await broadcast(bot, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
    });
}

module.exports = { handleMoralisWebhook };
