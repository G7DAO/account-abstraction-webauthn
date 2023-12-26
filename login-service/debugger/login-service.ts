import "https://deno.land/x/dotenv@v3.2.0/load.ts";
import { Buffer } from "npm:buffer";
import { ethers } from "npm:ethers@5.7.2";
import { ServiceBroker } from "npm:moleculer";
import HTTPServer from "npm:moleculer-web";

const pk = Deno.env.get("LOGIN_SERVICE_PK");

console.log({ pk });

const signer = new ethers.Wallet(Deno.env.get("LOGIN_SERVICE_PK"));
const broker = new ServiceBroker();

broker.createService({
  name: "gateway",
  mixins: [HTTPServer],

  settings: {
    port: Deno.env.get("LOGIN_SERVICE_PORT") ?? 4340,
    routes: [
      {
        aliases: {
          "POST /login": "login.test",
        },
        cors: {
          origin: "*",
        },
        bodyParsers: {
          json: true,
          urlencoded: { extended: true },
        },
      },
    ],
  },
});

enum SignatureTypes {
  NONE,
  WEBAUTHN_UNPACKED,
  LOGIN_SERVICE,
  WEBAUTHN_UNPACKED_WITH_LOGIN_SERVICE,
}

// Define a service
broker.createService({
  name: "login",
  actions: {
    async test(ctx) {
      const { login, credId, pubKeyCoordinates } = ctx.params;

      const message = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["bytes1", "string", "bytes", "uint256[2]"],
          [SignatureTypes.LOGIN_SERVICE, login, credId, pubKeyCoordinates]
        )
      );
      const signature = await signer.signMessage(
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
      return {
        payload,
        message,
        signature,
        slicedMessage: message.slice(2),
        buffer: Buffer.from(message.slice(2), "hex"),
        pk: Deno.env.get("LOGIN_SERVICE_PK"),
      };
    },
  },
});

broker.start();
