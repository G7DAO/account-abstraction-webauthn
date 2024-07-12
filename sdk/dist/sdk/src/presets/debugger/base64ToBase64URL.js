export function base64ToBase64URL(input) {
    return input.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
export function base64URLToUint8Array(input) {
    console.log(new Uint8Array(atob(input.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, ''))
        .split('')
        .map((c) => c.charCodeAt(0))));
    return new Uint8Array(atob(input.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, ''))
        .split('')
        .map((c) => c.charCodeAt(0)));
}
//# sourceMappingURL=base64ToBase64URL.js.map