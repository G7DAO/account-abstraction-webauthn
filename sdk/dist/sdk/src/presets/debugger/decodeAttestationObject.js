import { decode } from "cbor-x/decode";
import { Buffer } from "buffer";
/**
 * Convert response.attestationObject to a dev-friendly format
 */
export function decodeAttestationObject(base64urlString) {
    return decode(Buffer.from(base64urlString, "base64"));
}
var ATTESTATION_FORMATS;
(function (ATTESTATION_FORMATS) {
    ATTESTATION_FORMATS["FIDO_U2F"] = "fido-u2f";
    ATTESTATION_FORMATS["PACKED"] = "packed";
    ATTESTATION_FORMATS["ANDROID_SAFETYNET"] = "android-safetynet";
    ATTESTATION_FORMATS["ANDROID_KEY"] = "android-key";
    ATTESTATION_FORMATS["TPM"] = "tpm";
    ATTESTATION_FORMATS["NONE"] = "none";
})(ATTESTATION_FORMATS || (ATTESTATION_FORMATS = {}));
//# sourceMappingURL=decodeAttestationObject.js.map