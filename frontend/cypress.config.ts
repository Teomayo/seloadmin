import { defineConfig } from "cypress";
import webpackConfig from "./webpack.config"; // Ensure this file has a TypeScript declaration

export default defineConfig({
  projectId: "pe5uaa",
  e2e: {
    baseUrl: process.env.BASE_URL || "http://localhost:3000", // Use environment variable for baseUrl
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
      webpackConfig: {
        ...webpackConfig,
        devServer: {
          port: 3001,
          proxy: {
            "/api": {
              target: "http://localhost:8080",
              secure: false,
              changeOrigin: true,
            },
          },
        },
      },
    },
    indexHtmlFile: "cypress/support/component-index.html",
    supportFile: "cypress/support/component.ts",
  },
  env: {
    apiUrl: "http://localhost:8080/api",
  },
});
