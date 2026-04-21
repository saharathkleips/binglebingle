import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

import { App } from "./components/app/App";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error('Root element not found. Ensure index.html has <div id="root">.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
