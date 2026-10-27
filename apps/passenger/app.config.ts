import type { ExpoConfig } from "expo/config";

const demoMode =
  process.env.EXPO_PUBLIC_ALMOSAFAR_DEMO_MODE !== "false" &&
  process.env.ALMOSAFAR_DEMO_MODE !== "false";

const config: ExpoConfig = {
  name: demoMode ? "Almosafar Taxi (Demo)" : "Almosafar Taxi",
  slug: "almosafar-taxi-passenger",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  scheme: "almosafar-passenger",
  plugins: ["expo-splash-screen"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.almosafar.taxi.passenger",
  },
  android: {
    package: "com.almosafar.taxi.passenger",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
  },
  extra: {
    almosafarDemoMode: demoMode,
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    eas: {
      projectId:
        process.env.EAS_PROJECT_ID_PASSENGER ??
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
        "REPLACE_WITH_EAS_PROJECT_ID_PASSENGER",
    },
  },
};

export default config;
