const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const parentPackage = path.resolve(projectRoot, '..');
const monorepoRoot = path.resolve(projectRoot, '../../..');
const jadeSdkClient = path.resolve(monorepoRoot, 'jade-sdk/ts-client');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [parentPackage, jadeSdkClient];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(parentPackage, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

config.resolver.extraNodeModules = {
  '@gr33n-ai/jade-sdk-rn-client': parentPackage,
  '@gr33n-ai/jade-sdk-client': jadeSdkClient,
  'react': path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
};

config.resolver.blockList = [
  /.*\/apps\/sdk\/node_modules\/react-native\/.*/,
  /.*\/apps\/sdk\/node_modules\/react\/.*/,
];

module.exports = config;
