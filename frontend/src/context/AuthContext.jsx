import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem("kalakosh_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await client.get("/auth/me");
      setUser(data);
    } catch {
      localStorage.removeItem("kalakosh_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = async (email, password) => {
    const { data } = await client.post("/auth/login", { email, password });
    localStorage.setItem("kalakosh_token", data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await client.post("/auth/register", { name, email, password });
    localStorage.setItem("kalakosh_token", data.access_token);
    setUser(data.user);
    return data.user;
  };

  const refreshUser = async () => {
    const token = localStorage.getItem("kalakosh_token");
    if (!token) return null;
    try {
      const { data } = await client.get("/auth/me");
      setUser(data);
      return data;
    } catch {
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem("kalakosh_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
