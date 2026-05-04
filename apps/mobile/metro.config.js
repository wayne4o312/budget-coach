const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Enable importing `.svg` files as React components (Expo transformer).
const { transformer, resolver } = config;
config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
};
config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== "svg").concat(["wasm"]),
  sourceExts: [...resolver.sourceExts, "svg"],
  useWatchman: false,
};

module.exports = config;
