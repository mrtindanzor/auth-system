export type AuthGuardConfig = {
  protectedPaths: string[];
  authPaths: string[];
  isAuthenticated: () => boolean;
  isAuthenticatedServer?(): boolean;
  onUnauthenticated: (currentPath: string) => void;
  onAuthenticated: (currentPath?: string) => void;
};

export function createAuthGuard(config: AuthGuardConfig) {
  const isAuthencticated = (runtime: "client" | "server") =>
    runtime === "server" && config.isAuthenticatedServer
      ? config.isAuthenticatedServer
      : config.isAuthenticated;

  function assertAuthenticated(
    pathname: string,
    runtime?: "client" | "server",
  ) {
    const isProtected = config.protectedPaths.some((p) =>
      pathname.startsWith(p),
    );

    if (isProtected && isAuthencticated(runtime || "client")()) {
      config.onUnauthenticated(pathname);
    }
  }

  function assertNotAuthenticated(
    pathname: string,
    runtime?: "client" | "server",
  ) {
    const isAuthPage = config.authPaths.some((p) => pathname.startsWith(p));
    if (isAuthPage && isAuthencticated(runtime || "client")()) {
      config.onAuthenticated(pathname);
    }
  }

  function enforce(pathname: string, runtime?: "client" | "server") {
    assertNotAuthenticated(pathname, runtime);
    assertAuthenticated(pathname, runtime);
  }

  return { assertAuthenticated, assertNotAuthenticated, enforce };
}
