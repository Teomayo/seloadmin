declare module "react-dom/client" {
  import { ReactNode } from "react";
  import { Root } from "react-dom";

  export function createRoot(container: Element | DocumentFragment): Root;
}
