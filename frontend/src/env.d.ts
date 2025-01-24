declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_URL: string;
      BASE_URL: string;
      NODE_ENV: "development" | "production";
    }
  }
}

export {};
