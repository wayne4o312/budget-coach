const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

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
  // Work around occasional watchman change-event crashes (NativeWind + Metro).
  useWatchman: false,
};

module.exports = withNativeWind(config, {
  input: "./global.css",
  inlineRem: 16,
  // Workaround for SDK 55 Metro watcher crash:
  // Disable style Fast Refresh (NativeWind Tailwind watcher -> haste change event).
  // Styles still work; after changing className, do a normal Reload.
  forceWriteFileSystem: true,
});

