// frontend/jest.setup.cjs
// react-router needs TextEncoder/TextDecoder, which jsdom does not provide.
const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;