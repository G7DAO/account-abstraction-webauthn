import base64url from 'base64url';
import { Buffer } from "buffer";
import { coseAlgToString } from './coseAlgToString';
import { x5cToStrings } from './x5cToStrings';
import { base64ToBase64URL } from './base64ToBase64URL';
/**
 * Break down attestation statement properties
 */
export function parseAttestationStatement(statement) {
    const toReturn = {};
    // Packed, TPM, AndroidKey
    if (statement.alg) {
        toReturn.alg = coseAlgToString(statement.alg);
    }
    // Packed, TPM, AndroidKey, FIDO-U2F
    if (statement.sig) {
        toReturn.sig = base64ToBase64URL(Buffer.from(statement.sig).toString('base64'));
    }
    // Packed, TPM, AndroidKey, FIDO-U2F
    if (statement.x5c) {
        toReturn.x5c = x5cToStrings(statement.x5c);
    }
    // Android SafetyNet
    if (statement.response) {
        const jwt = statement.response.toString('utf8');
        const jwtParts = jwt.split('.');
        const header = JSON.parse(base64url.decode(jwtParts[0]));
        const payload = JSON.parse(base64url.decode(jwtParts[1]));
        const signature = jwtParts[2];
        const certBuffers = header.x5c.map((cert) => Buffer.from(cert, 'base64'));
        const headerX5C = x5cToStrings(certBuffers);
        toReturn.response = {
            header: {
                ...header,
                x5c: headerX5C,
            },
            payload,
            signature,
        };
    }
    // TPM, Android SafetyNet
    if (statement.ver) {
        toReturn.ver = statement.ver;
    }
    // TPM
    if (statement.certInfo) {
        // TODO: Parse this TPM data structure
        toReturn.certInfo = base64ToBase64URL(Buffer.from(statement.certInfo).toString('base64'));
    }
    // TPM
    if (statement.pubArea) {
        // TODO: Parse this TPM data structure
        toReturn.pubArea = base64ToBase64URL(Buffer.from(statement.pubArea).toString('base64'));
    }
    return toReturn;
}
//# sourceMappingURL=parseAttestationStatement.js.map