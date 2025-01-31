/// <reference types="cypress" />
import Login from "../../src/components/Login";
import { BrowserRouter } from "react-router-dom";

describe("Login Component", () => {
  beforeEach(() => {
    // Mock the API calls
    cy.intercept("POST", "/api/login", (req) => {
      if (
        req.body.username === "testuser" &&
        req.body.password === "password123"
      ) {
        return {
          statusCode: 200,
          body: {
            token: "test-token",
            user_role: "user",
          },
        };
      }
      return {
        statusCode: 401,
        body: { message: "Invalid username or password" },
      };
    }).as("loginRequest");
  });

  it("renders login form correctly", () => {
    cy.mount(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    cy.get("#username").should("exist");
    cy.get("#password").should("exist");
    cy.get(".login-button").should("exist");
    cy.get(".login-form h2").should("contain", "Login");
  });

  it("validates required fields", () => {
    cy.mount(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    cy.get(".login-button").click();

    // Check validation messages
    cy.get("#username")
      .invoke("prop", "validationMessage")
      .should("equal", "Please fill out this field.");

    cy.get("#password")
      .invoke("prop", "validationMessage")
      .should("equal", "Please fill out this field.");
  });

  it("handles form input changes", () => {
    cy.mount(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    cy.get("#username").type("testuser");
    cy.get("#username").should("have.value", "testuser");

    cy.get("#password").type("password123");
    cy.get("#password").should("have.value", "password123");
  });

  it("handles login failure", () => {
    cy.mount(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    cy.get("#username").type("wronguser");
    cy.get("#password").type("wrongpass");
    cy.get(".login-button").click();
    cy.get(".error-message").should("exist");

    cy.get(".error-message").contains("Invalid username or password");
  });
});
