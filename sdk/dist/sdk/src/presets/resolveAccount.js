export const resolveAccount = (provider, walletFactoryContract, login, walletAddress) => async (ctx) => {
    const walletCode = await provider.getCode(walletAddress);
    const walletExists = walletCode !== '0x';
    if (!walletExists) {
        ctx.op.initCode =
            walletFactoryContract.address +
                walletFactoryContract.interface
                    .encodeFunctionData('createAccount(string, uint256)', [login, 0])
                    .slice(2);
    }
};
//# sourceMappingURL=resolveAccount.js.map