import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./style.css";
import { initializeTheme } from "@/utils/themeManager";

// Initialize theme before rendering
initializeTheme("settings").catch(console.error);

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
