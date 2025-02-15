import axios from "axios";
import { User } from "../interfaces";
import { auth } from "./firebase"; // Import auth directly
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

let API_URL: string;
let BASE_URL: string =
  process.env.REACT_APP_BASE_URL || "http://localhost:3000"; // Set a default BASE_URL
// Add persistence for auth state
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("email", user.email || "");
    localStorage.setItem("uid", user.uid);
  } else {
    // User is signed out
    const currentTheme = localStorage.getItem("theme");
    localStorage.clear();
    if (currentTheme) {
      localStorage.setItem("theme", currentTheme);
    }
  }
});

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_DEV_BACKEND_URL || "http://localhost:8080",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Modify request interceptor to handle token refresh
api.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken(true); // Force token refresh if needed
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  } catch (error) {
    console.error("Error in request interceptor:", error);
    return config;
  }
});

// Modify response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Only logout if the user is actually logged in and the token is invalid
      const user = auth.currentUser;
      if (user) {
        try {
          // Try to refresh the token first
          await user.getIdToken(true);
          // If successful, retry the request
          const originalRequest = error.config;
          return api(originalRequest);
        } catch (refreshError) {
          // If refresh fails, then logout
          console.error("Token refresh failed:", refreshError);
          await signOut(auth);
          window.location.href = "/login";
        }
      }
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
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const idToken = await userCredential.user.getIdToken();

    // Set the token in the authorization header
    api.defaults.headers.common["Authorization"] = `Bearer ${idToken}`;

    try {
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
  first_name: string;
  last_name: string;
  position?: string;
  phone_number?: string;
  occupation?: string;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  paid?: boolean;
  last_login?: string;
  date_joined?: string;
}) => {
  try {
    // Create user in Firebase Auth and Firestore
    const response = await api.post(`${API_URL}create-user`, userData);

    // The backend will handle:
    // 1. Creating the user in Firebase Auth
    // 2. Creating the user document in Firestore
    // 3. Setting up custom claims for staff/superuser status

    return response.data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const getQuestions = async () => {
  try {
    const response = await api.get(`${API_URL}questions`);
    return response.data;
  } catch (error) {
    console.error("Error fetching questions:", error);
    throw error;
  }
};

export const getChoices = async (questionId: number) => {
  const response = await api.get(`${API_URL}questions/${questionId}/choices`);
  return response.data;
};

export const voteForChoice = async (choiceId: string) => {
  const response = await api.post(`${API_URL}choices/${choiceId}/vote`);
  return response;
};

export const getMembersCount = async () => {
  const response = await api.get(`${API_URL}members/count`);
  return response.data.count;
};

export const getMembers = async () => {
  const response = await api.get(`${API_URL}members`);
  return response.data;
};

export const getMemberInfo = async (uid: string) => {
  try {
    // Get the current user from Firebase Auth
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No authenticated user");
    }

    // Get a fresh token
    const token = await user.getIdToken(true);
    const response = await api.get(`${API_URL}members/${uid}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error getting member info:", error);
    throw error;
  }
};

export const updateMemberInfo = async (
  uid: string,
  updatedInfo: { email: string; phone_number: string; occupation: string }
) => {
  const response = await api.put(
    `${API_URL}members/${uid}/update`,
    updatedInfo
  );
  return response.data;
};

export const updatePassword = async (
  uid: string,
  passwordData: { currentPassword: string; newPassword: string }
) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No authenticated user");
    }

    // Debug log to check payload
    console.log("Password update payload:", {
      newPassword: passwordData.newPassword ? "exists" : "missing",
    });

    const token = await user.getIdToken(true);

    const response = await api.put(
      `${API_URL}users/${uid}/password`,
      {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error updating password:", error);
    throw error;
  }
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
  try {
    // Get current user and token
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No authenticated user");
    }

    // Wait for token to be available
    const token = await user.getIdToken(true);

    const response = await api.get(`${API_URL}users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.data) {
      throw new Error("No data received from server");
    }

    console.log("Raw user data:", response.data); // Debug log
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

interface UpdateUserData {
  email?: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  phone_number?: string;
  occupation?: string;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  paid?: boolean;
}

export const updateUser = async (uid: string, userData: UpdateUserData) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No authenticated user");
    }
    const token = await user.getIdToken(true);

    // Create update payload without email
    const userDataToUpdate = {
      first_name: userData.first_name,
      last_name: userData.last_name,
      position: userData.position,
      phone_number: userData.phone_number,
      occupation: userData.occupation,
      is_active: userData.is_active,
      is_staff: userData.is_staff,
      is_superuser: userData.is_superuser,
      paid: userData.paid,
    };

    // Update main user data first
    const hasUpdates = Object.values(userDataToUpdate).some(
      (value) => value !== undefined
    );
    if (hasUpdates) {
      await api.put(`${API_URL}users/${uid}`, userDataToUpdate, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    // If email is changed, update it separately
    if (userData.email) {
      await api.put(
        `${API_URL}users/${uid}/email`,
        {
          newEmail: userData.email,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    }

    return true;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// Separate function for email updates if needed elsewhere
export const updateUserEmail = async (uid: string, newEmail: string) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No authenticated user");
    }
    const token = await user.getIdToken(true);

    await api.put(
      `${API_URL}users/${uid}/email`,
      {
        newEmail,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return true;
  } catch (error) {
    console.error("Error updating email:", error);
    throw error;
  }
};

export const deleteUser = async (uid: string) => {
  try {
    // Get current user and token
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No authenticated user");
    }

    // Wait for token to be available
    const token = await user.getIdToken(true);

    // Match the backend route exactly and handle empty response
    await api.delete(`${API_URL}delete-user/${uid}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Don't check for response.data as DELETE often returns no content
    return true; // Return success boolean instead of expecting data
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export default api;
