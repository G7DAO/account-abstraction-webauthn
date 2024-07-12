export const resolveGoerliGasAndPaymasterData = (provider, paymasterUrl, entrypointAddress) => async (ctx) => {
    const paymasterAndData = await fetch(paymasterUrl, {
        method: 'POST',
        body: JSON.stringify(ctx.op),
        headers: {
            'content-type': 'application/json',
        },
    })
        .then((x) => x.json())
        .then((x) => x.paymasterData);
    console.log({ paymasterAndData });
    const gasLimits = await provider.send('eth_estimateUserOperationGas', [
        {
            ...ctx.op,
            nonce: ctx.op.nonce.toHexString(),
            callGasLimit: ctx.op.callGasLimit.toHexString(),
            maxFeePerGas: ctx.op.maxFeePerGas.toHexString(),
            maxPriorityFeePerGas: ctx.op.maxPriorityFeePerGas.toHexString(),
            preVerificationGas: ctx.op.preVerificationGas.toHexString(),
            verificationGasLimit: ctx.op.verificationGasLimit.toHexString(),
        },
        entrypointAddress,
    ]);
    ctx.op.paymasterAndData = paymasterAndData;
    ctx.op.callGasLimit = gasLimits.callGasLimit;
    ctx.op.verificationGasLimit = gasLimits.verificationGasLimit;
    ctx.op.preVerificationGas = gasLimits.preVerificationGas;
};
//# sourceMappingURL=resolveBaseGasAndPaymasterData.js.map