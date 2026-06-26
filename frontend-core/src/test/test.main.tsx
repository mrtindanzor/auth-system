import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./test.App";

const app = document.getElementById("root");
if (!app) throw new Error("No root element");

createRoot(app).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
