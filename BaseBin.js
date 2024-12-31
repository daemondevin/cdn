'use strict';

/**
 * Calculates the byte length of a Base64 encoded string.
 * @param {string} b64 - The Base64 encoded string.
 * @returns {number} - The byte length of the decoded string.
 * @throws {Error} - If the string length is not a multiple of 4.
 * @example
 * byteLength('SGVsbG8='); // 5
 */
export function byteLength(b64) {
    let len = b64.length;
    if (len % 4 > 0) {
        throw new Error('Invalid string. Length must be a multiple of 4');
    }
    let validLen = b64.indexOf('=') === -1 ? len : b64.indexOf('=');
    let placeHoldersLen = validLen === len ? 0 : 4 - (validLen % 4);
    return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen;
}

/**
 * Decodes a Base64 encoded string into a byte array.
 * @param {string} b64 - The Base64 encoded string.
 * @returns {Uint8Array} - The decoded byte array.
 * @example
 * toByteArray('SGVsbG8='); // Uint8Array [72, 101, 108, 108, 111]
 */
export function toByteArray(b64) {
    let tmp;
    let validLen = b64.indexOf('=') === -1 ? b64.length : b64.indexOf('=');
    let placeHoldersLen = validLen === b64.length ? 0 : 4 - (validLen % 4);
    let arr = new Uint8Array(((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen);
    let curByte = 0;

    for (let i = 0; i < validLen; i += 4) {
        tmp =
            (atob(b64[i]) << 18) |
            (atob(b64[i + 1]) << 12) |
            (atob(b64[i + 2]) << 6) |
            atob(b64[i + 3]);
        arr[curByte++] = (tmp >> 16) & 0xFF;
        arr[curByte++] = (tmp >> 8) & 0xFF;
        arr[curByte++] = tmp & 0xFF;
    }

    return arr;
}

/**
 * Encodes a byte array into a Base64 string.
 * @param {Uint8Array} uint8 - The byte array to encode.
 * @returns {string} - The Base64 encoded string.
 * @example
 * fromByteArray(new Uint8Array([72, 101, 108, 108, 111])); // 'SGVsbG8='
 */
export function fromByteArray(uint8) {
    let tmp;
    let len = uint8.length;
    let extraBytes = len % 3;
    let parts = [];
    let maxChunkLength = 16383;

    for (let i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
        parts.push(
            uint8.subarray(i, i + maxChunkLength).reduce((acc, byte) => acc + String.fromCharCode(byte), '')
        );
    }

    if (extraBytes === 1) {
        tmp = uint8[len - 1];
        parts.push(btoa(String.fromCharCode(tmp)) + '==');
    } else if (extraBytes === 2) {
        tmp = (uint8[len - 2] << 8) + uint8[len - 1];
        parts.push(btoa(String.fromCharCode(tmp >> 8, tmp & 0xFF)) + '=');
    }

    return parts.join('');
}

/**
 * Processes a string to safely encode/decode with Base64.
 * @param {string} s - The string to process.
 * @param {boolean} [encode=true] - Whether to encode or decode.
 * @returns {string} - The processed string.
 * @example
 * process('Hello', true); // 'SGVsbG8='
 * process('SGVsbG8=', false); // 'Hello'
 */
export function process(s, encode = true) {
    return encode 
        ? btoa(unescape(encodeURIComponent(s))) 
        : decodeURIComponent(escape(atob(s)));
}

/**
 * URL-safe Base64 encoding and decoding.
 * @namespace urlSafe
 */
export const urlSafe = {
    encode: (s) => process(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
    decode: (s) => process(s.replace(/-/g, '+').replace(/_/g, '/'), false)
};

/**
 * Validates if a string is a valid Base64 encoded string.
 * @param {string} s - The string to validate.
 * @returns {boolean}
 */
export function validate(s) {
    try {
        return /^[A-Za-z0-9+/]*={0,2}$/.test(s) && byteLength(s) >= 0;
    } catch {
        return false;
    }
}

/**
 * Encodes a string to Base32.
 */
export function encodeBase32(input) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let output = '';
    let buffer = 0;
    let bits = 0;
    for (let char of input) {
        buffer = (buffer << 8) | char.charCodeAt(0);
        bits += 8;
        while (bits >= 5) {
            output += alphabet[(buffer >> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    return output;
}

/**
 * Decodes a Base32 string.
 */
export function decodeBase32(input) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let buffer = 0;
    let bits = 0;
    let output = '';
    for (let char of input) {
        buffer = (buffer << 5) | alphabet.indexOf(char);
        bits += 5;
        if (bits >= 8) {
            output += String.fromCharCode((buffer >> (bits - 8)) & 255);
            bits -= 8;
        }
    }
    return output;
}

/** Base16 Encoding */
export function encodeBase16(input) {
    return Array.from(input).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
}

export function decodeBase16(input) {
    return input.match(/.{1,2}/g).map(byte => String.fromCharCode(parseInt(byte, 16))).join('');
}

/** Base58 Encoding/Decoding */
const base58Alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export function encodeBase58(input) {
    let num = BigInt('0x' + Buffer.from(input).toString('hex'));
    let output = '';
    while (num > 0) {
        output = base58Alphabet[num % 58n] + output;
        num /= 58n;
    }
    return output;
}

export function decodeBase58(input) {
    let num = BigInt(0);
    for (let char of input) {
        num = num * 58n + BigInt(base58Alphabet.indexOf(char));
    }
    return Buffer.from(num.toString(16), 'hex').toString();
}
