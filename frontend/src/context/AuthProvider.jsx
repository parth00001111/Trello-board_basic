import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../lib/api";
import AuthContext from "./auth-context";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const sessionRequest = useRef(0);

  const refreshSession = useCallback(async ({ showLoading = false } = {}) => {
    const requestId = ++sessionRequest.current;
    if (showLoading) setLoading(true);
    setSessionError("");
    try {
      const { data } = await api.get("/me");
      if (requestId === sessionRequest.current) setUser(data.user);
      return data.user;
    } catch (error) {
      if (requestId === sessionRequest.current) {
        if (error.response?.status === 401) {
          setUser(null);
        } else {
          setSessionError("We couldn’t verify your session. Check your connection and try again.");
        }
      }
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
        if (active && requestId === sessionRequest.current) {
          setUser(data.user);
          setSessionError("");
        }
      })
      .catch((error) => {
        if (active && requestId === sessionRequest.current) {
          if (error.response?.status === 401) {
            setUser(null);
          } else {
            setSessionError("We couldn’t verify your session. Check your connection and try again.");
          }
        }
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
          setSessionError("");
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
    setSessionError("");
  }, []);

  const value = useMemo(
    () => ({ user, loading, sessionError, refreshSession, clearSession }),
    [user, loading, sessionError, refreshSession, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
