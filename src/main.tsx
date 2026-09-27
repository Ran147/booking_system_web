import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/tokens.css";
import { App } from "@/app/App";
import { BOOTSTRAP_ERROR, DOM_ID } from "@/shared/constants";

const rootElement = document.getElementById(DOM_ID.ROOT);

if (!rootElement) {
  throw new Error(BOOTSTRAP_ERROR.MISSING_ROOT_ELEMENT);
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
