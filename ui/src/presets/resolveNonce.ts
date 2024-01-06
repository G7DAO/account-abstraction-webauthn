import { ethers } from 'ethers';
import { UserOperationMiddlewareFn } from 'userop';

export const resolveNonce =
  (
    entrypointContract: ethers.Contract,
    walletAddress: string
  ): UserOperationMiddlewareFn =>
  async (ctx) => {
    const nonce = await entrypointContract['getNonce'](walletAddress, 0);

    ctx.op.nonce = nonce;
  };
