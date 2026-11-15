import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/archivo-black/400.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/800.css";
import { App } from "./App";
import "./estilo.css";

createRoot(document.getElementById("app")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
