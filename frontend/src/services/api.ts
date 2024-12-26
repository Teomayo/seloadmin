import axios from "axios";
import "dotenv/config";

const API_URL = process.env.API_URL;
const BASE_URL = process.env.BASE_URL;

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
  const response = await axios.post(
    `${API_URL}choices/${choiceId}/vote/`,
    { choiceId },
    getAuthHeaders()
  );
  return response;
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
  localStorage.clear();
  window.location.href = "/login";
};
