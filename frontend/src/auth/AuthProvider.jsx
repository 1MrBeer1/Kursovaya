import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";

function decodeToken(accessToken) {
  if (!accessToken) return null;

  try {
    const base64 = accessToken.split(".")[1];
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
    const json = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json);

    return {
      username: payload.sub,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("access_token"));
  const [user, setUser] = useState(() => decodeToken(localStorage.getItem("access_token")));

  useEffect(() => {
    setUser(decodeToken(token));
  }, [token]);

  const isAuth = !!token && !!user;

  const login = (accessToken) => {
    localStorage.setItem("access_token", accessToken);
    setToken(accessToken);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
