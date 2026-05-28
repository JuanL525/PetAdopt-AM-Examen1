// scratch/test_sha256.js
const { sha256 } = require('js-sha256');
const crypto = require('crypto');

const sampleVerifier = '9958cb5a6938e2b866046e7f1234567890abcdef1234567890abcdef12345678';
const encoder = new TextEncoder();
const bytes = encoder.encode(sampleVerifier);

// Native Node.js crypto SHA-256
const nativeHash = crypto.createHash('sha256').update(bytes).digest();
const nativeHex = nativeHash.toString('hex');
const nativeBase64Url = nativeHash.toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=/g, '');

// Our js-sha256 ArrayBuffer approach
const jsArrayBuffer = sha256.arrayBuffer(bytes);
const jsBytes = new Uint8Array(jsArrayBuffer);
const jsHex = Array.from(jsBytes).map(b => b.toString(16).padStart(2, '0')).join('');
const jsBase64Url = Buffer.from(jsArrayBuffer).toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=/g, '');

console.log('--- SHA-256 Comparison ---');
console.log('Verifier:      ', sampleVerifier);
console.log('Native Hex:    ', nativeHex);
console.log('JS-SHA256 Hex: ', jsHex);
console.log('Native B64Url: ', nativeBase64Url);
console.log('JS B64Url:     ', jsBase64Url);
console.log('Matches?       ', nativeHex === jsHex ? '✅ YES!' : '❌ NO!');
