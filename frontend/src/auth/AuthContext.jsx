import { createContext, useContext, useMemo, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("yoga_user") || "null");
    } catch {
      return null;
    }
  });

  const value = useMemo(() => {
    const hasRole = (...roles) => roles.some((r) => user?.roles?.includes(r));
    return {
      user,
      isAuthenticated: Boolean(user),
      hasRole,
      async login(email, password) {
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("yoga_token", data.data.token);
        localStorage.setItem("yoga_user", JSON.stringify(data.data.user));
        setUser(data.data.user);
        return data.data.user;
      },
      async register(payload) {
        const { data } = await api.post("/auth/register", payload);
        localStorage.setItem("yoga_token", data.data.token);
        localStorage.setItem("yoga_user", JSON.stringify(data.data.user));
        setUser(data.data.user);
        return data.data.user;
      },
      logout() {
        localStorage.removeItem("yoga_token");
        localStorage.removeItem("yoga_user");
        setUser(null);
      },
      homePath() {
        if (user?.roles?.includes("admin")) return "/admin";
        if (user?.roles?.includes("instructor")) return "/instructor/dashboard";
        return "/dashboard";
      },
    };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
