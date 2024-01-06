import {
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';
import base64url from 'base64url';
import { ethers } from 'ethers';
import { UserOperationMiddlewareFn } from 'userop';
import { authResponseToSigVerificationInput } from './debugger/authResponseToSigVerificationInput';
import { decodeAuthenticationCredential } from './debugger/decodeAuthenticationCredential';
import { decodeRegistrationCredential } from './debugger/decodeRegistrationCredential';

export const resolveWebAuthnSignature =
  (loginUrl: string, loginUsername: string): UserOperationMiddlewareFn =>
  async (ctx) => {
    // const userOpHash = await entrypointContract['getUserOpHash'](ctx.op);
    const userOpHash = ctx.getUserOpHash();
    console.log('signing userOpHash', userOpHash);

    const loginPasskeyId = localStorage.getItem(`${loginUsername}_passkeyId`);
    const signature = loginPasskeyId
      ? await signUserOp(userOpHash, loginPasskeyId)
      : await signUserOpWithCreate(userOpHash, loginUsername, loginUrl);

    if (!signature) throw new Error('Signature failed');

    ctx.op.signature = signature;
  };

const signUserOp = async (
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

const signUserOpWithCreate = async (
  userOpHash: string,
  login: string,
  loginUrl: string
): Promise<string> => {
  console.log({ userOpHash });

  const challenge = Buffer.from(userOpHash.slice(2), 'hex');
  const encodedChallenge = base64url.encode(challenge);
  console.log('base6url challenge', base64url.encode(challenge));

  const passkey = await startRegistration({
    rp: {
      name: 'WebAuthn.io (Dev)',
      id: location.hostname,
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

  const { payload: loginServiceData } = await fetch(loginUrl, {
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
        authenticatorData: decodedPassKey.response['authenticatorData']!,
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
