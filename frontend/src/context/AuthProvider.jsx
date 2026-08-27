import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../lib/api";
import AuthContext from "./auth-context";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const sessionRequest = useRef(0);

  const refreshSession = useCallback(async () => {
    const requestId = ++sessionRequest.current;
    try {
      const { data } = await api.get("/me");
      if (requestId === sessionRequest.current) setUser(data.user);
      return data.user;
    } catch {
      if (requestId === sessionRequest.current) setUser(null);
      return null;
    } finally {
      if (requestId === sessionRequest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const requestId = ++sessionRequest.current;

    api
      .get("/me")
      .then(({ data }) => {
        if (active && requestId === sessionRequest.current) setUser(data.user);
      })
      .catch(() => {
        if (active && requestId === sessionRequest.current) setUser(null);
      })
      .finally(() => {
        if (active && requestId === sessionRequest.current) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          sessionRequest.current += 1;
          setUser(null);
          setLoading(false);
        }
        return Promise.reject(error);
      },
    );

    return () => api.interceptors.response.eject(interceptor);
  }, []);

  const clearSession = useCallback(() => {
    sessionRequest.current += 1;
    setUser(null);
    setLoading(false);
  }, []);

  const value = useMemo(
    () => ({ user, loading, refreshSession, clearSession }),
    [user, loading, refreshSession, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
