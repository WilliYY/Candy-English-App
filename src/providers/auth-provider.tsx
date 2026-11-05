import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getMobileApi, subscribeSessionInvalidated } from "@/lib/api/mobile-api";
import type { AuthUser } from "@/lib/auth/auth-session";
import { secureSessionStore } from "@/lib/auth/secure-session-store";

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
  const authGeneration = useRef(0);

  useEffect(() => {
    let active = true;
    const generation = authGeneration.current;
    const unsubscribe = subscribeSessionInvalidated(() => {
      authGeneration.current += 1;
      queryClient.clear();
      setUser(null);
      setStatus("anonymous");
    });
    const isCurrent = () => active && generation === authGeneration.current;

    async function restore() {
      try {
        const session = await secureSessionStore.get();

        if (!session) {
          if (isCurrent()) {
            setStatus("anonymous");
          }
          return;
        }

        const restoredUser = await getMobileApi().getMe();

        if (isCurrent()) {
          setUser(restoredUser);
          setStatus("authenticated");
        }
      } catch {
        // Network/maintenance failures do not revoke persisted credentials.
        if (isCurrent()) {
          queryClient.clear();
          setUser(null);
          setStatus("anonymous");
        }
      }
    }

    void restore();

    return () => {
      active = false;
      unsubscribe();
    };
  }, [queryClient]);

  const signIn = useCallback(async (email: string, password: string) => {
    const generation = ++authGeneration.current;
    const authenticatedUser = await getMobileApi().signIn(email, password);
    if (generation !== authGeneration.current) return;
    queryClient.clear();
    setUser(authenticatedUser);
    setStatus("authenticated");
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    const generation = authGeneration.current;
    const refreshedUser = await getMobileApi().getMe();
    if (generation === authGeneration.current) setUser(refreshedUser);
    return refreshedUser;
  }, []);

  const signOut = useCallback(async () => {
    const generation = ++authGeneration.current;
    queryClient.clear();
    setUser(null);
    setStatus("anonymous");
    try {
      await getMobileApi().signOut();
    } finally {
      if (generation === authGeneration.current) {
        queryClient.clear();
        setUser(null);
        setStatus("anonymous");
      }
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
