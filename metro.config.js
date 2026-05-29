const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Moti's package.json `exports` map doesn't expose its internal `./components`
// and `./core` submodules, so Metro's ES Module resolution fails to resolve
// them. Disable package.json:exports resolution to fall back to classic
// file-based resolution.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
