export type AuthGuardConfig = {
	protectedPaths: string[];
	authPaths: string[];
	isAuthenticated: () => boolean;
	isAuthenticatedServer?(): Promise<boolean>;
	onUnauthenticated: (currentPath: string) => void;
	onAuthenticated: (currentPath?: string) => void;
};

export function createAuthGuard({
	onAuthenticated,
	onUnauthenticated,
	isAuthenticated,
	isAuthenticatedServer,
	protectedPaths,
	authPaths,
}: AuthGuardConfig) {
	const getIsAuthenticated = async (runtime: "client" | "server") => {
		const isAuthenticatedFn =
			runtime === "server" && isAuthenticatedServer
				? isAuthenticatedServer
				: isAuthenticated;

		return await isAuthenticatedFn();
	};

	async function assertAuthenticated(
		pathname: string,
		runtime?: "client" | "server",
	) {
		const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
		const authenticated = await getIsAuthenticated(runtime || "client");

		if (isProtected && !authenticated) {
			return onUnauthenticated(pathname);
		}
	}

	async function assertNotAuthenticated(
		pathname: string,
		runtime?: "client" | "server",
	) {
		const isAuthPage = authPaths.some((p) => pathname.startsWith(p));
		const authenticated = await getIsAuthenticated(runtime || "client");

		if (isAuthPage && authenticated) {
			return onAuthenticated(pathname);
		}
	}

	async function enforce(pathname: string, runtime?: "client" | "server") {
		await assertNotAuthenticated(pathname, runtime);
		await assertAuthenticated(pathname, runtime);
	}

	return { assertAuthenticated, assertNotAuthenticated, enforce };
}
