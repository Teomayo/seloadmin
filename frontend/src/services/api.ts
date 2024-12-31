import axios from "axios";

const API_URL = process.env.API_URL;
const BASE_URL = process.env.BASE_URL;

console.log("API_URL:", API_URL);
console.log("BASE_URL:", BASE_URL);

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Token ${token}`,
    },
  };
};

export const getQuestions = async () => {
  const response = await axios.get(`${API_URL}questions/`, getAuthHeaders());
  return response.data;
};

export const getChoices = async (questionId: number) => {
  const response = await axios.get(
    `${API_URL}questions/${questionId}/choices/`,
    getAuthHeaders()
  );
  return response.data;
};

export const voteForChoice = async (choiceId: number) => {
  const response = await axios.post(`${API_URL}choices/${choiceId}/vote/`);
  return response;
};

export const getMembersCount = async () => {
  const response = await axios.get(`${API_URL}members/count/`);
  return response.data.count;
};

export const login = async (username: string, password: string) => {
  const response = await axios.post(`${BASE_URL}api-token-auth/`, {
    username,
    password,
  });
  if (response.status !== 200) {
    throw new Error("Invalid username or password");
  } else {
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("userName", username);
    return response.data;
  }
};

export const logout = async () => {
  // small workaround for visual settings
  const currentTheme: string = localStorage.getItem("theme") || "light";
  localStorage.clear();
  localStorage.setItem("theme", currentTheme);
  window.location.href = "/login";
};
