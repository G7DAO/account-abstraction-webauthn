import "https://deno.land/x/dotenv@v3.2.0/load.ts";
import { Buffer } from "npm:buffer";
import { ethers } from "npm:ethers@5.7.2";
import type { IUserOperation } from "npm:userop";

const loginSigner = new ethers.Wallet(Deno.env.get("LOGIN_SERVICE_PK"));

const paymasterSigner = new ethers.Wallet(Deno.env.get("PAYMASTER_PK"));
console.log({ ppk: Deno.env.get("PAYMASTER_PK") });

const PAYMASTER_CONTRACT = Deno.env.get("PAYMASTER_CONTRACT");
const provider = new ethers.providers.StaticJsonRpcProvider(
  Deno.env.get("RPC")
);

Deno.serve({ port: 8080 }, async (req: Request) => {
  const url = new URL(req.url);

  if (req.method === "OPTIONS") {
    return setCors(new Response());
  }

  if (url.pathname === "/login") {
    const { login, credId, pubKeyCoordinates } = await req.json();

    const message = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ["bytes1", "string", "bytes", "uint256[2]"],
        [SignatureTypes.LOGIN_SERVICE, login, credId, pubKeyCoordinates]
      )
    );
    const signature = await loginSigner.signMessage(
      Buffer.from(message.slice(2), "hex")
    );
    const payload = ethers.utils.defaultAbiCoder.encode(
      ["bytes1", "string", "bytes", "uint256[2]", "bytes"],
      [
        SignatureTypes.LOGIN_SERVICE,
        login,
        credId,
        pubKeyCoordinates,
        signature,
      ]
    );
    console.log({
      message,
      messageHashed: ethers.utils.hashMessage(message),
      signature,
      payload,
    });
    return setCors(Response.json({ payload }));
  }

  if (url.pathname === "/sponsorUserOperation") {
    const userOp: IUserOperation = await req.json();

    const latestBlock = await provider.getBlock("latest");
    const { chainId } = await provider.getNetwork();
    const verifiableUserOpPacked = ethers.utils.defaultAbiCoder.encode(
      ["address", "uint256", "bytes32", "bytes32", "uint256", "uint256"],
      [
        userOp.sender,
        userOp.nonce,
        ethers.utils.keccak256(
          Buffer.from(userOp.initCode.toString().slice(2), "hex")
        ),
        ethers.utils.keccak256(
          Buffer.from(userOp.callData.toString().slice(2), "hex")
        ),
        userOp.maxFeePerGas,
        userOp.maxPriorityFeePerGas,
      ]
    );

    console.log("-------------------------------------------");
    console.log("sender", userOp.sender);
    console.log("nonce", userOp.nonce);
    console.log(
      "hashInitCode",
      ethers.utils.keccak256(
        Buffer.from(userOp.initCode.toString().slice(2), "hex")
      )
    );
    console.log(
      "hashCallData",
      ethers.utils.keccak256(
        Buffer.from(userOp.callData.toString().slice(2), "hex")
      )
    );
    console.log(
      "maxFeePerGas",
      ethers.BigNumber.from(userOp.maxFeePerGas).toString()
    );
    console.log(
      "maxPriorityFeePerGas",
      ethers.BigNumber.from(userOp.maxPriorityFeePerGas).toString()
    );
    console.log("-------------------------------------------");

    console.log("verifiableUserOpPacked", verifiableUserOpPacked);
    const verifiableUserOpHash = ethers.utils.keccak256(verifiableUserOpPacked);
    console.log("verifiableUserOpHash", verifiableUserOpHash);
    const signature = await paymasterSigner.signMessage(
      Buffer.from(verifiableUserOpHash.slice(2), "hex")
    );
    const validFrom = latestBlock.timestamp;
    const validUntil = latestBlock.timestamp + 10 * 60;
    console.log(
      `valid from ${new Date(validFrom * 1000).toLocaleString(
        "fr-FR"
      )} until ${new Date(validUntil * 1000).toLocaleString("fr-FR")}`,
      { validFrom, validUntil }
    );

    return setCors(
      Response.json({
        paymasterData:
          PAYMASTER_CONTRACT +
          ethers.utils.defaultAbiCoder
            .encode(
              ["bytes", "uint48", "uint48", "uint256", "bytes"],
              [verifiableUserOpHash, validFrom, validUntil, chainId, signature]
            )
            .slice(2),
      })
    );
  }

  return setCors(new Response("OK"));
});

console.log(`HTTP server running. Access it at: http://localhost:8080/`);

enum SignatureTypes {
  NONE,
  WEBAUTHN_UNPACKED,
  LOGIN_SERVICE,
  WEBAUTHN_UNPACKED_WITH_LOGIN_SERVICE,
}

export function setCors(res: Response) {
  res.headers.append("Access-Control-Allow-Origin", "*");
  res.headers.append("Access-Control-Allow-Headers", "*");
  res.headers.append("Access-Control-Allow-Methods", "POST, GET, OPTIONS");

  return res;
}
