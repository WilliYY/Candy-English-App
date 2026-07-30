import {
  createSecureSessionStore,
  type AsyncKeyValueStore,
} from "@/lib/auth/secure-session-store";

function createStorage(initial: string | null = null) {
  let current = initial;
  const storage: AsyncKeyValueStore = {
    deleteItem: jest.fn(async () => {
      current = null;
    }),
    getItem: jest.fn(async () => current),
    setItem: jest.fn(async (_key, value) => {
      current = value;
    }),
  };

  return {
    get current() {
      return current;
    },
    storage,
  };
}

const session = {
  tokens: {
    accessExpiresAt: "2026-07-30T13:00:00.000Z",
    accessToken: "cea_secret-access-token",
    refreshExpiresAt: "2026-08-29T12:00:00.000Z",
    refreshToken: "cer_secret-refresh-token",
    tokenType: "Bearer" as const,
  },
  user: {
    email: "student@candy.example",
    id: "student-1",
    name: "Candy Student",
    role: "STUDENT" as const,
  },
};

describe("SecureSessionStore", () => {
  it("persists only the refresh credential, never the access token", async () => {
    const memory = createStorage();
    const store = createSecureSessionStore(memory.storage);

    await store.save(session);

    expect(memory.current).toContain("cer_secret-refresh-token");
    expect(memory.current).not.toContain("cea_secret-access-token");
  });

  it("restores a refreshable session without inventing an access token", async () => {
    const persisted = JSON.stringify({
      refreshExpiresAt: session.tokens.refreshExpiresAt,
      refreshToken: session.tokens.refreshToken,
      user: session.user,
    });
    const memory = createStorage(persisted);
    const store = createSecureSessionStore(memory.storage);

    const restored = await store.get();

    expect(restored?.tokens.accessToken).toBe("");
    expect(restored?.tokens.refreshToken).toBe("cer_secret-refresh-token");
    expect(restored?.user.role).toBe("STUDENT");
  });

  it("deletes corrupted persisted data", async () => {
    const memory = createStorage("{not-valid-json");
    const store = createSecureSessionStore(memory.storage);

    await expect(store.get()).resolves.toBeNull();
    expect(memory.current).toBeNull();
  });
});
