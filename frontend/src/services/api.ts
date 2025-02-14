import axios from "axios";
import { User } from "../interfaces";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";

let API_URL: string;
let BASE_URL: string;

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_DEV_BACKEND_URL || "http://localhost:8080",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to add Firebase ID token
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    if (error.response?.status === 401) {
      // Handle unauthorized error (e.g., redirect to login)
      signOut(auth);
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

if (process.env.REACT_APP_ENV_MODE === "development") {
  API_URL =
    `${process.env.REACT_APP_DEV_BACKEND_URL}/api/` ||
    "http://localhost:8080/api/";
  BASE_URL = process.env.REACT_APP_DEV_BACKEND_URL || "http://localhost:8080/";
} else {
  API_URL =
    `${process.env.REACT_APP_PROD_BACKEND_URL}/api/` ||
    "https://selo-admin-1060694023655.us-central1.run.app/api/";
  BASE_URL =
    process.env.REACT_APP_PROD_BACKEND_URL ||
    "https://selo-admin-1060694023655.us-central1.run.app/";
}

if (!API_URL || !BASE_URL) {
  console.warn("Environment variables not properly loaded!");
}

console.log("Environment Mode:", process.env.REACT_APP_ENV_MODE);
console.log("API_URL:", API_URL);
console.log("BASE_URL:", BASE_URL);

export const login = async (email: string, password: string) => {
  try {
    // First, authenticate with Firebase
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const idToken = await userCredential.user.getIdToken();

    // Set the token in the authorization header
    api.defaults.headers.common["Authorization"] = `Bearer ${idToken}`;

    try {
      // Get user role and additional info from backend
      const response = await api.get(`${API_URL}profile`);
      const userRole = response.data.is_superuser
        ? "superuser"
        : response.data.is_staff
        ? "staff"
        : "user";

      // Store user info in localStorage
      localStorage.setItem("email", email);
      localStorage.setItem("userRole", userRole);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("uid", userCredential.user.uid);

      return {
        token: idToken,
        user_role: userRole,
        isAuthenticated: true,
        ...response.data,
      };
    } catch (error) {
      // If backend call fails, still consider the user logged in
      // but with basic user role
      console.warn("Could not fetch user profile, using basic role:", error);
      const userRole = "user";
      localStorage.setItem("email", email);
      localStorage.setItem("userRole", userRole);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("uid", userCredential.user.uid);

      return {
        token: idToken,
        user_role: userRole,
        isAuthenticated: true,
        email: email,
      };
    }
  } catch (error: any) {
    console.error("Login error:", error);
    if (error.code === "auth/invalid-credential") {
      throw new Error("Invalid email or password");
    }
    throw error;
  }
};

export const createUser = async (userData: {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  position?: string;
  phoneNumber?: string;
  occupation?: string;
  isActive?: boolean;
  isStaff?: boolean;
  isSuperUser?: boolean;
  paid?: boolean;
  lastLogin?: string;
  dateJoined?: string;
}) => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    const idToken = await userCredential.user.getIdToken();

    // Create user in backend with additional data
    const response = await api.post(`${API_URL}create-user/`, {
      ...userData,
      uid: userCredential.user.uid,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const getQuestions = async () => {
  try {
    const response = await api.get(`${API_URL}questions/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching questions:", error);
    throw error;
  }
};

export const getChoices = async (questionId: number) => {
  const response = await api.get(`${API_URL}questions/${questionId}/choices/`);
  return response.data;
};

export const voteForChoice = async (choiceId: number) => {
  const response = await api.post(`${API_URL}choices/${choiceId}/vote/`);
  return response;
};

export const getMembersCount = async () => {
  const response = await api.get(`${API_URL}members/count/`);
  return response.data.count;
};

export const getMembers = async () => {
  const response = await api.get(`${API_URL}members/`);
  return response.data;
};

export const getMemberInfo = async (username: string) => {
  const response = await api.get(`${API_URL}members/${username}/`);
  return response.data;
};

export const updateMemberInfo = async (
  username: string,
  updatedInfo: { email: string; phone_number: string; occupation: string }
) => {
  const response = await api.put(`${API_URL}members/${username}/`, updatedInfo);
  return response.data;
};

export const updatePassword = async (
  username: string,
  passwordData: { currentPassword: string; newPassword: string }
) => {
  const response = await api.put(
    `${API_URL}members/${username}/password/`,
    passwordData
  );
  return response.data;
};

export const logout = async () => {
  try {
    await signOut(auth);
    const currentTheme: string = localStorage.getItem("theme") || "light";
    localStorage.clear();
    localStorage.setItem("theme", currentTheme);
    return "/login";
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};

export const getUsers = async (): Promise<User[]> => {
  const response = await api.get(`${API_URL}users/`);

  return response.data;
};

export const updateUser = async (username: string, userData: any) => {
  const response = await api.put(
    `${API_URL}update-user/${username}/`,
    userData
  );
  return response.data;
};

export const deleteUser = async (username: string) => {
  const response = await api.delete(`${API_URL}delete-user/${username}/`);
  return response.data;
};

export default api;
