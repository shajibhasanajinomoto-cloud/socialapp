import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Change this to your deployed backend URL (e.g. https://your-app.onrender.com/api)
export const BASE_URL = "http://localhost:5000/api";

const api = axios.create({ baseURL: BASE_URL });

// Attach access token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If access token expired, use refresh token to get a new one, then retry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        await AsyncStorage.setItem("accessToken", res.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        await AsyncStorage.multiRemove(["accessToken", "refreshToken", "user"]);
        // Navigation to Login should be triggered by AuthContext watching storage/state
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
