export type AuthGuardConfig = {
  protectedPaths: string[];
  authPaths: string[];
  isAuthenticated: () => boolean;
  onUnauthenticated: (currentPath: string) => void;
  onAuthenticated: (currentPath?: string) => void;
};

export function createAuthGuard(config: AuthGuardConfig) {
  function assertAuthenticated(pathname: string) {
    const isProtected = config.protectedPaths.some((p) =>
      pathname.startsWith(p),
    );
    if (isProtected && !config.isAuthenticated()) {
      config.onUnauthenticated(pathname);
    }
  }

  function assertNotAuthenticated(pathname: string) {
    const isAuthPage = config.authPaths.some((p) => pathname.startsWith(p));
    if (isAuthPage && config.isAuthenticated()) {
      config.onAuthenticated(pathname);
    }
  }

  function enforce(pathname: string) {
    assertNotAuthenticated(pathname);
    assertAuthenticated(pathname);
  }

  return { assertAuthenticated, assertNotAuthenticated, enforce };
}
