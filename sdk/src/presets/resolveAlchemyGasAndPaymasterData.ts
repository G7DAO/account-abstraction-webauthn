import { BigNumber, ethers } from 'ethers';
import { UserOperationMiddlewareFn } from 'userop';

export const resolveAlchemyGasAndPaymasterData =
  (
    entrypointAddress: string,
    paymasterRpcUrl: string,
    policyId: string,
    overrides?: { preVerificationGas?: string | { percentage: number } }
  ): UserOperationMiddlewareFn =>
  async (ctx) => {
    const provider = new ethers.providers.JsonRpcProvider(paymasterRpcUrl);

    const res = await provider.send('alchemy_requestGasAndPaymasterAndData', [
      {
        policyId,
        entryPoint: entrypointAddress,
        dummySignature: ctx.op.signature,
        userOperation: {
          sender: ctx.op.sender,
          nonce: (ctx.op.nonce as BigNumber)['_hex'],
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
