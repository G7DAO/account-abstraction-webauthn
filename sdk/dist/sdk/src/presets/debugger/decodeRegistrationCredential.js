import { decodeClientDataJSON } from './decodeClientDataJSON';
import { decodeAttestationObject } from './decodeAttestationObject';
import { parseAuthData } from './parseAuthData';
import { parseAttestationStatement } from './parseAttestationStatement';
export function decodeRegistrationCredential(credential) {
    const { response } = credential;
    if (!response.clientDataJSON || !response.attestationObject) {
        throw new Error('The "clientDataJSON" and/or "attestationObject" properties are missing from "response"');
    }
    const clientDataJSON = decodeClientDataJSON(response.clientDataJSON);
    const attestationObject = decodeAttestationObject(response.attestationObject);
    const authData = parseAuthData(attestationObject.authData);
    const attStmt = parseAttestationStatement(attestationObject.attStmt);
    return {
        ...credential,
        response: {
            ...response,
            clientDataJSON,
            attestationObject: {
                ...attestationObject,
                attStmt,
                authData,
            },
        },
    };
}
//# sourceMappingURL=decodeRegistrationCredential.js.map