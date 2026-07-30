import * as SecureStore from "expo-secure-store";
import { z } from "zod";

import {
  authSessionSchema,
  authUserSchema,
  type AuthSession,
  type AuthSessionStore,
} from "@/lib/auth/auth-session";

const SESSION_KEY = "candy-english.auth-session.v1";

const persistedSessionSchema = z
  .object({
    refreshExpiresAt: z.string().datetime(),
    refreshToken: z.string().min(1),
    user: authUserSchema,
  })
  .strict();

export type AsyncKeyValueStore = {
  deleteItem: (key: string) => Promise<void>;
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

const webMemory = new Map<string, string>();

const secureStorage: AsyncKeyValueStore = {
  async deleteItem(key) {
    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.deleteItemAsync(key);
      return;
    }

    webMemory.delete(key);
  },
  async getItem(key) {
    if (await SecureStore.isAvailableAsync()) {
      return SecureStore.getItemAsync(key);
    }

    return webMemory.get(key) ?? null;
  },
  async setItem(key, value) {
    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.setItemAsync(key, value);
      return;
    }

    webMemory.set(key, value);
  },
};

export function createSecureSessionStore(
  storage: AsyncKeyValueStore = secureStorage,
): AuthSessionStore {
  let memorySession: AuthSession | null = null;
  let loaded = false;

  return {
    async clear() {
      memorySession = null;
      loaded = true;
      await storage.deleteItem(SESSION_KEY);
    },

    async get() {
      if (memorySession || loaded) {
        return memorySession;
      }

      loaded = true;

      try {
        const raw = await storage.getItem(SESSION_KEY);

        if (!raw) {
          return null;
        }

        const persisted = persistedSessionSchema.safeParse(JSON.parse(raw));

        if (!persisted.success) {
          await storage.deleteItem(SESSION_KEY);
          return null;
        }

        memorySession = {
          tokens: {
            accessExpiresAt: "1970-01-01T00:00:00.000Z",
            accessToken: "",
            refreshExpiresAt: persisted.data.refreshExpiresAt,
            refreshToken: persisted.data.refreshToken,
            tokenType: "Bearer",
          },
          user: persisted.data.user,
        };

        return memorySession;
      } catch {
        await storage.deleteItem(SESSION_KEY).catch(() => undefined);
        return null;
      }
    },

    async save(value) {
      const session = authSessionSchema.parse(value);
      memorySession = session;
      loaded = true;

      await storage.setItem(
        SESSION_KEY,
        JSON.stringify({
          refreshExpiresAt: session.tokens.refreshExpiresAt,
          refreshToken: session.tokens.refreshToken,
          user: session.user,
        }),
      );
    },
  };
}

export const secureSessionStore = createSecureSessionStore();
