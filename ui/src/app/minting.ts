import { ethers } from 'ethers';
import { IUserOperation, Presets, UserOperationBuilder } from 'userop';

import {
  resolveAccount,
  resolveAlchemyGasAndPaymasterData,
  resolveNonce,
  resolveWebAuthnSignature,
} from '../presets';

import {
  ENTRYPOINT_ADDRESS,
  avatarPackContract,
  entrypointContract,
  provider,
  walletFactoryContract,
  webauthnAccountAbi,
} from './contracts';

const LOGIN_URL = 'https://webauthn-server.deno.dev/login';
const CUSTOM_PAYMASTER_URL =
  'https://webauthn-server.deno.dev/sponsorUserOperation';

export async function sendTransaction(
  loginUsername: string,
  paymaster: 'STACKUP' | 'ALCHEMY',
  statusUpdateFn: (status: string) => void
): Promise<[ethers.Event[], ethers.providers.TransactionResponse]> {
  if (!loginUsername) throw Error('Login not set');

  const walletAddress = await walletFactoryContract['getAddress'](
    loginUsername,
    0
  );
  console.log('walletAddress', walletAddress);

  statusUpdateFn(`Selected Paymaster: ${paymaster}`);

  statusUpdateFn(`Wallet address: <pre>${walletAddress}</pre>`);

  const userOpBuilder = new UserOperationBuilder()
    .useDefaults({
      sender: walletAddress,
      signature:
        '0x0000000000000000000000000000000000000000000000000000000000000000450000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000032000000000000000000000000000000000000000000000000000000000000000276b09534b500ac0c94655a5b33c7e3a9eac259e59a4d9bc364fa065d3ec052f056f4e1dad27f0d51b7ba7d0851795c08b7faa5a5f173874e4e3ebd6b45646ebb1000000000000000000000000000000000000000000000000000000000000036000000000000000000000000000000000000000000000000000000000000000a449960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97634500000000b53976664885aa6bcebfe52262a439a20020b1e9400a0d0d9d222163b07a80c48f99af404a82572a6baf070ec660a8387f3da50102032620012158200925a64c9f41c52f20f5ba7b8201611c62b47d6b23a9027da9c5c9c444a142fb2258200767b285a7785d35532e4e6b3a3662741c3b5ad11b93ccaf3b2447afde80b5d40000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f67b2274797065223a22776562617574686e2e637265617465222c226368616c6c656e6765223a225f2d5f5461514375524f744b63544757533143795a43796a414436366143686f4b363664616b396c436d73222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a34323030222c2263726f73734f726967696e223a66616c73652c226f746865725f6b6579735f63616e5f62655f61646465645f68657265223a22646f206e6f7420636f6d7061726520636c69656e74446174614a534f4e20616761696e737420612074656d706c6174652e205365652068747470733a2f2f676f6f2e676c2f796162506578227d000000000000000000000000000000000000000000000000000000000000000000000000000000000020ffefd36900ae44eb4a7131964b50b2642ca3003eba6828682bae9d6a4f650a6b00000000000000000000000000000000000000000000000000000000000001c0020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000001000925a64c9f41c52f20f5ba7b8201611c62b47d6b23a9027da9c5c9c444a142fb0767b285a7785d35532e4e6b3a3662741c3b5ad11b93ccaf3b2447afde80b5d400000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000005657a656b690000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020b1e9400a0d0d9d222163b07a80c48f99af404a82572a6baf070ec660a8387f3d0000000000000000000000000000000000000000000000000000000000000041e7eb26d32f7e1573dbc2879a2525ac14c553a817c489adb777ba8feb9f6b703c5f33160f9d94b0f6b3b715cf1747f0f3599858e92bf223d47633b1c8c5ba6b471c00000000000000000000000000000000000000000000000000000000000000', // dummy signature
    })
    .useMiddleware(Presets.Middleware.getGasPrice(provider))
    .useMiddleware(resolveNonce(entrypointContract, walletAddress))
    .useMiddleware(
      resolveAccount(
        provider,
        walletFactoryContract,
        loginUsername,
        walletAddress
      )
    )

    .useMiddleware(
      paymaster === 'STACKUP'
        ? // >> Stackup Paymaster
          Presets.Middleware.verifyingPaymaster(
            'https://api.stackup.sh/v1/paymaster/54fe8665d13ebc11341af214d62141289d4348a1fdbf72041e9ca1e4f06bd16b',
            { type: 'payg' }
          )
        : // >> Aclhemy Paymaster
          resolveAlchemyGasAndPaymasterData(
            ENTRYPOINT_ADDRESS,
            'https://eth-sepolia.g.alchemy.com/v2/G877AttcsdLjN_XYyon926pWginvLx9L',
            '9cef39a1-c45e-46d0-bf50-b977875579d2',
            { preVerificationGas: { percentage: 120 } }
          )
    )

    // >> Custom Paymaster
    // .useMiddleware(
    //   resolveCustomPaymasterData(
    //     provider,
    //     CUSTOM_PAYMASTER_URL,
    //     ENTRYPOINT_ADDRESS
    //   )
    // )

    .useMiddleware(resolveWebAuthnSignature(LOGIN_URL, loginUsername))
    .setCallData(
      webauthnAccountAbi.encodeFunctionData('execute', [
        avatarPackContract.address,
        0,
        avatarPackContract.interface.encodeFunctionData('mint', []),
      ])
    );

  // Build and sign userOp
  const { chainId } = await provider.getNetwork();

  statusUpdateFn(`ChainId: <pre>${chainId}</pre>`);

  statusUpdateFn(`Building userOp...`);

  const signedUserOp = await userOpBuilder.buildOp(ENTRYPOINT_ADDRESS, chainId);

  statusUpdateFn(`userOp: <pre>${JSON.stringify(signedUserOp, null, 2)}</pre>`);

  // Send userOp
  const receipt = await sendUserOp(signedUserOp, statusUpdateFn);

  await receipt.wait();

  statusUpdateFn(`confirmed. querying events...`);

  console.log(receipt.hash);
  console.log('confirmed');
  console.log({ receipt });
  const events = await avatarPackContract.queryFilter(
    avatarPackContract.filters['Transfer'](
      ethers.constants.AddressZero,
      walletAddress
    ),
    receipt.blockNumber
  );
  console.log({ events });

  statusUpdateFn(
    `events: ${events.map(
      (x) => `<pre>${x.event} (from: ${x.args![0]} to: ${x.args![1]})</pre>`
    )}`
  );

  const tokenUri = await avatarPackContract['tokenURI'](
    events[0].args?.['tokenId']
  );

  return [events, receipt];
}

const sendUserOp = async (
  userOp: IUserOperation,
  statusUpdateFn: (status: string) => void
): Promise<ethers.providers.TransactionResponse> => {
  console.log('yo userOp', JSON.stringify(userOp));
  console.log('yo entrypoint', entrypointContract.address);
  const userOpHash = await provider.send('eth_sendUserOperation', [
    userOp,
    entrypointContract.address,
  ]);

  statusUpdateFn(
    `userOpHash: <pre>${userOpHash}</pre> waiting for the confirmatoin...`
  );

  return waitForUserOp(userOpHash, userOp, 50, statusUpdateFn);
};

const waitForUserOp = async (
  userOpHash: string,
  userOp: IUserOperation,
  maxRetries = 50,
  statusUpdateFn: (status: string) => void
): Promise<ethers.providers.TransactionResponse> => {
  if (maxRetries < 0) {
    throw new Error("Couldn't find the userOp broadcasted: " + userOpHash);
  }

  const lastBlock = await provider.getBlock('latest');
  const events = await entrypointContract.queryFilter(
    entrypointContract.filters['UserOperationEvent'](userOpHash),
    lastBlock.number - 100
  );

  statusUpdateFn('Checking...');

  if (events[0]) {
    const transaction = await events[0].getTransaction();
    return transaction;
  }

  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });
  return waitForUserOp(userOpHash, userOp, --maxRetries, statusUpdateFn);
};
