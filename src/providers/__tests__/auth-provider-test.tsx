import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Text, Pressable } from "react-native";

import { getMobileApi } from "@/lib/api/mobile-api";
import type { AuthSession } from "@/lib/auth/auth-session";
import { secureSessionStore } from "@/lib/auth/secure-session-store";
import { clearProtectedContractCache } from "@/lib/files/protected-contract-cache";
import { clearAvatarUploadTemps } from "@/lib/files/avatar-upload";
import { clearProtectedLearningAssetCache } from "@/lib/files/protected-learning-asset-cache";
import { AuthProvider, useAuth } from "@/providers/auth-provider";

jest.mock("@/config/env", () => ({ getApiBaseUrl: () => "https://candy.example" }));
jest.mock("@/lib/device/device-identity", () => ({ getDeviceIdentity: async () => ({ installationId: "device-test", platform: "ANDROID" }) }));
jest.mock("@/lib/files/avatar-upload", () => ({ clearAvatarUploadTemps: jest.fn(async () => undefined) }));
jest.mock("@/lib/files/protected-contract-cache", () => ({ clearProtectedContractCache: jest.fn(async () => undefined) }));
jest.mock("@/lib/files/protected-learning-asset-cache", () => ({ clearProtectedLearningAssetCache: jest.fn(async () => undefined) }));
jest.mock("@/lib/auth/secure-session-store", () => {
  let session: AuthSession | null = null;
  return { secureSessionStore: {
    get: jest.fn(async () => session),
    save: jest.fn(async (next: AuthSession) => { session = next; }),
    clear: jest.fn(async () => { session = null; }),
  } };
});

const session: AuthSession = {
  tokens: { accessToken: "old-access", refreshToken: "old-refresh", tokenType: "Bearer",
    accessExpiresAt: "2026-11-01T12:00:00.000Z", refreshExpiresAt: "2026-11-30T12:00:00.000Z" },
  user: { id: "old-user", email: "old@candy.example", name: "Old", role: "ADMIN" },
};
const nextSession = { ...session, tokens: { ...session.tokens, accessToken: "new-access", refreshToken: "new-refresh" },
  user: { ...session.user, id: "new-user", name: "New" } };

function response(status: number, body: unknown) {
  return { status, ok: status < 300, headers: new Headers(), json: async () => body } as Response;
}
function Probe() {
  const auth = useAuth();
  return <><Text>{auth.status}:{auth.user?.id ?? "none"}</Text>
    <Pressable onPress={() => void auth.signIn("new@candy.example", "password")}><Text>Login</Text></Pressable></>;
}
async function setup() {
  await secureSessionStore.save(session);
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const fetcher = jest.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => response(200, { ok: true, user: session.user }));
  globalThis.fetch = fetcher;
  const view = await render(<QueryClientProvider client={cache}><AuthProvider><Probe /></AuthProvider></QueryClientProvider>);
  await view.findByText("authenticated:old-user");
  cache.setQueryData(["private-data"], "private");
  return { view, cache, fetcher };
}

describe("AuthProvider session invalidation", () => {
  afterEach(() => jest.clearAllMocks());

  it.each([false, true])("returns to login and clears private cache/files after rejection (refresh succeeds=%s)", async (refreshSucceeds) => {
    const { view, cache, fetcher } = await setup();
    fetcher.mockImplementation(async (...args) => {
      const url = String(args[0]);
      return url.endsWith("/auth/refresh") && refreshSucceeds
        ? response(200, { ok: true, ...session })
        : response(401, { ok: false, error: { code: "SESSION_INVALID", message: "Revoked" } });
    });
    await act(async () => { await expect(getMobileApi().getMe()).rejects.toBeTruthy(); });
    await view.findByText("anonymous:none");
    expect(cache.getQueryData(["private-data"])).toBeUndefined();
    expect(await secureSessionStore.get()).toBeNull();
    expect(clearProtectedContractCache).toHaveBeenCalled();
    expect(clearAvatarUploadTemps).toHaveBeenCalled();
    expect(clearProtectedLearningAssetCache).toHaveBeenCalled();
  });

  it.each([false, true])("ignores an old refresh after a new login (refresh succeeds=%s)", async (refreshSucceeds) => {
    const { view, cache, fetcher } = await setup();
    let refuse!: (value: Response) => void;
    const pendingRefresh = new Promise<Response>((resolve) => { refuse = resolve; });
    fetcher.mockImplementation(async (...args) => {
      const url = String(args[0]);
      if (url.endsWith("/auth/login")) return response(200, { ok: true, ...nextSession });
      if (url.endsWith("/auth/refresh")) return pendingRefresh;
      return response(401, { ok: false, error: { code: "SESSION_INVALID", message: "Revoked" } });
    });
    const oldRequest = getMobileApi().getMe().catch(() => undefined);
    await waitFor(() => expect(fetcher.mock.calls.some((args) => String(args[0]).endsWith("/auth/refresh"))).toBe(true));
    await fireEvent.press(view.getByText("Login"));
    await view.findByText("authenticated:new-user");
    cache.setQueryData(["new-private-data"], "new-private");
    await act(async () => { refuse(refreshSucceeds ? response(200, { ok: true, ...session }) : response(401, {})); await oldRequest; });
    expect(view.getByText("authenticated:new-user")).toBeTruthy();
    expect((await secureSessionStore.get())?.user.id).toBe("new-user");
    expect(cache.getQueryData(["new-private-data"])).toBe("new-private");
  });

  it("preserves authentication on a maintenance response during refresh", async () => {
    const { view, cache, fetcher } = await setup();
    fetcher.mockImplementation(async (...args) => String(args[0]).endsWith("/auth/refresh")
      ? response(503, { ok: false, error: { code: "MANUTENCAO", message: "Em manutencao" } })
      : response(401, { ok: false, error: { code: "SESSION_INVALID", message: "Expired" } }));
    await act(async () => { await expect(getMobileApi().getMe()).rejects.toMatchObject({ status: 503, code: "MANUTENCAO" }); });
    expect(view.getByText("authenticated:old-user")).toBeTruthy();
    expect((await secureSessionStore.get())?.user.id).toBe("old-user");
    expect(cache.getQueryData(["private-data"])).toBe("private");
    expect(clearProtectedContractCache).not.toHaveBeenCalled();
  });

  it("keeps the session on a transient refresh network failure", async () => {
    const { view, cache, fetcher } = await setup();
    fetcher.mockImplementation(async (...args) => {
      if (String(args[0]).endsWith("/auth/refresh")) throw new Error("offline");
      return response(401, { ok: false, error: { code: "SESSION_INVALID", message: "Expired" } });
    });
    await act(async () => { await expect(getMobileApi().getMe()).rejects.toMatchObject({ code: "NETWORK_ERROR" }); });
    expect(view.getByText("authenticated:old-user")).toBeTruthy();
    expect((await secureSessionStore.get())?.user.id).toBe("old-user");
    expect(cache.getQueryData(["private-data"])).toBe("private");
  });

  it("waits for invalidated-session files to be cleared before completing a new login", async () => {
    const { view, fetcher } = await setup();
    let finishCleanup!: () => void;
    jest.mocked(clearProtectedContractCache).mockImplementationOnce(() => new Promise<void>((resolve) => { finishCleanup = resolve; }));
    fetcher.mockImplementation(async (...args) => String(args[0]).endsWith("/auth/login")
      ? response(200, { ok: true, ...nextSession })
      : response(401, { ok: false, error: { code: "SESSION_INVALID", message: "Revoked" } }));
    let oldRequest!: Promise<unknown>;
    await act(async () => { oldRequest = getMobileApi().getMe().catch(() => undefined); });
    await view.findByText("anonymous:none");
    await waitFor(() => expect(clearProtectedContractCache).toHaveBeenCalled());
    await fireEvent.press(view.getByText("Login"));
    expect(view.getByText("anonymous:none")).toBeTruthy();
    expect(fetcher.mock.calls.some((args) => String(args[0]).endsWith("/auth/login"))).toBe(false);
    await act(async () => { finishCleanup(); await oldRequest; });
    await view.findByText("authenticated:new-user");
    expect((await secureSessionStore.get())?.user.id).toBe("new-user");
  });
});
