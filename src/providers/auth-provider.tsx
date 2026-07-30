import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getMobileApi } from "@/lib/api/mobile-api";
import type { AuthUser } from "@/lib/auth/auth-session";
import { secureSessionStore } from "@/lib/auth/secure-session-store";
import { clearAvatarUploadTemps } from "@/lib/files/avatar-upload";
import { clearProtectedContractCache } from "@/lib/files/protected-contract-cache";

type AuthStatus = "loading" | "anonymous" | "authenticated";

type AuthContextValue = {
  refreshUser: () => Promise<AuthUser>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  status: AuthStatus;
  user: AuthUser | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;

    async function restore() {
      try {
        const session = await secureSessionStore.get();

        if (!session) {
          if (active) {
            setStatus("anonymous");
          }
          return;
        }

        const restoredUser = await getMobileApi().getMe();

        if (active) {
          setUser(restoredUser);
          setStatus("authenticated");
        }
      } catch {
        await Promise.allSettled([
          secureSessionStore.clear(),
          clearAvatarUploadTemps(),
          clearProtectedContractCache(),
        ]);
        queryClient.clear();

        if (active) {
          setUser(null);
          setStatus("anonymous");
        }
      }
    }

    void restore();

    return () => {
      active = false;
    };
  }, [queryClient]);

  const signIn = useCallback(async (email: string, password: string) => {
    const authenticatedUser = await getMobileApi().signIn(email, password);
    setUser(authenticatedUser);
    setStatus("authenticated");
  }, []);

  const refreshUser = useCallback(async () => {
    const refreshedUser = await getMobileApi().getMe();
    setUser(refreshedUser);
    return refreshedUser;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await getMobileApi().signOut();
    } finally {
      queryClient.clear();
      setUser(null);
      setStatus("anonymous");
    }
  }, [queryClient]);

  const value = useMemo(
    () => ({ refreshUser, signIn, signOut, status, user }),
    [refreshUser, signIn, signOut, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth precisa estar dentro de AuthProvider.");
  }

  return value;
}
