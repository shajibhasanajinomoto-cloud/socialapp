// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const resolveFrom = require("resolve-from");
const path = require("path");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// react-native-webrtc imports "event-target-shim/index", but that version of
// event-target-shim (v6+) restricts importable subpaths via its "exports"
// field, and "./index" isn't in that whitelist even though the file exists.
// Node throws ERR_PACKAGE_PATH_NOT_EXPORTED for any direct subpath resolution
// attempt (including via resolveFrom, which still enforces "exports").
// Workaround: resolve "package.json" instead (which IS whitelisted), then
// build the path to index.js manually so we bypass the "exports" check
// entirely rather than asking Node to resolve the blocked subpath.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName.startsWith("event-target-shim") &&
    context.originModulePath.includes("react-native-webrtc")
  ) {
    const packageJsonPath = resolveFrom(context.originModulePath, "event-target-shim/package.json");
    const packageDir = path.dirname(packageJsonPath);
    const eventTargetShimPath = path.join(packageDir, "index.js");
    return {
      filePath: eventTargetShimPath,
      type: "sourceFile",
    };
  }
  // Ensure you call the default resolver.
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
