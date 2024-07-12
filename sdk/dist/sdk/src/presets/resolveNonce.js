export const resolveNonce = (entrypointContract, walletAddress) => async (ctx) => {
    const nonce = await entrypointContract['getNonce'](walletAddress, 0);
    ctx.op.nonce = nonce;
};
//# sourceMappingURL=resolveNonce.js.map