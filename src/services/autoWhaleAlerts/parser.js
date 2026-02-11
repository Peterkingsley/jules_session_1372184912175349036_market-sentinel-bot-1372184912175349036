function getParamValue(params, name) {
    if (Array.isArray(params)) {
        const param = params.find(p => p.name === name);
        return param ? param.value : undefined;
    }
    return params[name]?.value || params[name];
}

function parseSwapEvent(log) {
    if (!log.decoded || log.decoded.name !== 'Swap') return null;

    const params = log.decoded.params;
    const result = {
        transactionHash: log.transactionHash,
        address: log.address, // The Pair/Pool address
        wallet: '',
        tokenAddress: '',
        amount: 0,
        type: 'unknown'
    };

    const amount0In = getParamValue(params, 'amount0In');

    // Uniswap V2 style
    if (amount0In !== undefined) {
        const a0In = BigInt(amount0In);
        const a1In = BigInt(getParamValue(params, 'amount1In'));
        const a0Out = BigInt(getParamValue(params, 'amount0Out'));
        const a1Out = BigInt(getParamValue(params, 'amount1Out'));

        result.wallet = getParamValue(params, 'to');

        if (a0Out > 0n) {
            result.type = 'buy';
            result.tokenIndex = 0;
            result.amountRaw = a0Out;
        } else if (a1Out > 0n) {
            result.type = 'buy';
            result.tokenIndex = 1;
            result.amountRaw = a1Out;
        } else if (a0In > 0n) {
            result.type = 'sell';
            result.tokenIndex = 0;
            result.amountRaw = a0In;
        } else if (a1In > 0n) {
            result.type = 'sell';
            result.tokenIndex = 1;
            result.amountRaw = a1In;
        }
    }
    // Uniswap V3 style
    else {
        const amount0 = getParamValue(params, 'amount0');
        if (amount0 !== undefined) {
            const a0 = BigInt(amount0);
            const a1 = BigInt(getParamValue(params, 'amount1'));

            result.wallet = getParamValue(params, 'recipient');

            if (a0 < 0n) { // Pool sent token0 to user
                result.type = 'buy';
                result.tokenIndex = 0;
                result.amountRaw = -a0;
            } else if (a1 < 0n) { // Pool sent token1 to user
                result.type = 'buy';
                result.tokenIndex = 1;
                result.amountRaw = -a1;
            } else if (a0 > 0n) { // User sent token0 to pool
                result.type = 'sell';
                result.tokenIndex = 0;
                result.amountRaw = a0;
            } else if (a1 > 0n) { // User sent token1 to pool
                result.type = 'sell';
                result.tokenIndex = 1;
                result.amountRaw = a1;
            }
        }
    }

    return result;
}

module.exports = { parseSwapEvent, getParamValue };
