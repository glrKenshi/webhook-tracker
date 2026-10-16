"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { requestSignIn, requestSignOut, requestSignUp } from "@/lib/auth-api";
import {
  clearSession,
  getServerSessionSnapshot,
  getSessionSnapshot,
  subscribeSession,
  writeSession,
} from "@/lib/session";

type AuthStatus = "loading" | "anonymous" | "authenticated";

type AuthContextValue = {
  status: AuthStatus;
  email: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, passwordConfirmation: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { ready, session } = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    getServerSessionSnapshot,
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await requestSignIn(email, password);
    writeSession(result);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, passwordConfirmation: string) => {
      const result = await requestSignUp(email, password, passwordConfirmation);
      writeSession(result);
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      if (session) {
        await requestSignOut(session.token);
      }
    } finally {
      clearSession();
    }
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: !ready ? "loading" : session ? "authenticated" : "anonymous",
      email: session?.email ?? null,
      signIn,
      signUp,
      signOut,
    }),
    [ready, session, signIn, signOut, signUp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
