import axios from "axios";
import { User } from "../interfaces";

const API_URL = process.env.API_URL || "http://localhost:8080/api/";
const BASE_URL = process.env.BASE_URL || "http://localhost:8080/";

if (!API_URL || !BASE_URL) {
  console.warn("Environment variables not properly loaded!");
}

console.log("API_URL:", API_URL);
console.log("BASE_URL:", BASE_URL);

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

interface Question {
  id: number;
  text: string;
  created_at: string;
  choices: Choice[];
}

interface Choice {
  id: number;
  text: string;
  votes: number;
  question_id: number;
}

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
    const response = await axios.post(
      `${API_URL}create-user/`,
      userData,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const getQuestions = async () => {
  try {
    const response = await axios.get(`${API_URL}questions/`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error("Error fetching questions:", error);
    throw error;
  }
};

export const getChoices = async (questionId: number) => {
  const response = await axios.get(
    `${API_URL}questions/${questionId}/choices/`,
    getAuthHeaders()
  );
  return response.data;
};

export const voteForChoice = async (choiceId: number) => {
  const response = await axios.post(
    `${API_URL}choices/${choiceId}/vote/`,
    {},
    getAuthHeaders()
  );
  return response;
};

export const getMembersCount = async () => {
  const response = await axios.get(
    `${API_URL}members/count/`,
    getAuthHeaders()
  );
  return response.data.count;
};

export const login = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${BASE_URL}api-token-auth/`, {
      username,
      password,
    });
    console.log("Login response:", response.data);

    // If we get here, the request was successful
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("userName", username);
    if (response.data.user_role === "superuser") {
      localStorage.setItem("userRole", "superuser");
    } else if (response.data.user_role === "staff") {
      localStorage.setItem("userRole", "staff");
    } else {
      localStorage.setItem("userRole", "user");
    }
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    throw new Error("Invalid username or password");
  }
};

export const getMembers = async () => {
  const response = await axios.get(`${API_URL}members/`, getAuthHeaders());
  return response.data;
};

export const getMemberInfo = async (username: string) => {
  const response = await axios.get(
    `${API_URL}members/${username}/`,
    getAuthHeaders()
  );
  return response.data;
};

export const updateMemberInfo = async (
  username: string,
  updatedInfo: { email: string; phone_number: string; occupation: string }
) => {
  try {
    const response = await axios.put(
      `${API_URL}members/${username}/`,
      updatedInfo,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error("Error updating member info:", error);
    throw error;
  }
};

export const updatePassword = async (
  username: string,
  passwordData: { currentPassword: string; newPassword: string }
) => {
  const response = await axios.put(
    `${API_URL}members/${username}/password/`,
    passwordData,
    getAuthHeaders()
  );
  return response.data;
};

export const logout = async () => {
  // small workaround for visual settings
  const currentTheme: string = localStorage.getItem("theme") || "light";
  localStorage.setItem("theme", currentTheme);
  window.location.href = "/login";
};

export const getUsers = async (): Promise<User[]> => {
  const response = await axios.get(`${API_URL}users/`, getAuthHeaders());

  return response.data;
};

export const updateUser = async (username: string, userData: any) => {
  const response = await axios.put(
    `${API_URL}update-user/${username}/`,
    userData,
    getAuthHeaders()
  );
  return response.data;
};

export const deleteUser = async (username: string) => {
  const response = await axios.delete(
    `${API_URL}delete-user/${username}/`,
    getAuthHeaders()
  );
  return response.data;
};
