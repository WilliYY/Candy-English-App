import { getApiBaseUrl } from "@/config/env";
import { createMobileApiClient } from "@/lib/api/mobile-api-client";
import { secureSessionStore } from "@/lib/auth/secure-session-store";
import { getDeviceIdentity } from "@/lib/device/device-identity";
import { clearAvatarUploadTemps } from "@/lib/files/avatar-upload";
import { clearProtectedContractCache } from "@/lib/files/protected-contract-cache";
import { clearProtectedLearningAssetCache } from "@/lib/files/protected-learning-asset-cache";

let mobileApi: ReturnType<typeof createMobileApiClient> | null = null;
const sessionInvalidatedListeners = new Set<() => void>();

export function subscribeSessionInvalidated(listener: () => void) {
  sessionInvalidatedListeners.add(listener);
  return () => { sessionInvalidatedListeners.delete(listener); };
}

export function getMobileApi() {
  mobileApi ??= createMobileApiClient({
    baseUrl: getApiBaseUrl(),
    getDeviceIdentity,
    onSessionInvalidated: () => {
      sessionInvalidatedListeners.forEach((listener) => listener());
    },
    onSessionCleared: async () => {
      await Promise.allSettled([
        clearProtectedContractCache(),
        clearProtectedLearningAssetCache(),
        clearAvatarUploadTemps(),
      ]);
    },
    sessionStore: secureSessionStore,
  });

  return mobileApi;
}
