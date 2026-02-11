const moralis = require('./moralis');
const { WHALE_USD_THRESHOLD, LOW_CAP_MAX_MC } = require('./config');

const processedTransactions = new Set();

async function isWhaleTrade(swap, chain = 'eth') {
    // Prevent duplicate processing
    if (processedTransactions.has(swap.transactionHash)) return null;
    processedTransactions.add(swap.transactionHash);

    // Cleanup cache occasionally
    if (processedTransactions.size > 1000) {
        const arr = Array.from(processedTransactions);
        arr.slice(0, 500).forEach(tx => processedTransactions.delete(tx));
    }

    if (!swap.tokenAddress) return null;

    const priceData = await moralis.getTokenPrice(swap.tokenAddress, chain);
    if (!priceData) return null;

    const usdPrice = priceData.usdPrice;
    const metadata = await moralis.getTokenMetadata(swap.tokenAddress, chain);
    if (!metadata) return null;

    const amount = parseFloat(swap.amountRaw.toString()) / Math.pow(10, parseInt(metadata.decimals));
    const usdValue = amount * usdPrice;

    if (usdValue < WHALE_USD_THRESHOLD) return null;

    const marketCap = await moralis.getMarketCap(swap.tokenAddress, chain, usdPrice);
    if (!marketCap || marketCap > LOW_CAP_MAX_MC) return null;

    return {
        ...swap,
        tokenSymbol: metadata.symbol,
        tokenName: metadata.name,
        amount,
        usdValue,
        marketCap,
        usdPrice
    };
}

module.exports = { isWhaleTrade };
