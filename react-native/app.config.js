export default {
  expo: {
    name: "Jade SDK Playground",
    slug: "jade-sdk-rn-playground",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    splash: {
      backgroundColor: "#1a1a1a"
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true
        }
      }
    },
    android: {
      usesCleartextTraffic: true
    },
    plugins: [
      "expo-asset",
      "expo-font"
    ],
    extra: {
      defaultAuthToken: process.env.JADE_AUTH_TOKEN || "",
    },
  },
};
