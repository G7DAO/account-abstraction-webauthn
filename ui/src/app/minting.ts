import {
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';
import base64url from 'base64url';
import { Contract, ethers } from 'ethers';
import { IUserOperation, Presets, UserOperationBuilder } from 'userop';
import entrypoint from '../abis/entrypoint.json';
import polaroid from '../abis/polaroid.json';
import simpleAccount from '../abis/simpleAccount.json';
import walletFactory from '../abis/webauthnWalletFactory.json';
import { environment } from '../environments/environment';
import { authResponseToSigVerificationInput } from './debugger/authResponseToSigVerificationInput';
import { decodeAuthenticationCredential } from './debugger/decodeAuthenticationCredential';
import { decodeRegistrationCredential } from './debugger/decodeRegistrationCredential';

export const simpleAccountAbi = new ethers.utils.Interface(simpleAccount.abi);

const provider = new ethers.providers.StaticJsonRpcProvider(environment.rpc);
const paymasterProvider = new ethers.providers.StaticJsonRpcProvider(
  environment.paymasterRpc
);

const walletFactoryContract = new Contract(
  environment.walletFactoryContract,
  walletFactory.abi,
  provider
);
export const entrypointContract = new Contract(
  environment.entrypointContract,
  entrypoint.abi,
  provider
);

export const nftPolaroidContract = new Contract(
  environment.nftContract,
  polaroid.abi,
  provider
);

export const bundler = new ethers.providers.StaticJsonRpcProvider(
  environment.bundlerRpc
);

export async function sendTransaction(
  login: string,
  blob: Blob | null | undefined
) {
  if (!login) throw Error('Login not set');
  if (!blob) throw new Error('no blob');

  console.log('waiting');
  const hash = await uploadToIPFS(blob);
  console.log('yo hash', hash);
  console.log('yo login', login);

  const walletAddress = await getAddress(login);
  console.log('yo walletAddress', walletAddress);
  const userOpBuilder = new UserOperationBuilder()
    .useDefaults({
      sender: walletAddress,
    })
    .useMiddleware(Presets.Middleware.getGasPrice(provider))
    .setCallData(
      simpleAccountAbi.encodeFunctionData('execute', [
        nftPolaroidContract.address,
        0,
        nftPolaroidContract.interface.encodeFunctionData('mint', [
          Buffer.from(hash),
        ]),
      ])
    )
    .setNonce(await entrypointContract['getNonce'](walletAddress, 0));

  const walletCode = await provider.getCode(walletAddress);
  console.log('yo walletCode', walletCode);
  const walletExists = walletCode !== '0x';
  console.log('yo walletExists', walletExists);
  console.log({ walletExists });

  if (!walletExists) {
    userOpBuilder.setInitCode(
      walletFactoryContract.address +
        walletFactoryContract.interface
          .encodeFunctionData('createAccount(string, uint256)', [login, 0])
          .slice(2)
    );
  }

  const { chainId } = await provider.getNetwork();
  const userOpToEstimateNoPaymaster = await userOpBuilder.buildOp(
    environment.entrypointContract,
    chainId
  );
  const paymasterAndData = await getPaymasterData(userOpToEstimateNoPaymaster);
  const userOpToEstimate = {
    ...userOpToEstimateNoPaymaster,
    paymasterAndData: paymasterAndData,
  };
  console.log({ userOpToEstimate });
  console.log('estimated userop', userOpToSolidity(userOpToEstimate));

  const [gasLimits, baseUserOp] = await Promise.all([
    getGasLimits(userOpToEstimate),
    userOpBuilder.buildOp(environment.entrypointContract, chainId),
  ]);
  console.log({
    gasLimits: Object.fromEntries(
      Object.entries(gasLimits).map(([key, value]) => [
        key,
        ethers.BigNumber.from(value).toString(),
      ])
    ),
  });
  const userOp: IUserOperation = {
    ...baseUserOp,
    callGasLimit: gasLimits.callGasLimit,
    preVerificationGas: gasLimits.preVerificationGas + 20000,
    verificationGasLimit: gasLimits.verificationGasLimit,
    paymasterAndData: paymasterAndData,
  };

  console.log({ userOp });
  // console.log('to sign', userOpToSolidity(userOp));
  const userOpHash = await entrypointContract['getUserOpHash'](userOp);
  console.log('TO SIGN', { userOpHash });
  const loginPasskeyId = localStorage.getItem(`${login}_passkeyId`);
  const signature = loginPasskeyId
    ? await signUserOp(userOpHash, loginPasskeyId)
    : await signUserOpWithCreate(userOpHash, login);

  if (!signature) throw new Error('Signature failed');
  const signedUserOp: IUserOperation = {
    ...userOp,
    // paymasterAndData: await getPaymasterData(userOp),
    signature,
  };
  console.log({ signedUserOp });
  console.log('signed', userOpToSolidity(signedUserOp));

  sendUserOp(signedUserOp)
    .then(async (receipt) => {
      await receipt.wait();
      console.log(receipt.hash);
      console.log('confirmed');
      console.log({ receipt });
      // const events = await nftPolaroidContract.queryFilter(
      //   nftPolaroidContract.filters.Transfer(
      //     ethers.constants.AddressZero,
      //     walletAddress
      //   ),
      //   receipt.blockNumber
      // );
      // console.log({ events });
      // await webcamRef.current?.reveal();
      // const tokenUri = await nftPolaroidContract.tokenURI(
      //   events[0].args?.tokenId
      // );
      // console.log(
      //   `https://demo.storj-ipfs.com/ipfs/${tokenUri.replace('ipfs://', '')}`,
      //   tokenUri
      // );
      // const { data: metadata } = await fetch(
      //   `https://demo.storj-ipfs.com/ipfs/${tokenUri.replace('ipfs://', '')}`
      // ).then((x) => x.json());
      // console.log(metadata);
      // chatBubbleRef.current?.show();
    })
    .catch((e: Error) => {
      console.log('error');
      console.error(e);
    });
}

const uploadToIPFS = async (blob: Blob | null): Promise<string> => {
  if (blob === null) throw new Error('no blob');

  const formDataImage = new FormData();
  formDataImage.append('file', blob);

  // const { data: cidImage } = await fetch(
  //   'https://demo.storj-ipfs.com/api/v0/add',
  //   {
  //     method: 'POST',
  //     body: formDataImage,
  //     headers: {
  //       'Content-Type': 'multipart/form-data',
  //     },
  //   }
  // ).then((x) => x.json());

  // const metadata = {
  //   description: 'A selfie taken during ETHGlobal NYC 2023',
  //   image: 'ipfs://' + cidImage.Hash,
  //   name: 'ETHGlobal NYC 2023',
  // };
  // const formDataMetadata = new FormData();
  // formDataMetadata.append(
  //   'file',
  //   new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  // );

  // const { data: cidMetadata } = await fetch(
  //   'https://demo.storj-ipfs.com/api/v0/add',
  //   {
  //     method: 'POST',
  //     body: formDataMetadata,
  //     headers: {
  //       'Content-Type': 'multipart/form-data',
  //     },
  //   }
  // ).then((x) => x.json());

  // return cidMetadata.Hash;

  return crypto.randomUUID();
};

const getAddress = async (login: string): Promise<string> => {
  return walletFactoryContract['getAddress'](login, 0);
};

export const userOpToSolidity = (userOp: IUserOperation): string =>
  `
sender: ${userOp.sender},
nonce: ${ethers.BigNumber.from(userOp.nonce).toHexString()},
initCode: hex"${userOp.initCode.toString().slice(2)}",
callData: hex"${userOp.callData.toString().slice(2)}",
callGasLimit: ${ethers.BigNumber.from(userOp.callGasLimit).toHexString()},
verificationGasLimit: ${ethers.BigNumber.from(
    userOp.verificationGasLimit
  ).toHexString()},
preVerificationGas: ${ethers.BigNumber.from(
    userOp.preVerificationGas
  ).toHexString()},
maxFeePerGas: ${ethers.BigNumber.from(userOp.maxFeePerGas).toHexString()},
maxPriorityFeePerGas: ${ethers.BigNumber.from(
    userOp.maxPriorityFeePerGas
  ).toHexString()},
paymasterAndData: hex"${userOp.paymasterAndData.toString().slice(2)}",
signature: hex"${userOp.signature.toString().slice(2)}"`;

export const getGasLimits = async (
  userOp: IUserOperation
): Promise<{
  callGasLimit: string;
  preVerificationGas: string;
  verificationGasLimit: string;
}> => {
  console.log('ESTIMATING', userOp);
  return bundler.send('eth_estimateUserOperationGas', [
    {
      ...userOp,
      verificationGasLimit: '0x989680', // 10e6,
    } as IUserOperation,
    environment.entrypointContract,
  ]);
};

export const getPaymasterData = async (
  userOp: IUserOperation
): Promise<any> => {
  // return paymasterProvider.send('alchemy_requestPaymasterAndData', [
  //   {
  //     policyId: '32fc1986-def9-4987-8c84-2543165a143a',
  //     entryPoint: environment.entrypointContract,
  //     userOperation: userOp,
  //   },
  // ]);

  // return paymasterProvider.send('pm_sponsorUserOperation', [
  //   userOp,
  //   environment.entrypointContract,
  //   { type: 'payg' },
  // ]);

  return paymasterProvider.send('pm_sponsorUserOperation', [userOp]);

  // return fetch(environment.paymasterUrl, {
  //   method: 'POST',
  //   body: JSON.stringify(userOp),
  //   headers: {
  //     'content-type': 'application/json',
  //   },
  // })
  //   .then((x) => x.json())
  //   .then((x) => x.paymasterData);
};

export const sendUserOp = async (
  userOp: IUserOperation
): Promise<ethers.providers.TransactionResponse> => {
  console.log('yo userOp', userOp);
  console.log('yo entrypoint', entrypointContract.address);
  const userOpHash = await bundler.send('eth_sendUserOperation', [
    userOp,
    entrypointContract.address,
  ]);
  return waitForUserOp(userOpHash, userOp);
};

export const waitForUserOp = async (
  userOpHash: string,
  userOp: IUserOperation,
  maxRetries = 50
): Promise<ethers.providers.TransactionResponse> => {
  if (maxRetries < 0) {
    throw new Error("Couldn't find the userOp broadcasted: " + userOpHash);
  }

  const lastBlock = await provider.getBlock('latest');
  const events = await entrypointContract.queryFilter(
    entrypointContract.filters['UserOperationEvent'](userOpHash),
    lastBlock.number - 100
  );

  if (events[0]) {
    const transaction = await events[0].getTransaction();
    return transaction;
  }

  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });
  return waitForUserOp(userOpHash, userOp, --maxRetries);
};

export const signUserOp = async (
  userOpHash: string,
  passkeyIdHex: string
): Promise<string> => {
  console.log({ userOpHash });

  const challenge = Buffer.from(userOpHash.slice(2), 'hex');
  console.log('base6url challenge', base64url.encode(challenge));

  const signatureResponse = await startAuthentication({
    challenge: base64url.encode(challenge),
    allowCredentials: [
      {
        id: base64url.encode(Buffer.from(passkeyIdHex.slice(2), 'hex')),
        type: 'public-key',
        transports: ['internal'],
      },
    ],
  });
  console.log('webauthn response', signatureResponse);

  const { response: decodedResponse } =
    decodeAuthenticationCredential(signatureResponse);
  console.log('decoded webauthn response', decodedResponse);

  const ecVerifyInputs = authResponseToSigVerificationInput(
    {},
    signatureResponse.response
  );
  console.log('verify inputs', ecVerifyInputs);

  const challengeOffsetRegex = new RegExp(
    `(.*)${Buffer.from(base64url.encode(challenge)).toString('hex')}`
  );
  const challengePrefix = challengeOffsetRegex.exec(
    base64url
      .toBuffer(signatureResponse.response.clientDataJSON)
      .toString('hex')
  )?.[1];
  console.log({ challengeOffsetRegex, challengePrefix });

  console.log('webauthn verify inputs', [
    SignatureTypes.WEBAUTHN_UNPACKED,
    decodedResponse.authenticatorData.flagsMask,
    `0x${base64url
      .toBuffer(signatureResponse.response.authenticatorData)
      .toString('hex')}`,
    `0x${base64url
      .toBuffer(signatureResponse.response.clientDataJSON)
      .toString('hex')}`,
    userOpHash,
    Buffer.from(challengePrefix || '', 'hex').length,
    ecVerifyInputs.signature[0],
    ecVerifyInputs.signature[1],
    Buffer.from(passkeyIdHex.slice(2), 'hex').toString('hex'),
  ]);

  return ethers.utils.defaultAbiCoder.encode(
    [
      'bytes1',
      'bytes1',
      'bytes',
      'bytes',
      'bytes',
      'uint256',
      'uint256',
      'uint256',
      'bytes',
    ],
    [
      SignatureTypes.WEBAUTHN_UNPACKED,
      decodedResponse.authenticatorData.flagsMask,
      base64url.toBuffer(signatureResponse.response.authenticatorData),
      base64url.toBuffer(signatureResponse.response.clientDataJSON),
      Buffer.from(userOpHash.slice(2), 'hex'),
      Buffer.from(challengePrefix || '', 'hex').length,
      ecVerifyInputs.signature[0],
      ecVerifyInputs.signature[1],
      Buffer.from(passkeyIdHex.slice(2), 'hex'),
    ]
  );
};

export const signUserOpWithCreate = async (
  userOpHash: string,
  login: string
): Promise<string> => {
  console.log({ userOpHash });

  const challenge = Buffer.from(userOpHash.slice(2), 'hex');
  const encodedChallenge = base64url.encode(challenge);
  console.log('base6url challenge', base64url.encode(challenge));

  const passkey = await startRegistration({
    rp: {
      name: 'WebAuthn.io (Dev)',
      id: 'localhost',
    },
    user: {
      id: base64url.encode(crypto.randomUUID()),
      name: `${login} ${new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      displayName: login,
    },
    challenge: base64url.encode(challenge),
    pubKeyCredParams: [
      {
        type: 'public-key',
        alg: -7,
      },
    ],
    timeout: 60000,
    authenticatorSelection: {
      // authenticatorAttachment: 'platform', // can prevent simulator from running the webauthn request
    },
    attestation: 'direct',
  });
  const credId = `0x${base64url.toBuffer(passkey.id).toString('hex')}`;
  localStorage.setItem(`${login}_passkeyId`, credId);
  console.log({ credId });
  console.log('webauthn response', passkey);
  const decodedPassKey = decodeRegistrationCredential(passkey);

  console.log('decoded webauthn response', decodedPassKey);

  const supportsDirectAttestation =
    !!decodedPassKey.response.attestationObject.attStmt.sig;
  console.log({ supportsDirectAttestation });

  const pubKeyCoordinates = [
    '0x' +
      base64url
        .toBuffer(
          decodedPassKey.response.attestationObject.authData
            .parsedCredentialPublicKey?.x || ''
        )
        .toString('hex'),
    '0x' +
      base64url
        .toBuffer(
          decodedPassKey.response.attestationObject.authData
            .parsedCredentialPublicKey?.y || ''
        )
        .toString('hex'),
  ];

  const { payload: loginServiceData } = await fetch(environment.loginUrl, {
    method: 'POST',
    body: JSON.stringify({
      login,
      credId,
      pubKeyCoordinates,
    }),
  }).then((x) => x.json());

  if (supportsDirectAttestation) {
    const ecVerifyInputs = authResponseToSigVerificationInput(
      decodedPassKey.response.attestationObject.authData
        .parsedCredentialPublicKey,
      {
        authenticatorData: decodedPassKey.response.authenticatorData!,
        clientDataJSON: passkey.response.clientDataJSON,
        signature: decodedPassKey.response.attestationObject.attStmt.sig!,
      }
    );
    console.log('verify inputs', ecVerifyInputs);

    const challengeOffsetRegex = new RegExp(
      `(.*)${Buffer.from(encodedChallenge).toString('hex')}`
    );
    const challengePrefix = challengeOffsetRegex.exec(
      base64url.toBuffer(passkey.response.clientDataJSON).toString('hex')
    )?.[1];
    console.log({ challengeOffsetRegex, challengePrefix });

    console.log('webauthn verify inputs', [
      SignatureTypes.WEBAUTHN_UNPACKED_WITH_LOGIN_SERVICE,
      decodedPassKey.response.attestationObject.authData.flagsMask,
      `0x${base64url
        .toBuffer(passkey.response.authenticatorData!)
        .toString('hex')}`,
      `0x${base64url
        .toBuffer(passkey.response.clientDataJSON)
        .toString('hex')}`,
      userOpHash,
      Buffer.from(challengePrefix || '', 'hex').length,
      ecVerifyInputs.signature[0],
      ecVerifyInputs.signature[1],
      loginServiceData,
    ]);

    return ethers.utils.defaultAbiCoder.encode(
      [
        'bytes1',
        'bytes1',
        'bytes',
        'bytes',
        'bytes',
        'uint256',
        'uint256',
        'uint256',
        'bytes',
      ],
      [
        SignatureTypes.WEBAUTHN_UNPACKED_WITH_LOGIN_SERVICE,
        decodedPassKey.response.attestationObject.authData.flagsMask,
        `0x${base64url
          .toBuffer(passkey.response.authenticatorData!)
          .toString('hex')}`,
        `0x${base64url
          .toBuffer(passkey.response.clientDataJSON)
          .toString('hex')}`,
        userOpHash,
        Buffer.from(challengePrefix || '', 'hex').length,
        ecVerifyInputs.signature[0],
        ecVerifyInputs.signature[1],
        loginServiceData,
      ]
    );
  }

  console.log(
    'login service inputs',
    ethers.utils.defaultAbiCoder.decode(
      ['bytes1', 'string', 'bytes', 'uint256[2]', 'bytes'],
      loginServiceData
    )
  );
  return loginServiceData.signature;
};

enum SignatureTypes {
  NONE,
  WEBAUTHN_UNPACKED,
  LOGIN_SERVICE,
  WEBAUTHN_UNPACKED_WITH_LOGIN_SERVICE,
}
