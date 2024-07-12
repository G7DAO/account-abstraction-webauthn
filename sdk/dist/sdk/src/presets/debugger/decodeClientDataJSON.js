import base64url from 'base64url';
/**
 * Convert response.clientDataJSON to a dev-friendly format
 */
export function decodeClientDataJSON(base64urlString) {
    return JSON.parse(base64url.decode(base64urlString));
}
//# sourceMappingURL=decodeClientDataJSON.js.map