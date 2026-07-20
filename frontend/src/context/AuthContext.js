import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("accessToken");
      if (storedUser && token) setUser(JSON.parse(storedUser));
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password) => {
    const res = await api.post("/auth/signup", { name, email, password });
    await persistSession(res.data);
  };

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    await persistSession(res.data);
  };

  const persistSession = async (data) => {
    await AsyncStorage.setItem("accessToken", data.accessToken);
    await AsyncStorage.setItem("refreshToken", data.refreshToken);
    await AsyncStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // ignore network errors on logout
    }
    await AsyncStorage.multiRemove(["accessToken", "refreshToken", "user"]);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
