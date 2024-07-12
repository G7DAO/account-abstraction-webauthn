import { BigNumber, ethers } from 'ethers';
import { UserOperationMiddlewareFn } from 'userop';

export const resolveGoerliGasAndPaymasterData =
  (
    provider: ethers.providers.JsonRpcProvider,
    paymasterUrl: string,
    entrypointAddress: string
  ): UserOperationMiddlewareFn =>
  async (ctx) => {
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
        nonce: (ctx.op.nonce as BigNumber).toHexString(),
        callGasLimit: (ctx.op.callGasLimit as BigNumber).toHexString(),
        maxFeePerGas: (ctx.op.maxFeePerGas as BigNumber).toHexString(),
        maxPriorityFeePerGas: (
          ctx.op.maxPriorityFeePerGas as BigNumber
        ).toHexString(),
        preVerificationGas: (
          ctx.op.preVerificationGas as BigNumber
        ).toHexString(),
        verificationGasLimit: (
          ctx.op.verificationGasLimit as BigNumber
        ).toHexString(),
      },
      entrypointAddress,
    ]);

    ctx.op.paymasterAndData = paymasterAndData;
    ctx.op.callGasLimit = gasLimits.callGasLimit;
    ctx.op.verificationGasLimit = gasLimits.verificationGasLimit;
    ctx.op.preVerificationGas = gasLimits.preVerificationGas;
  };
