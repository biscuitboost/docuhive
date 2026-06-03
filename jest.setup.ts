import '@testing-library/jest-dom'

// Polyfill TextDecoder/TextEncoder for Neon database driver (needed in jsdom)
if (typeof global.TextDecoder === 'undefined') {
  const { TextDecoder, TextEncoder } = require('util');
  (global as any).TextDecoder = TextDecoder;
  (global as any).TextEncoder = TextEncoder;
}
