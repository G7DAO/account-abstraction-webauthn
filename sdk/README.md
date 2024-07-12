# 🍓 Ichigo SDK

Web3 Wallet SDK - Using AA (ERC-4337) and WebAuthn (PassKeys).

## Features:

- Fully customisable UI
- Integrated Paymaster support - Alchemy, Stackup, Custom.
- No Extensiosn, No new apps necessary - Works directly into browser
- Easy to use
- Secured by web standard WebAuthn - Trusted by companies like Apple & Google.

## Notes
Few important notes:
* Users are identified by `username` - unique string
* Each `username` has its own unique account address
* `Passkeys` are used for authentication.
* `username` is connected to the specific `Passkey`. The user who owns the `Passkey`, owns the account.

## Initialization

Using Alchemy paymaster and bundler:

```ts
import { IchigoSDK } from "ichigo-sdk";

const RPC_URL =
  "https://base-sepolia.g.alchemy.com/v2/JOMsB_RG7ymuGmGM1NqlFRXuwYJ1E1Yh";
const POLICY_ID = "ae7829c6-25de-4150-9cc8-274d53bf209a";

export const sdk = new IchigoSDK({
  rpc: RPC_URL,
  paymaster: {
    type: "ALCHEMY",
    policyId: POLICY_ID,
    rpc: RPC_URL,
  },
});
```

## Mint

Mint NFT (ERC721):

```ts
await sdk.mint({
  type: "ERC721",
  contractAddress: "0x10bb2Ee7761C2356F7D7e42311b0fDf8e5e4dCA1",

  username: "user_unique_username", // passkey will be attached to the username
});
```

Mint ERC20:

```ts
await sdk.mint({
  type: "ERC20",
  contractAddress: "0x72788aAd0e291cDC498dd814dE76c34ae2d46a39",

  username: "user_unique_username",
});
```

## Transfer

Transfer NFT (ERC721):

```ts
await sdk.transfer({
  type: "ERC721",
  contractAddress: "0x10bb2Ee7761C2356F7D7e42311b0fDf8e5e4dCA1",
  toAddress: "0x91D76D31080ca88339a4E506aFfB4dED4b192bCb",
  id: 117,

  username: "user_unique_username",
});
```

Transfer ERC20:

```ts
await sdk.transfer({
  type: "ERC20",
  contractAddress: "0x10bb2Ee7761C2356F7D7e42311b0fDf8e5e4dCA1",
  toAddress: "0x91D76D31080ca88339a4E506aFfB4dED4b192bCb",
  count: 7,

  username: "user_unique_username",
});
```


## Call (Custom)