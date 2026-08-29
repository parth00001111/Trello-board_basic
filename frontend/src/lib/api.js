import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");

const api = axios.create({
  baseURL: configuredApiUrl || "http://localhost:5000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  // Render free services can need extra time for the first request after sleeping.
  timeout: 75000,
});

export const getErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again.",
) => {
  if (error?.code === "ECONNABORTED") {
    return "The server is taking too long to respond. Please try again.";
  }

  return error?.response?.data?.message || error?.message || fallback;
};

export default api;
