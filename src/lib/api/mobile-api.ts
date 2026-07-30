import { getApiBaseUrl } from "@/config/env";
import { createMobileApiClient } from "@/lib/api/mobile-api-client";
import { secureSessionStore } from "@/lib/auth/secure-session-store";
import { getDeviceIdentity } from "@/lib/device/device-identity";
import { clearProtectedContractCache } from "@/lib/files/protected-contract-cache";

let mobileApi: ReturnType<typeof createMobileApiClient> | null = null;

export function getMobileApi() {
  mobileApi ??= createMobileApiClient({
    baseUrl: getApiBaseUrl(),
    getDeviceIdentity,
    onSessionCleared: clearProtectedContractCache,
    sessionStore: secureSessionStore,
  });

  return mobileApi;
}
