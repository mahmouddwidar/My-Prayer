import React from "react";
import { createRoot } from "react-dom/client";
import OptionsApp from "./OptionsApp";
import { initializeTheme } from "@/utils/themeManager";
// import "./index.css"; // Optional custom CSS

// Initialize theme before rendering
initializeTheme("settings").catch(console.error);

const container = document.getElementById("root");

if (!container) {
	throw new Error("Root element not found");
}

const root = createRoot(container);
root.render(
	<React.StrictMode>
		<OptionsApp />
	</React.StrictMode>,
);
