declare global {
  interface ProcessEnv {
    API_URL: string;
    BASE_URL: string;
    DJANGO_SECRET_KEY: string;
    HOST_URL: string;
    // Add other environment variables here
  }
}
export {};
