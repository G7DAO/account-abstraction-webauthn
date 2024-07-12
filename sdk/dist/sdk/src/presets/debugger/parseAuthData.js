import { decode } from 'cbor-x/decode';
import { Buffer } from "buffer";
import { aaguidToString } from './aaguidToString';
import { base64ToBase64URL } from './base64ToBase64URL';
import { coseAlgToString } from './coseAlgToString';
import { coseKeyTypeToString } from './coseKeyTypeToString';
var COSEKEYS;
(function (COSEKEYS) {
    COSEKEYS[COSEKEYS["kty"] = 1] = "kty";
    COSEKEYS[COSEKEYS["alg"] = 3] = "alg";
    COSEKEYS[COSEKEYS["crv"] = -1] = "crv";
    COSEKEYS[COSEKEYS["x"] = -2] = "x";
    COSEKEYS[COSEKEYS["y"] = -3] = "y";
    // RSA
    COSEKEYS[COSEKEYS["mod"] = -1] = "mod";
    COSEKEYS[COSEKEYS["exp"] = -2] = "exp";
})(COSEKEYS || (COSEKEYS = {}));
export function parseAuthData(authData) {
    let buffer = Buffer.from(authData);
    const rpIdHash = buffer.slice(0, 32);
    buffer = buffer.slice(32);
    const flagsBuf = buffer.slice(0, 1);
    buffer = buffer.slice(1);
    const flagsInt = flagsBuf[0];
    const flags = {
        userPresent: !!(flagsInt & (1 << 0)), // User Presence
        userVerified: !!(flagsInt & (1 << 2)), // User Verified
        backupEligible: !!(flagsInt & (1 << 3)), // Backup Eligibility
        backupStatus: !!(flagsInt & (1 << 4)), // Backup State
        attestedData: !!(flagsInt & (1 << 6)), // Attested Credential Data Present
        extensionData: !!(flagsInt & (1 << 7)), // Extension Data Present
    };
    const counterBuf = buffer.slice(0, 4);
    buffer = buffer.slice(4);
    const counter = counterBuf.readUInt32BE(0);
    let aaguid = undefined;
    let credentialID = undefined;
    let credentialPublicKey = undefined;
    let parsedCredentialPublicKey = undefined;
    if (flags.attestedData) {
        aaguid = buffer.slice(0, 16);
        buffer = buffer.slice(16);
        const credIDLenBuf = buffer.slice(0, 2);
        buffer = buffer.slice(2);
        const credIDLen = credIDLenBuf.readUInt16BE(0);
        const credentialIDBuffer = buffer.slice(0, credIDLen);
        buffer = buffer.slice(credIDLen);
        // Base64 to Base64URL
        credentialID = base64ToBase64URL(credentialIDBuffer.toString('base64'));
        credentialPublicKey = base64ToBase64URL(buffer.toString('base64'));
        const pubKey = decode(buffer);
        console.log({ pubKey });
        // TODO: Handle this differently if this is an RSA key
        parsedCredentialPublicKey = {
            keyType: pubKey?.[1],
        };
        if (pubKey) {
            const kty = pubKey[COSEKEYS.kty];
            parsedCredentialPublicKey.keyType = coseKeyTypeToString(kty);
            parsedCredentialPublicKey.algorithm = coseAlgToString(pubKey[COSEKEYS.alg]);
            if (kty === 3) {
                // RSA
                parsedCredentialPublicKey.modulus = base64ToBase64URL(Buffer.from(pubKey[COSEKEYS.mod]).toString('base64'));
                parsedCredentialPublicKey.exponent = parseInt(Buffer.from(pubKey[COSEKEYS.exp]).toString('hex'), 16);
            }
            else {
                // Everything else, including EC2 and OKP
                parsedCredentialPublicKey.curve = pubKey[COSEKEYS.crv];
                parsedCredentialPublicKey.x = base64ToBase64URL(Buffer.from(pubKey[COSEKEYS.x]).toString('base64'));
                // y isn't present in OKP certs
                if (pubKey[COSEKEYS.y]) {
                    parsedCredentialPublicKey.y = base64ToBase64URL(Buffer.from(pubKey[COSEKEYS.y]).toString('base64'));
                }
            }
        }
    }
    const toReturn = {
        rpIdHash: base64ToBase64URL(rpIdHash.toString('base64')),
        flags,
        flagsMask: `0x${Buffer.alloc(1).fill(flagsBuf).toString('hex')}`,
        counter,
    };
    if (aaguid) {
        toReturn.aaguid = aaguidToString(aaguid);
    }
    if (credentialID) {
        toReturn.credentialID = credentialID;
    }
    if (credentialPublicKey) {
        toReturn.credentialPublicKey = credentialPublicKey;
        toReturn.parsedCredentialPublicKey = parsedCredentialPublicKey;
    }
    return toReturn;
}
//# sourceMappingURL=parseAuthData.js.map