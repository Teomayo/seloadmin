import { mount } from "cypress/react";
import { MountOptions, MountReturn } from "cypress/react";
import "@testing-library/cypress/add-commands";

declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
      intercept(url: string | RegExp, response?: any): Chainable<null>;
      intercept(
        method: string,
        url: string | RegExp,
        response?: any
      ): Chainable<null>;
    }
  }
}
Cypress.Commands.add("mount", mount as typeof mount);
