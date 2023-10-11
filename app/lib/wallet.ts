import base64 from "@hexagon/base64";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
} from "@simplewebauthn/server";
import {
  ThirdwebSDK,
  Transaction,
  isContractDeployed,
} from "@thirdweb-dev/react";
import {
  LocalWallet,
  MetaMaskWallet,
  SmartWallet,
  WalletConnect,
} from "@thirdweb-dev/wallets";
import {
  ACCOUNT_ABI,
  THIRDWEB_API_KEY,
  chain,
  factoryAddress,
} from "./constants";

export function createSmartWallet(): SmartWallet {
  const smartWallet = new SmartWallet({
    chain: chain,
    factoryAddress: factoryAddress,
    gasless: true,
    clientId: THIRDWEB_API_KEY || "",
  });
  return smartWallet;
}

export async function getWalletAddressForUser(
  sdk: ThirdwebSDK,
  username: string
): Promise<string> {
  const factory = await sdk.getContract(factoryAddress);
  const smartWalletAddress: string = await factory.call("accountOfUsername", [
    username,
  ]);
  console.log("smartWalletAddress", username);
  return smartWalletAddress;
}

export async function registerAccount(
  challenge: string,
  statusCallback?: (status: string) => void
) {
  try {
    const accountName = window.prompt("Please enter a new account name", "");
    if (!accountName) {
      return;
    }

    const generatedRegistrationOptions = await generateRegistrationOptions({
      rpName: "demo",
      rpID: window.location.hostname,
      userID: crypto.randomUUID() || "Based Account",
      userName: accountName || "Based Account",
      attestationType: "direct",
      challenge: challenge,
      supportedAlgorithmIDs: [-7],
    });

    const startRegistrationResponse = await startRegistration(
      generatedRegistrationOptions
    );

    // const verificationResponse = await verifyRegistrationResponse({
    //   response: startRegistrationResponse,
    //   expectedOrigin: window.location.origin,
    //   expectedChallenge: generatedRegistrationOptions.challenge,
    //   supportedAlgorithmIDs: [-7],
    // });

    // startRegistrationResponse.
    console.log(startRegistrationResponse);

    const { signature, rawId } = await verifyChallenge("hello");
    const pwd = signature!;
    console.log("PWD challenge result", accountName, pwd);

    return await ensureSmartWalletExists(
      rawId!,
      accountName!,
      pwd,
      statusCallback
    );
  } catch (err: any) {
    console.log(err.message);

    return null;
  }
}

export async function metamaskLoginAccount(
  sdk: import("@metamask/sdk").MetaMaskSDK,
  statusCallback?: (status: string) => void
) {
  try {
    const accounts: any = await sdk?.connect();
    const accountId = accounts?.[0];
    if (!accountId) {
      return;
    }

    return await ensureSmartWalletExistsMM(
      accountId,
      accountId,
      accountId,
      statusCallback
    );
  } catch (err) {
    console.warn(`failed to connect..`, err);
  }
}

export async function loginAccount(statusCallback?: (status: string) => void) {
  const { signature, rawId } = await verifyChallenge("hello");
  const pwd = signature!;
  console.log("PWD login challenge result", pwd);

  return await ensureSmartWalletExists(rawId, rawId, pwd, statusCallback);
}

export async function mmLoginAccount(
  statusCallback?: (status: string) => void
) {
  try {
    return await ensureSmartWalletExistsMM("", "", "", statusCallback);
  } catch (err) {
    console.warn(`failed to connect..`, err);
  }
}

export async function walletConnect(statusCallback?: (status: string) => void) {
  try {
    return await ensureWalletConnect("", "", "", statusCallback);
  } catch (err) {
    console.warn(`failed to connect..`, err);
  }
}

export async function ensureSmartWalletExists(
  username: string,
  displayName: string,
  pwd: string,
  statusCallback?: (status: string) => void
): Promise<SmartWallet> {
  statusCallback?.("Checking username...");
  const sdk = new ThirdwebSDK(chain, {
    clientId: THIRDWEB_API_KEY || "",
  });
  const smartWalletAddress = await getWalletAddressForUser(sdk, username);
  console.log("smartWalletAddress", smartWalletAddress);

  const isDeployed = smartWalletAddress
    ? await isContractDeployed(smartWalletAddress, sdk.getProvider())
    : false;

  console.log("isDeployed", smartWalletAddress, isDeployed);
  const smartWallet = createSmartWallet();
  const personalWallet = new LocalWallet();

  if (isDeployed) {
    statusCallback?.("Username exists, accessing onchain data...");
    // CASE 2 - existing wallet - fetch metadata, decrypt, load local wallet, connect
    // download encrypted wallet from IPFS

    console.log("getting contract", smartWalletAddress);
    const contract = await sdk.getContract(smartWalletAddress);
    console.log("got contract", contract);
    const metadata = await contract.metadata.get();
    console.log({ metadata });
    console.log("Fetching wallet for", metadata.name);
    const encryptedWallet = metadata.encryptedWallet;
    if (!encryptedWallet) {
      throw new Error("No encrypted wallet found");
    }
    statusCallback?.("Decrypting personal wallet...");
    // wait before importing as it blocks the main thread rendering
    await new Promise((resolve) => setTimeout(resolve, 300));
    await personalWallet.import({
      encryptedJson: encryptedWallet,
      password: pwd,
    });

    statusCallback?.("Connecting...");
    await smartWallet.connect({
      personalWallet,
    });
  } else {
    console.log(1);
    statusCallback?.("New username, generating personal wallet...");
    // CASE 1 - fresh start - create local wallet, encrypt, connect, call register on account with username + metadata
    // generate local wallet
    await personalWallet.generate();

    console.log({ personalWallet }, await personalWallet.getAddress());

    // encrypt it
    const encryptedWallet = await personalWallet.export({
      strategy: "encryptedJson",
      password: pwd,
    });

    console.log(2);

    await smartWallet.connect({
      personalWallet,
    });

    console.log(3, {
      name: username,
      encryptedWallet,
    });
    // register account
    // upload encrypted wallet to IPFS
    statusCallback?.("Uploading encrypted wallet to IPFS...");
    const encryptedWalletUri = await sdk.storage.upload({
      name: username,
      encryptedWallet,
    });
    console.log(4, encryptedWalletUri);

    statusCallback?.(
      `Deploying & registering Smart Wallet (ERC-4337) onchain...`
    );
    const tx = await Transaction.fromContractInfo({
      contractAddress: await smartWallet.getAddress(),
      contractAbi: ACCOUNT_ABI,
      provider: sdk.getProvider(),
      signer: await personalWallet.getSigner(),
      method: "register",
      args: [username, encryptedWalletUri],
      storage: sdk.storage,
    });

    console.log("tx", tx);

    // this will deploy the smart wallet and register the username
    const res = await smartWallet.execute(tx);

    console.log(5, res);
  }

  return smartWallet;
}

export async function ensureSmartWalletExistsMM(
  username: string,
  displayName: string,
  pwd: string,
  statusCallback?: (status: string) => void
): Promise<MetaMaskWallet> {
  statusCallback?.("Checking walletconnect...");
  const personalWallet = new MetaMaskWallet({});
  username = await personalWallet.connect();

  return personalWallet;
}

export async function ensureWalletConnect(
  username: string,
  displayName: string,
  pwd: string,
  statusCallback?: (status: string) => void
): Promise<WalletConnect> {
  statusCallback?.("Checking username...");
  const sdk = new ThirdwebSDK(chain, {
    clientId: THIRDWEB_API_KEY || "",
  });

  const personalWallet = new WalletConnect({
    projectId: "f4fa01c026b2e37734bfe55651238d3e",
  });
  username = await personalWallet.connect();

  return personalWallet;
}

export async function verifyChallenge(challenge: string) {
  const authenticationOptions = await generateAuthenticationOptions({
    rpID: window.location.hostname,
    challenge: challenge,
    userVerification: "required",
  });

  console.log("authenticationOptions", challenge, authenticationOptions);

  const authenticationResponse = await startAuthentication(
    authenticationOptions
  );

  console.log("verifyChallenge", authenticationResponse);

  const signature = base64.toArrayBuffer(
    authenticationResponse.response.signature,
    true
  );

  return {
    signature: authenticationResponse.response.userHandle,
    rawId: authenticationResponse.rawId,
  };
}
