// Make this file a module by adding an empty export
export {};

describe("Login Flow", () => {
  beforeEach(() => {
    // Reset any previous state
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it("successfully logs in with valid credentials", () => {
    cy.visit("/login");

    // Intercept the login API call
    cy.intercept("POST", "**/api-token-auth/", {
      statusCode: 200,
      body: {
        token: "test-token",
        user_role: "user",
      },
    }).as("loginRequest");

    // Fill in the login form using exact IDs from Login.tsx
    cy.get("#username").type("user");
    cy.get("#password").type("user123");
    cy.get(".login-button").click();

    // Wait for the login API call
    cy.wait("@loginRequest");

    // Verify we're redirected to the dashboard
    cy.url().should("include", "/");

    // Verify local storage has the token
    cy.window().its("localStorage.token").should("exist");
  });

  it("shows error message with invalid credentials", () => {
    cy.visit("/login");

    // Intercept the login API call with an error
    cy.intercept("POST", "**/api-token-auth/", {
      statusCode: 401,
      body: { error: "Invalid credentials" },
    }).as("loginRequest");

    // Fill in the login form with invalid credentials
    cy.get("#username").type("wronguser");
    cy.get("#password").type("wrongpass");
    cy.get(".login-button").click();

    cy.wait("@loginRequest");

    // Verify error message is shown using the correct class
    cy.get(".error-message").should("contain", "Invalid username or password");
  });
});
