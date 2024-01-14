# Account Abstraction + WebAuthn

This is a research project to use [WebAuthn](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API) (FaceID/Fingerprint Authentication) with [Account Abstraction](https://eips.ethereum.org/EIPS/eip-4337) (ERC 4337)

![AA WebAuthn Flow](https://github.com/G7DAO/account-abstraction-webauthn/assets/1698274/dcbdb87b-1fbc-4d6d-8dda-ebe8d3431a8b)

## Goals

- Simplify user onboarding flow for blockchain projects
- Make blockchain accessible to millions of new users, with no friction

## Vision

Installing a chrome extension, or a mobile app to use a wallet is a big blocker for user onboarding. Instead, we should use modern standards like WebAuthn and Account Abstraction to onboard users by using their FaceID/Fingerprint, without installing any additional app or extension. Software engineers should have a SDK, which can be integrated into any website in a few lines of code and use this new way of user onboarding/authentication.

## Funding
[<img width="400" alt="Screenshot 2024-01-12 at 06 22 06" src="https://github.com/G7DAO/account-abstraction-webauthn/assets/1698274/e998965a-fa06-4d0a-b9eb-8e5640edff90">](https://vote.optimism.io/retropgf/3/application/0x2f2c20e60d1f327d708f2e46799a3582623ab0fac770bc1afb2b5e793f86bf83)

## Idea / How it works

1. User will generate a private key on their device by using a WebAuthn standard.
2. Smart Wallet (ERC-4337 Account) will be created for the user on-chain and the public key will be included as a signer.
3. Every time users will need to do a userOp on-chain, they will do the webauthn verification (FaceID/Fingerprint/etc.) and send the signature on-chian for verification. The signature will include the hash of this userOp.

For the example of the UX, please check the `Live Demo` of this project:
https://ethglobal.com/showcase/avatar-protocol-z6md2

## Important Facts

- WebAuthn is a web standard and it's already available in every major browser. I'd highlight Safari on iOS and Chrome on Android. Also on desktop browsers.
- To use WebAuthn you don't need an approval from authorities like Apple, Google, etc. Every web app can use it today.
- Users don't need to download or install anything, WebAuthn is already there, in the device.
- There is no way to export a private key from the device (generated by WebAuthn). All you can do is Unlock the private key by using your Fingerprint/FaceID and do the signature.
- You can only access a private key for your domain. Cross-domain access isn't allowed by the standard.
- It's possible to use the same private key across domains and devices. You will need [YubiKey](https://www.yubico.com/ge/product/yubikey-5-series/yubikey-5-nfc/) for it.

## References

There are few projects which were an inspiration for starting this project. If you plan to work on the codebase here, I'd highly recommend checking them:

- https://github.com/zkwebauthn/webauthn-halo2
- https://github.com/qd-qd/wallet-abstraction
- https://github.com/tdrerup/elliptic-curve-solidity ([Contract](https://etherscan.io/address/0xf471789937856d80e589f5996cf8b0511ddd9de4#readContract))

## Test Contracts

### Sepolia

| Description                                                                          | Address                                                                                                                       |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| WebAuthnAccountFactory                                                               | [0x1c831bF4656866662B04c8FED126d432a007BD08](https://sepolia.etherscan.io/address/0x1c831bF4656866662B04c8FED126d432a007BD08) |
| DummyWebAuthnAccountFactory (Creates account with zero validation, just for testing) | [0x97c14a5793928f224732a020aecf41e1c8d9fe2f](https://sepolia.etherscan.io/address/0x97c14a5793928f224732a020aecf41e1c8d9fe2f) |
| WebAuthn256r1 (Deployed once. WebAuthn verification logic, shared between Accounts)  | [0x13250cf16eec77781dcf240b067cac78f2b2adf8](https://sepolia.etherscan.io/address/0x13250cf16eec77781dcf240b067cac78f2b2adf8) |
| AvatarPack (Test ERC721 contract for minting items)                                  | [0x4b3b5d4abe57eb7a00bbe9cc3ee743509b04f4e9](https://sepolia.etherscan.io/address/0x4b3b5d4abe57eb7a00bbe9cc3ee743509b04f4e9) |
| Custom Paymaster                                                                     | [0xD1c5ea2610b894FA66333cb5F3b512ea037ba1F0](https://sepolia.etherscan.io/address/0xD1c5ea2610b894FA66333cb5F3b512ea037ba1F0) |
| Deployer                                                                             | [0xaE0bDc4eEAC5E950B67C6819B118761CaAF61946](https://sepolia.etherscan.io/address/0xaE0bDc4eEAC5E950B67C6819B118761CaAF61946) |
| Entrypoint                                                                           | [0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789](https://sepolia.etherscan.io/address/0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789) |
