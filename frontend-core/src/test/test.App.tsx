import { useEffect } from "react";
import { createAuthClient } from "../index";

type User = {
	email: string;
	name: string;
	roles: ("admin" | "user" | "developer")[];
};
type LoginProps = { email: string; password: string };
type Register = { email: string; name: string; password: string };

const { useAuthRefresh, useAuthStore } = createAuthClient<
	User,
	LoginProps,
	Register
>(
	{
		baseUrl: "http://localhost:8000",
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

	useEffect(() => {
		console.log({ isLoggedIn, hasRefreshed });
	}, [isLoggedIn, hasRefreshed]);

	return <div> works</div>;
}
