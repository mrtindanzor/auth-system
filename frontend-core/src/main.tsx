import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { createAuthClient } from "./index";

type User = { email: string; name: string };
type LoginProps = { email: string; password: string };
type Register = { email: string; name: string; password: string };

const {
  useAuth: _u,
  useAuthRefresh,
  useAuthStore,
} = createAuthClient<User, LoginProps, Register>(
  {
    baseUrl: "http://localhost:8000",
    endpoints: {
      login: "/auth/login",
      refresh: "/auth/refresh",
      register: "/auth/register",
      logout: "/auth/logout",
    },
  },
  {
    authPaths: [],
    protectedPaths: [],
    onAuthenticated(_currentPath) {},
    onUnauthenticated(_currentPath) {},
  },
);

function App() {
  useAuthRefresh();
  const hasRefreshed = useAuthStore((s) => s.hasRefreshed);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  useEffect(() => {
    console.log({ isLoggedIn, hasRefreshed });
  }, [isLoggedIn, hasRefreshed]);

  return <div> works</div>;
}

const app = document.getElementById("root");
if (!app) throw new Error("No root element");

createRoot(app).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
