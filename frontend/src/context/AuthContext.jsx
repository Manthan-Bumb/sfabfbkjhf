import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const AuthCtx = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("lm_token");
    if (!t) { setLoading(false); return; }
    api.get("/auth/me").then(r => setUser(r.data)).catch(() => {
      localStorage.removeItem("lm_token");
    }).finally(() => setLoading(false));
  }, []);

  const login = (token, u) => {
    localStorage.setItem("lm_token", token);
    setUser(u);
  };
  const logout = () => {
    localStorage.removeItem("lm_token");
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);
