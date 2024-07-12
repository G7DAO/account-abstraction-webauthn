import { decodeClientDataJSON } from './decodeClientDataJSON';
import { parseAuthData } from './parseAuthData';
import { Buffer } from "buffer";
export function decodeAuthenticationCredential(credential) {
    const { response } = credential;
    if (!response.clientDataJSON || !response.authenticatorData || !response.signature) {
        throw new Error('The "clientDataJSON", "attestationObject", and/or "signature" properties are missing from "response"');
    }
    const clientDataJSON = decodeClientDataJSON(response.clientDataJSON);
    const authenticatorData = parseAuthData(Buffer.from(response.authenticatorData, 'base64'));
    return {
        ...credential,
        response: {
            ...credential.response,
            authenticatorData,
            clientDataJSON,
        },
    };
}
//# sourceMappingURL=decodeAuthenticationCredential.js.map