import { useCallback, useEffect } from "react";
import type { AuthStore } from "./store";
import type { IAuthService } from "./service";
import { tryCatch } from "../utils/tryCatch";

export function createUseAuthRefresh(
  useAuthStore: () => AuthStore,
  useAuthService: () => IAuthService,
) {
  return function useAuthRefresh() {
    const hasRefreshed = useAuthStore((s) => s.hasRefreshed);
    const setAccessToken = useAuthStore((s) => s.setAccessToken);
    const authService = useAuthService();

    useEffect(() => {
      if (hasRefreshed) return;

      const refresh = async () => {
        const [accessToken] = await tryCatch(authService.refresh());
        setAccessToken(accessToken);
      };

      refresh();
    }, [hasRefreshed, setAccessToken, authService]);
  };
}

export type UseAuthHandlers<TUser extends Record<string, unknown>> = {
  login: (payload: { credentials: string; password: string }) => Promise<void>;
  register: (payload: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  googleLogin?: (idToken: string) => Promise<void>;
};

export function createUseAuth<TUser extends Record<string, unknown>>(
  useAuthStore: () => AuthStore,
  useAuthService: () => IAuthService,
  onSetUser: (accessToken: string | null) => void,
): () => UseAuthHandlers<TUser> {
  return function useAuth() {
    const setAccessToken = useAuthStore((s) => s.setAccessToken);
    const authService = useAuthService();

    const login = useCallback(
      async (payload: { credentials: string; password: string }) => {
        const accessToken = await authService.login(payload);
        setAccessToken(accessToken);
        onSetUser(accessToken);
      },
      [authService, setAccessToken],
    );

    const register = useCallback(
      async (payload: Record<string, unknown>) => {
        const accessToken = await authService.register(payload);
        setAccessToken(accessToken);
        onSetUser(accessToken);
      },
      [authService, setAccessToken],
    );

    const logout = useCallback(async () => {
      await authService.logout();
      setAccessToken(null);
      onSetUser(null);
    }, [authService, setAccessToken]);

    return { login, register, logout };
  };
}
