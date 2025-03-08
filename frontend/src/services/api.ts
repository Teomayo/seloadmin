import axios from "axios";
import { User, Contact, Question, UserPreferences } from "../interfaces";
import { auth } from "./firebase"; // Import auth directly
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";

let API_URL: string;
let BASE_URL: string;

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

// Set URLs based on environment
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

// Create axios instance with default config
const api = axios.create({
  baseURL:
    process.env.REACT_APP_ENV_MODE === "development"
      ? process.env.REACT_APP_DEV_BACKEND_URL || "http://localhost:8080"
      : process.env.REACT_APP_PROD_BACKEND_URL ||
        "https://selo-admin-1060694023655.us-central1.run.app",
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

export const login = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    if (!user) {
      throw new Error("Login failed - no user returned");
    }

    localStorage.setItem("uid", user.uid);
    localStorage.setItem("email", email);
    localStorage.setItem("isAuthenticated", "true");

    // Fetch member info which includes preferences
    try {
      const memberDetails = await getMemberInfo(user.uid);
      console.log(memberDetails);
      if (memberDetails[0].is_superuser) {
        localStorage.setItem("userRole", "superuser");
      } else if (memberDetails[0].is_staff) {
        localStorage.setItem("userRole", "staff");
      } else {
        localStorage.setItem("userRole", "member");
      }
      if (memberDetails && memberDetails[0]?.preferences) {
        const { theme, widget_settings } = memberDetails[0].preferences;
        // Set theme
        if (theme) {
          localStorage.setItem("theme", theme);
          document.documentElement.setAttribute("data-theme", theme);
        }

        // Set widget settings
        if (widget_settings) {
          console.log("Setting widget settings from login:", widget_settings);
          localStorage.setItem(
            "widgetSettings",
            JSON.stringify(widget_settings)
          );

          // Dispatch event for real-time updates
          window.dispatchEvent(
            new CustomEvent("widgetSettingsUpdated", {
              detail: widget_settings,
            })
          );
        }
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      // Don't throw here - we still want to complete the login
    }

    return user;
  } catch (error: any) {
    console.error("Login error:", error);
    throw error;
  }
};

export const createUser = async (userData: {
  username: string;
  email: string;
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
    // Send user data to backend to handle both Auth and Firestore creation
    const response = await api.post(`${API_URL}create-user`, userData);

    // Add a small delay to ensure Firestore write has propagated
    await new Promise((resolve) => setTimeout(resolve, 1000));

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

export const getContacts = async (): Promise<Contact[]> => {
  const response = await api.get(`${API_URL}contacts`);
  return response.data;
};

export const createContact = async (
  contactData: Omit<Contact, "id">
): Promise<Contact> => {
  const response = await api.post(`${API_URL}contacts`, contactData);
  return response.data;
};

export const updateContact = async (
  id: string,
  contactData: Partial<Contact>
): Promise<Contact> => {
  const response = await api.put(`${API_URL}contacts/${id}`, contactData);
  return response.data;
};

export const deleteContact = async (id: string): Promise<void> => {
  await api.delete(`${API_URL}contacts/${id}`);
};

// Question Management
export const createQuestion = async (
  questionData: Omit<Question, "id">
): Promise<Question> => {
  const response = await api.post(`${API_URL}questions`, questionData);
  return response.data;
};

export const updateQuestion = async (
  id: string,
  questionData: Partial<Question>
): Promise<Question> => {
  const response = await api.put(`${API_URL}questions/${id}`, questionData);
  return response.data;
};

export const archiveQuestion = async (id: string): Promise<void> => {
  await api.put(`${API_URL}questions/${id}/archive`);
};

export const updateUserPreferences = async (uid: string, preferences: any) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No authenticated user");
    }

    // Get the user's ID token
    const idToken = await user.getIdToken();

    const response = await api.put(
      `${API_URL}users/${uid}/preferences`,
      preferences,
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      }
    );

    // Return true for success, don't try to parse response as JSON
    return true;
  } catch (error) {
    console.error("Error updating user preferences:", error);
    throw error;
  }
};

export default api;
