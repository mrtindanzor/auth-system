export type AuthGuardConfig = {
  protectedPaths: string[];
  authPaths: string[];
  isAuthenticated: () => boolean;
  isAuthenticatedServer?(): Promise<boolean>;
  onUnauthenticated: (currentPath: string) => void;
  onAuthenticated: (currentPath?: string) => void;
};

export function createAuthGuard(config: AuthGuardConfig) {
  const isAuthencticated = (runtime: "client" | "server") =>
    runtime === "server" && config.isAuthenticatedServer
      ? config.isAuthenticatedServer
      : config.isAuthenticated;

  async function assertAuthenticated(
    pathname: string,
    runtime?: "client" | "server",
  ) {
    const isProtected = config.protectedPaths.some((p) =>
      pathname.startsWith(p),
    );

    if (isProtected && (await isAuthencticated(runtime || "client")())) {
      config.onUnauthenticated(pathname);
    }
  }

  async function assertNotAuthenticated(
    pathname: string,
    runtime?: "client" | "server",
  ) {
    const isAuthPage = config.authPaths.some((p) => pathname.startsWith(p));
    if (isAuthPage && (await isAuthencticated(runtime || "client")())) {
      config.onAuthenticated(pathname);
    }
  }

  async function enforce(pathname: string, runtime?: "client" | "server") {
    await assertNotAuthenticated(pathname, runtime);
    await assertAuthenticated(pathname, runtime);
  }

  return { assertAuthenticated, assertNotAuthenticated, enforce };
}
