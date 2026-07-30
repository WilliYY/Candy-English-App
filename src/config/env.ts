import { Platform } from "react-native";

function developmentBaseUrl() {
  return Platform.OS === "android"
    ? "http://10.0.2.2:3000"
    : "http://localhost:3000";
}

export function getApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  const candidate = configured || (__DEV__ ? developmentBaseUrl() : "");

  if (!candidate) {
    throw new Error(
      "Configure EXPO_PUBLIC_API_URL com o endereço HTTPS do Candy English.",
    );
  }

  let url: URL;

  try {
    url = new URL(candidate);
  } catch {
    throw new Error("EXPO_PUBLIC_API_URL precisa ser uma URL válida.");
  }

  if (!__DEV__ && url.protocol !== "https:") {
    throw new Error("EXPO_PUBLIC_API_URL precisa usar HTTPS em produção.");
  }

  return url.toString().replace(/\/+$/, "");
}
