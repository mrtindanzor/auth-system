import { useEffect } from "react";
import { createAuthClient } from "../index";

type User = {
	email: string;
	name: string;
	roles: ("developer" | "admin" | "user" | "guest")[];
};
type LoginProps = { email: string; password: string };
type Register = { email: string; name: string; password: string };

const { useAuthRefresh, useAuthStore } = createAuthClient<
	User,
	LoginProps,
	Register
>(
	{
		baseUrl: "http://localhost:8000/fbci",
		endpoints: {
			login: {
				method: "post",
				url: "/auth/login",
			},
			refresh: {
				method: "get",
				url: "/auth/refresh",
			},
			register: {
				method: "post",
				url: "/auth/register",
			},
			logout: {
				method: "post",
				url: "/auth/logout",
			},
		},
	},
	{
		authPaths: [],
		protectedPaths: [],
		onAuthenticated(_currentPath) {},
		onUnauthenticated(_currentPath) {},
	},
);

export function App() {
	useAuthRefresh();
	const hasRefreshed = useAuthStore((s) => s.hasRefreshed);
	const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
	const roleChecker = useAuthStore((s) => s.roleChecker);
	const isDeveloper = roleChecker.add("developer").passes();
	const isAdmin = roleChecker.add("admin").passes();
	const roles = useAuthStore((s) => s.roles);
	console.log(roles);

	console.log({ isDeveloper, isAdmin });

	useEffect(() => {
		console.log({ isLoggedIn, hasRefreshed });
	}, [isLoggedIn, hasRefreshed]);

	return <div> works</div>;
}
