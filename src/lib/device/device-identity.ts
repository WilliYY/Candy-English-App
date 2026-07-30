import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const INSTALLATION_KEY = "candy-english.installation-id.v1";

type DevicePlatform = "ANDROID" | "IOS" | "WEB";

function getPlatform(): DevicePlatform {
  if (Platform.OS === "android") {
    return "ANDROID";
  }

  if (Platform.OS === "ios") {
    return "IOS";
  }

  return "WEB";
}

let webInstallationId: string | null = null;

async function getInstallationId() {
  const secureStoreAvailable = await SecureStore.isAvailableAsync();

  if (!secureStoreAvailable) {
    webInstallationId ??= Crypto.randomUUID();
    return webInstallationId;
  }

  const current = await SecureStore.getItemAsync(INSTALLATION_KEY);

  if (current) {
    return current;
  }

  const created = Crypto.randomUUID();
  await SecureStore.setItemAsync(INSTALLATION_KEY, created);
  return created;
}

export async function getDeviceIdentity() {
  return {
    appVersion: Constants.expoConfig?.version,
    installationId: await getInstallationId(),
    platform: getPlatform(),
  };
}
