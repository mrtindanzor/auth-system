import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type UserContextValue<T extends Record<string, unknown>> = {
  user: T | null;
};

export function createUserContext<T extends Record<string, unknown>>() {
  const UserContext = createContext<UserContextValue<T> | null>(null);

  type UserProviderProps = {
    children: ReactNode;
    fallback?: ReactNode;
    getUser: () => T | null;
    subscribe: (listener: () => void) => () => void;
  };

  function UserProvider({
    children,
    fallback = null,
    getUser,
    subscribe,
  }: UserProviderProps) {
    const [user, setUser] = useState<T | null>(getUser);

    useEffect(() => {
      const unsubscribe = subscribe(() => {
        setUser(getUser());
      });
      return unsubscribe;
    }, [getUser, subscribe]);

    if (!user) return <>{fallback}</>;

    return (
      <UserContext.Provider value={{ user }}>
        {children}
      </UserContext.Provider>
    );
  }

  function useUser(): T {
    const ctx = useContext(UserContext);
    if (!ctx?.user) throw new Error("User not found — UserProvider missing or user is null");
    return ctx.user;
  }

  function useOptionalUser(): T | null {
    const ctx = useContext(UserContext);
    return ctx?.user ?? null;
  }

  return { UserProvider, useUser, useOptionalUser };
}
