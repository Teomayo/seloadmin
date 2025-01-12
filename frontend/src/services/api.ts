import axios from "axios";

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

export const getQuestions = async () => {
  try {
    const response = await axios.get(`${API_URL}questions/`, getAuthHeaders());
    console.log("Questions API response:", response.data);
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
  const response = await axios.get(`${API_URL}members/count/`);
  return response.data.count;
};

export const login = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${BASE_URL}api-token-auth/`, {
      username,
      password,
    });

    // If we get here, the request was successful
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("userName", username);
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    throw new Error("Invalid username or password");
  }
};

export const logout = async () => {
  // small workaround for visual settings
  const currentTheme: string = localStorage.getItem("theme") || "light";
  localStorage.clear();
  localStorage.setItem("theme", currentTheme);
  window.location.href = "/login";
};
