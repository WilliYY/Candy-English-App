import { getApiBaseUrl } from "@/config/env";
import { createMobileApiClient } from "@/lib/api/mobile-api-client";
import { secureSessionStore } from "@/lib/auth/secure-session-store";
import { getDeviceIdentity } from "@/lib/device/device-identity";

let mobileApi: ReturnType<typeof createMobileApiClient> | null = null;

export function getMobileApi() {
  mobileApi ??= createMobileApiClient({
    baseUrl: getApiBaseUrl(),
    getDeviceIdentity,
    sessionStore: secureSessionStore,
  });

  return mobileApi;
}
