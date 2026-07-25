// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const resolveFrom = require("resolve-from");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// react-native-webrtc depends on event-target-shim@6, but React Native itself
// requires event-target-shim@5. Without this override, the bundler resolves
// the wrong version for webrtc's internals and the app crashes on native calls.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName.startsWith("event-target-shim") &&
    context.originModulePath.includes("react-native-webrtc")
  ) {
    const eventTargetShimPath = resolveFrom(context.originModulePath, "event-target-shim/dist/event-target-shim.js");
    return {
      filePath: eventTargetShimPath,
      type: "sourceFile",
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
