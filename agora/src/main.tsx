import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);

// PWA: basic service worker (skipped when embedded or unsupported).
if ("serviceWorker" in navigator && import.meta.env.PROD && window.top === window.self && !window.claude) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
