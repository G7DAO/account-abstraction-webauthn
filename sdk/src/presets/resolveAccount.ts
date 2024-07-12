import { ethers } from 'ethers';
import { UserOperationMiddlewareFn } from 'userop';

export const resolveAccount =
  (
    provider: ethers.providers.JsonRpcProvider,
    walletFactoryContract: ethers.Contract,
    login: string,
    walletAddress: string
  ): UserOperationMiddlewareFn =>
  async (ctx) => {
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
