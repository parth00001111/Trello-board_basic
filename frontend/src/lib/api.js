import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
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
