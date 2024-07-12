import { ethers } from 'ethers';
export const resolveAlchemyGasAndPaymasterData = (entrypointAddress, paymasterRpcUrl, policyId, overrides) => async (ctx) => {
    const provider = new ethers.providers.JsonRpcProvider(paymasterRpcUrl);
    const res = await provider.send('alchemy_requestGasAndPaymasterAndData', [
        {
            policyId,
            entryPoint: entrypointAddress,
            dummySignature: ctx.op.signature,
            userOperation: {
                sender: ctx.op.sender,
                nonce: ctx.op.nonce['_hex'],
                initCode: ctx.op.initCode,
                callData: ctx.op.callData,
            },
            overrides,
        },
    ]);
    if (res.error) {
        throw new Error(res.error.message);
    }
    ctx.op.paymasterAndData = res.paymasterAndData;
    ctx.op.callGasLimit = res.callGasLimit;
    ctx.op.verificationGasLimit = res.verificationGasLimit;
    ctx.op.preVerificationGas = res.preVerificationGas;
    ctx.op.maxFeePerGas = res.maxFeePerGas;
    ctx.op.maxPriorityFeePerGas = res.maxPriorityFeePerGas;
};
//# sourceMappingURL=resolveAlchemyGasAndPaymasterData.js.map